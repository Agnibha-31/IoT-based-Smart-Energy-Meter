import { DateTime } from 'luxon';

const toNumber = (value) =>
  value === null || value === undefined || Number.isNaN(Number(value))
    ? null
    : Number(value);

const avg = (values = []) => {
  const filtered = values.filter((v) => v !== null && v !== undefined);
  if (!filtered.length) return null;
  return filtered.reduce((acc, val) => acc + val, 0) / filtered.length;
};

const sum = (values = []) =>
  values.filter((v) => v !== null && v !== undefined)
    .reduce((acc, val) => acc + val, 0);

const rms = (values = []) => {
  const filtered = values.filter((v) => v !== null && v !== undefined);
  if (!filtered.length) return null;
  const meanSquares = filtered.reduce((acc, val) => acc + val ** 2, 0) / filtered.length;
  return Math.sqrt(meanSquares);
};

export const bucketizeReadings = (readings, intervalSeconds) => {
  if (!readings.length) return [];
  const buckets = new Map();
  readings.forEach((reading) => {
    const bucketKey = Math.floor(reading.captured_at / intervalSeconds) * intervalSeconds;
    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, []);
    }
    buckets.get(bucketKey).push(reading);
  });
  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([timestamp, rows]) => ({
      timestamp,
      voltage: avg(rows.map((r) => toNumber(r.voltage))),
      peakVoltage: Math.max(...rows.map((r) => toNumber(r.voltage) ?? -Infinity)),
      minVoltage: Math.min(...rows.map((r) => toNumber(r.voltage) ?? Infinity)),
      current: avg(rows.map((r) => toNumber(r.current))),
      realPower: avg(rows.map((r) => toNumber(r.real_power_kw))),
      energy: sum(rows.map((r) => toNumber(r.energy_kwh))),
      powerFactor: avg(rows.map((r) => toNumber(r.power_factor))),
    }));
};

const estimateEnergy = (readings) => {
  const cumulative = readings
    .map((r) => toNumber(r.total_energy_kwh))
    .filter((v) => v !== null);
  if (cumulative.length >= 2) {
    return Math.max(...cumulative) - Math.min(...cumulative);
  }

  let energy = 0;
  for (let i = 1; i < readings.length; i += 1) {
    const previous = readings[i - 1];
    const current = readings[i];
    const powerPrev = toNumber(previous.real_power_kw);
    const powerCurr = toNumber(current.real_power_kw);
    if (powerPrev === null || powerCurr === null) continue;
    const deltaHours = (current.captured_at - previous.captured_at) / 3600;
    const avgPower = (powerPrev + powerCurr) / 2;
    energy += avgPower * deltaHours;
  }
  return energy;
};

const splitEnergyByPeriod = (readings, timezone = 'UTC') => {
  const buckets = { peak: 0, offPeak: 0, shoulder: 0 };
  readings.forEach((reading, index) => {
    if (index === 0) return;
    const prev = readings[index - 1];
    const energyDelta = toNumber(reading.total_energy_kwh) != null && toNumber(prev.total_energy_kwh) != null
      ? toNumber(reading.total_energy_kwh) - toNumber(prev.total_energy_kwh)
      : null;
    if (energyDelta === null || energyDelta < 0) return;
    const hour = DateTime.fromSeconds(reading.captured_at, { zone: timezone }).hour;
    let bucket = 'shoulder';
    if (hour >= 17 && hour < 22) bucket = 'peak';
    else if (hour >= 0 && hour < 6) bucket = 'offPeak';
    buckets[bucket] += energyDelta;
  });
  const total = buckets.peak + buckets.offPeak + buckets.shoulder || 1;
  return {
    peak: Number((buckets.peak / total * 100).toFixed(2)),
    offPeak: Number((buckets.offPeak / total * 100).toFixed(2)),
    shoulder: Number((buckets.shoulder / total * 100).toFixed(2)),
  };
};

const renewableShare = (readings, timezone = 'UTC') => {
  let renewableEnergy = 0;
  let total = 0;
  readings.forEach((reading, index) => {
    if (index === 0) return;
    const prev = readings[index - 1];
    const energyDelta = toNumber(reading.total_energy_kwh) != null && toNumber(prev.total_energy_kwh) != null
      ? toNumber(reading.total_energy_kwh) - toNumber(prev.total_energy_kwh)
      : null;
    if (energyDelta === null || energyDelta < 0) return;
    total += energyDelta;
    const hour = DateTime.fromSeconds(reading.captured_at, { zone: timezone }).hour;
    if (hour >= 10 && hour < 16) {
      renewableEnergy += energyDelta;
    }
  });
  if (!total) return 0;
  return Number(((renewableEnergy / total) * 100).toFixed(2));
};

const efficiencyScore = ({ pfAvg, loadFactor }) => {
  const pfScore = pfAvg != null ? pfAvg : 0;
  const lfScore = loadFactor != null ? loadFactor : 0;
  return Math.round(((pfScore + lfScore) / 2) * 100);
};

const buildInsights = ({ peakVoltage, minVoltage, pfAvg, loadFactor, energy }) => {
  const insights = [];
  if (peakVoltage > 245) insights.push('Voltage spikes detected above 245V. Investigate transformer tap settings.');
  if (minVoltage < 205) insights.push('Low voltage events below 205V observed. Check feeder loading.');
  if (pfAvg < 0.92) insights.push('Average power factor below 0.92. Consider capacitor bank tuning.');
  if (loadFactor < 0.65) insights.push('Load factor under 65%. Flatten demand curve to improve utilization.');
  if (energy > 200) insights.push('High daily energy usage recorded. Review shift schedules.');
  if (!insights.length) insights.push('System operating within optimal envelopes.');
  return insights;
};

