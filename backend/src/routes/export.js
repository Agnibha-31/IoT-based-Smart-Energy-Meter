import { Router } from 'express';
import { randomUUID } from 'crypto';
import { stringify } from 'csv-stringify/sync';
import ExcelJS from 'exceljs';
import config from '../config.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { readingsInRange } from '../services/readingService.js';
import { resolveRange } from '../utils/time.js';
import { db } from '../db-postgres.js';

const router = Router();

const metricCatalogue = {
  voltage: { label: 'Voltage (V)', field: 'voltage', convertFromKilo: false },
  current: { label: 'Current (A)', field: 'current', convertFromKilo: false },
  real_power_kw: { label: 'Real Power (W)', field: 'real_power_kw', convertFromKilo: true },
  apparent_power_kva: { label: 'Apparent Power (VA)', field: 'apparent_power_kva', convertFromKilo: true },
  reactive_power_kvar: { label: 'Reactive Power (VAR)', field: 'reactive_power_kvar', convertFromKilo: true },
  energy_kwh: { label: 'Energy (Wh)', field: 'energy_kwh', convertFromKilo: true },
  total_energy_kwh: { label: 'Total Energy (Wh)', field: 'total_energy_kwh', convertFromKilo: true },
  frequency: { label: 'Frequency (Hz)', field: 'frequency', convertFromKilo: false },
  power_factor: { label: 'Power Factor', field: 'power_factor', convertFromKilo: false },
};

const samplingIntervals = {
  all: 0,
  '1min': 60,
  '5min': 300,
  '15min': 900,
  '1hour': 3600,
  '1day': 86400,
};

const filterMetrics = (requested) => {
  if (!requested?.length) {
    return ['voltage', 'current', 'real_power_kw', 'energy_kwh', 'power_factor'];
  }
  return requested.filter((key) => metricCatalogue[key]);
};

const applySampling = (rows, rateKey) => {
  const interval = samplingIntervals[rateKey] ?? 0;
  if (!interval) return rows;
  const result = [];
  let lastTimestamp = 0;
  rows.forEach((row) => {
    if (!lastTimestamp || row.captured_at - lastTimestamp >= interval) {
      result.push(row);
      lastTimestamp = row.captured_at;
    }
  });
  return result;
};

const buildDataset = (rows, metrics) =>
  rows.map((row) => {
    const record = {
      timestamp: row.captured_at,
      iso8601: new Date(row.captured_at * 1000).toISOString(),
    };
    metrics.forEach((metric) => {
      const metricInfo = metricCatalogue[metric];
      let value = row[metricInfo.field];
      
      // Convert from kilo units to base units (kW -> W, kWh -> Wh, kVA -> VA, kVAR -> VAR)
      if (metricInfo.convertFromKilo && typeof value === 'number') {
        value = value * 1000;
      }
      
      record[metric] = value;
    });
    return record;
  });

router.get(
  '/preview',
  requireAuth,
  asyncHandler(async (req, res) => {
    const deviceId = req.query.device_id || config.deviceDefaultId;
    
    // Verify device belongs to user
    const { getDeviceByIdAndUser } = await import('../services/deviceService.js');
    const device = await getDeviceByIdAndUser(deviceId, req.user.id);
    if (!device) {
      return res.status(403).json({ error: 'Access denied to this device' });
    }
    
    const metrics = filterMetrics(req.query.metrics?.split(','));
    const sampling = req.query.sampling || '5min';
    const { from, to } = resolveRange({
      period: req.query.period || 'day',
      from: req.query.from,
      to: req.query.to,
      timezone: req.user?.timezone || 'UTC',
    });
    const rows = await readingsInRange(deviceId, from, to);
    const sampled = applySampling(rows, sampling).slice(0, 500);
    res.json({
      device_id: deviceId,
      from,
      to,
      metrics,
      sampling,
      points: buildDataset(sampled, metrics),
    });
  }),
);

router.get(
  '/readings',
  requireAuth,
  asyncHandler(async (req, res) => {
    const format = (req.query.format || 'csv').toLowerCase();
    const deviceId = req.query.device_id || config.deviceDefaultId;
    
    // Verify device belongs to user
    const { getDeviceByIdAndUser } = await import('../services/deviceService.js');
    const device = await getDeviceByIdAndUser(deviceId, req.user.id);
    if (!device) {
      return res.status(403).json({ error: 'Access denied to this device' });
    }
    
    const metrics = filterMetrics(req.query.metrics?.split(','));
    const sampling = req.query.sampling || 'all';
    const includeMetadata = req.query.include_metadata === 'true';

    const { from, to } = resolveRange({
      period: req.query.period || 'week',
      from: req.query.from,
      to: req.query.to,
      timezone: req.user?.timezone || 'UTC',
    });

    const rows = await readingsInRange(deviceId, from, to);
    const sampled = applySampling(rows, sampling);
    const dataset = buildDataset(sampled, metrics);

    const filename = `smartmeter_${deviceId}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Readings');
      const header = ['Timestamp', 'ISO Time', ...metrics.map((metric) => metricCatalogue[metric].label)];
      worksheet.addRow(header);
      dataset.forEach((row) => {
        worksheet.addRow([
          row.timestamp,
          row.iso8601,
          ...metrics.map((metric) => row[metric]),
        ]);
      });
      if (includeMetadata) {
        const metadataSheet = workbook.addWorksheet('Metadata');
        metadataSheet.addRows([
          ['Device ID', deviceId],
          ['Range', `${from} - ${to}`],
          ['Metrics', metrics.join(', ')],
          ['Sampling', sampling],
          ['Exported At', new Date().toISOString()],
        ]);
      }
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      await workbook.xlsx.write(res);
      res.end();
    } else {
      const columns = [
        { key: 'timestamp', header: 'Timestamp (epoch)' },
        { key: 'iso8601', header: 'ISO 8601' },
        ...metrics.map((metric) => ({
          key: metric,
          header: metricCatalogue[metric].label,
        })),
      ];
      const records = dataset.map((row) =>
        columns.map((col) => row[col.key]),
      );
      const csv = stringify(
        [
          columns.map((col) => col.header),
          ...records,
        ],
        { delimiter: ',' },
      );
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    }

    await db.run(
      `INSERT INTO exports (id, user_id, format, metrics, range_from, range_to, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        req.user.id,
        format,
        metrics.join(','),
        from,
        to,
        Math.floor(Date.now() / 1000),
      ],
    );
  }),
);

export default router;