export const buildSummary = (readings, { timezone = 'UTC', intervalSeconds = 3600 } = {}) => {
  if (!readings.length) {
    return {
      totals: {},
      averages: {},
      peaks: {},
      lows: {},
      rmsCurrent: null,
      loadFactor: null,
      voltageHistory: [],
      energySplit: { peak: 0, offPeak: 0, shoulder: 0 },
      renewableShare: 0,
      efficiencyScore: 0,
      powerDistribution: { real: 0, reactive: 0, apparent: 0 },
      insights: ['No telemetry available for the selected period.'],
    };
  }

  const voltages = readings.map((r) => toNumber(r.voltage)).filter((v) => v != null);
  const currents = readings.map((r) => toNumber(r.current)).filter((v) => v != null);
  const realPower = readings.map((r) => toNumber(r.real_power_kw)).filter((v) => v != null);
  const apparentPower = readings.map((r) => toNumber(r.apparent_power_kva)).filter((v) => v != null);
  const reactivePower = readings.map((r) => toNumber(r.reactive_power_kvar)).filter((v) => v != null);
  const pfValues = readings.map((r) => toNumber(r.power_factor)).filter((v) => v != null);

  const totalEnergy = estimateEnergy(readings);
  const avgVoltage = voltages.length ? avg(voltages) : null;
  const avgCurrent = currents.length ? avg(currents) : null;
  const avgPower = realPower.length ? avg(realPower) : null;
  const pfAvg = pfValues.length ? avg(pfValues) : null;
  const peakPower = realPower.length ? Math.max(...realPower) : null;
  const loadFactor = peakPower ? Number(((avgPower || 0) / peakPower).toFixed(3)) : null;

  const voltageHistory = bucketizeReadings(readings, intervalSeconds).map((bucket) => ({
    timestamp: bucket.timestamp,
    voltage: bucket.voltage,
    peak: bucket.peakVoltage,
    minimum: bucket.minVoltage,
  }));

  const energySplit = splitEnergyByPeriod(readings, timezone);
  const renewablePct = renewableShare(readings, timezone);
  const efficiency = efficiencyScore({ pfAvg: pfAvg ?? 0, loadFactor: loadFactor ?? 0 });

  const realTotal = sum(realPower);
  const reactiveTotal = sum(reactivePower);
  const apparentTotal = sum(apparentPower);
  const distTotal = realTotal + reactiveTotal + apparentTotal || 1;

  return {
    totals: {
      energy_kwh: Number(totalEnergy.toFixed(3)),
      voltage_vh: voltages.length ? Number((avgVoltage * voltages.length).toFixed(2)) : null,
      current_ah: currents.length ? Number((avgCurrent * currents.length).toFixed(2)) : null,
      real_power_kwh: Number((avgPower * readings.length).toFixed(2)),
    },
    averages: {
      voltage: avgVoltage != null ? Number(avgVoltage.toFixed(2)) : null,
      current: avgCurrent != null ? Number(avgCurrent.toFixed(2)) : null,
      power_kw: avgPower != null ? Number(avgPower.toFixed(3)) : null,
      pf: pfAvg != null ? Number(pfAvg.toFixed(3)) : null,
    },
    peaks: {
      voltage: voltages.length ? Number(Math.max(...voltages).toFixed(2)) : null,
      current: currents.length ? Number(Math.max(...currents).toFixed(2)) : null,
      power_kw: peakPower != null ? Number(peakPower.toFixed(2)) : null,
    },
    lows: {
      voltage: voltages.length ? Number(Math.min(...voltages).toFixed(2)) : null,
      current: currents.length ? Number(Math.min(...currents).toFixed(2)) : null,
    },
    rmsCurrent: rms(currents) != null ? Number(rms(currents).toFixed(3)) : null,
    loadFactor,
    voltageHistory,
    energySplit,
    renewableShare: renewablePct,
    efficiencyScore: efficiency,
    powerDistribution: {
      real: Number(((realTotal / distTotal) * 100).toFixed(2)),
      reactive: Number(((reactiveTotal / distTotal) * 100).toFixed(2)),
      apparent: Number(((apparentTotal / distTotal) * 100).toFixed(2)),
    },
    insights: buildInsights({
      peakVoltage: voltages.length ? Math.max(...voltages) : 0,
      minVoltage: voltages.length ? Math.min(...voltages) : 0,
      pfAvg: pfAvg ?? 1,
      loadFactor: loadFactor ?? 1,
      energy: totalEnergy,
    }),
  };
};

export const buildCostProjection = (readings, { baseTariff, currencySymbol = '₹' }) => {
  const energy = estimateEnergy(readings);
  const hourlyCost = energy * (baseTariff / Math.max(readings.length, 1));
  return {
    energy_kwh: Number(energy.toFixed(3)),
    baseRate: baseTariff,
    hourly: Number((hourlyCost).toFixed(2)),
    daily: Number((energy * baseTariff).toFixed(2)),
    monthly: Number((energy * baseTariff * 30).toFixed(2)),
    yearly: Number((energy * baseTariff * 365).toFixed(2)),
    currencySymbol,
  };
};

