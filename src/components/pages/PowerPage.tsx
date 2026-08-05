import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Power, TrendingUp, Cpu, Gauge, BarChart3, Zap, AlertTriangle } from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { subscribeToLiveReadings, fetchLatest, type LiveReading } from '../../utils/liveApi';
import { fetchSummary as fetchSummaryApi, fetchHistory } from '../../utils/apiClient';

const RANGE_OPTIONS = {
  day: { label: '24 Hours', seconds: 24 * 3600, interval: 900 },
  week: { label: '7 Days', seconds: 7 * 24 * 3600, interval: 3600 },
  month: { label: '30 Days', seconds: 30 * 24 * 3600, interval: 4 * 3600 },
};

const deriveSnapshot = (reading?: LiveReading | null) => {
  const voltage = reading?.voltage ?? null;
  const current = reading?.current ?? null;
  const active = reading?.real_power_kw ? reading.real_power_kw * 1000 : (voltage != null && current != null ? (voltage * current * 0.95) : null);
  const apparent = reading?.apparent_power_kva ? reading.apparent_power_kva * 1000 : (voltage != null && current != null ? (voltage * current) : null);
  const reactive = reading?.reactive_power_kvar ? reading.reactive_power_kvar * 1000 : (active != null && apparent != null ? Math.sqrt(Math.max(apparent ** 2 - active ** 2, 0)) : null);
  const factor = reading?.power_factor ?? (active != null && apparent ? active / apparent : null);
  return {
    active: Number((active ?? 0).toFixed(1)),
    apparent: Number((apparent ?? 0).toFixed(1)),
    reactive: Number((reactive ?? 0).toFixed(1)),
    factor: Number((factor ?? 0).toFixed(3)),
  };
};

const metrics = [
  { key: 'activePower', labelKey: 'active_power', color: '#8b5cf6', unit: 'W' },
  { key: 'reactivePower', labelKey: 'reactive_power', color: '#06b6d4', unit: 'VAR' },
  { key: 'apparentPower', labelKey: 'apparent_power', color: '#10b981', unit: 'VA' },
  { key: 'powerFactor', labelKey: 'power_factor', color: '#f59e0b', unit: '' },
];

export default function PowerPage() {
  const { translate } = useSettings();
  const [livePower, setLivePower] = useState(deriveSnapshot());
  const [selectedRange, setSelectedRange] = useState<keyof typeof RANGE_OPTIONS>('week');
  const [selectedMetric, setSelectedMetric] = useState('activePower');
  const [summary, setSummary] = useState<any>(null);
  const [historyPoints, setHistoryPoints] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Live power statistics tracking (session-based, resets on reload)
  const [livePowerStats, setLivePowerStats] = useState({
    powerReadings: [] as { active: number; reactive: number; apparent: number; factor: number }[],
    avgActivePower: 0,
    peakActivePower: 0,
    avgPowerFactor: 0,
    totalConsumption: 0,
    liveConsumptionWh: 0  // Accumulated live consumption in Wh
  });

  useEffect(() => {
    let unsub = () => {};
    
    const updatePowerStats = (lr: LiveReading | null) => {
      if (!lr) return;
      
      const snapshot = deriveSnapshot(lr);
      setLivePower(snapshot);
      
      // Track statistics from live readings
      if (snapshot.active > 0) {
        setLivePowerStats(prev => {
          const newReadings = [...prev.powerReadings, {
            active: snapshot.active,
            reactive: snapshot.reactive,
            apparent: snapshot.apparent,
            factor: snapshot.factor
          }];
          
          // Calculate live averages
          const avgActive = newReadings.reduce((sum, r) => sum + r.active, 0) / newReadings.length;
          const peakActive = Math.max(...newReadings.map(r => r.active));
          const avgPF = newReadings.reduce((sum, r) => sum + r.factor, 0) / newReadings.length;
          const totalCons = newReadings.reduce((sum, r) => sum + r.active, 0) / 1000; // Convert to kWh estimate
          
          // Accumulate live consumption: assume ~1-5 second intervals between readings
          // Power (W) * time (h) = Energy (Wh). Using 3 sec average = 3/3600 h
          const energyDelta = snapshot.active * (3 / 3600); // Wh per reading
          const newLiveConsumption = prev.liveConsumptionWh + energyDelta;
          
          return {
            powerReadings: newReadings,
            avgActivePower: avgActive,
            peakActivePower: peakActive,
            avgPowerFactor: avgPF,
            totalConsumption: totalCons,
            liveConsumptionWh: newLiveConsumption
          };
        });
      }
    };
    
    fetchLatest()
      .then((r) => {
        const lr = (r?.reading as LiveReading) || null;
        if (lr) {
          const ts = (lr.captured_at ?? lr.created_at ?? Math.floor(Date.now() / 1000)) * 1000;
          const ageMinutes = (Date.now() - ts) / 60000;
          
          // Only use if device is online (data within 5 minutes)
          if (ageMinutes <= 5) {
            updatePowerStats(lr);
          }
          // Otherwise leave at 0 (device offline)
        }
      })
      .catch(() => {});
      
    unsub = subscribeToLiveReadings((lr) => updatePowerStats(lr));
    return () => unsub();
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoadingHistory(true);
      try {
        const now = Math.floor(Date.now() / 1000);
        const option = RANGE_OPTIONS[selectedRange];
        const from = now - option.seconds;
        const [summaryRes, historyRes] = await Promise.all([
          fetchSummaryApi({ from, to: now }),
          fetchHistory({ from, to: now, interval_seconds: option.interval }),
        ]);
        setSummary(summaryRes.summary);
        setHistoryPoints(historyRes.points || []);
      } catch (err) {
        console.error('Failed to load power analytics', err);
      } finally {
        setLoadingHistory(false);
      }
    };
    load();
  }, [selectedRange]);

  const powerDistribution = useMemo(() => {
    // Always calculate live distribution for current values
    const liveTotal = Math.max(
      Math.abs(livePower.active) + Math.abs(livePower.reactive) + Math.abs(livePower.apparent),
      0.0001
    );
    const liveDist = {
      active: Math.abs((livePower.active / liveTotal) * 100),
      reactive: Math.abs((livePower.reactive / liveTotal) * 100),
      apparent: Math.abs((livePower.apparent / liveTotal) * 100)
    };
    
    // Blend with historical if available and we have sufficient live data
    if (summary?.powerDistribution && livePowerStats.powerReadings.length > 10) {
      // Weighted average: 70% historical, 30% live for smooth transition
      const activeVal = summary.powerDistribution.real * 0.7 + liveDist.active * 0.3;
      const reactiveVal = summary.powerDistribution.reactive * 0.7 + liveDist.reactive * 0.3;
      const apparentVal = summary.powerDistribution.apparent * 0.7 + liveDist.apparent * 0.3;
      
      return [
        { name: translate('active_power'), value: Math.max(0.1, activeVal), color: '#8b5cf6' },
        { name: translate('reactive_power'), value: Math.max(0.1, reactiveVal), color: '#06b6d4' },
        { name: translate('apparent_power'), value: Math.max(0.1, apparentVal), color: '#10b981' },
      ];
    } else if (summary?.powerDistribution && livePower.active === 0) {
      // Use historical when no live data available
      return [
        { name: translate('active_power'), value: Math.max(0.1, summary.powerDistribution.real ?? 0), color: '#8b5cf6' },
        { name: translate('reactive_power'), value: Math.max(0.1, summary.powerDistribution.reactive ?? 0), color: '#06b6d4' },
        { name: translate('apparent_power'), value: Math.max(0.1, summary.powerDistribution.apparent ?? 0), color: '#10b981' },
      ];
    }
    
    // Use pure live data (most common case with ESP32 actively sending)
    return [
      { name: translate('active_power'), value: Math.max(0.1, liveDist.active), color: '#8b5cf6' },
      { name: translate('reactive_power'), value: Math.max(0.1, liveDist.reactive), color: '#06b6d4' },
      { name: translate('apparent_power'), value: Math.max(0.1, liveDist.apparent), color: '#10b981' },
    ];
  }, [summary, translate, livePower, livePowerStats]);

  const stats = useMemo(() => {
    // Intelligently combine live session stats with historical data
    const avgActivePower = livePowerStats.powerReadings.length > 0 
      ? livePowerStats.avgActivePower 
      : ((summary?.averages?.power_kw ?? livePower.active / 1000) * 1000);
    
    const avgPowerFactor = livePowerStats.powerReadings.length > 0
      ? livePowerStats.avgPowerFactor
      : (summary?.averages?.pf ?? livePower.factor);
    
    return [
      {
        labelKey: 'active_power',
        value: avgActivePower.toFixed(1),
        unit: translate('watts'),
        icon: Power,
        color: 'from-purple-500 to-violet-500',
        status: 'excellent',
      },
      {
        labelKey: 'reactive_power',
        value: livePower.reactive.toFixed(1),
        unit: translate('var'),
        icon: Cpu,
        color: 'from-cyan-500 to-blue-500',
        status: 'good',
      },
      {
        labelKey: 'apparent_power',
        value: livePower.apparent.toFixed(1),
        unit: translate('va'),
        icon: Gauge,
        color: 'from-green-500 to-emerald-500',
        status: 'high',
      },
      {
        labelKey: 'power_factor',
        value: avgPowerFactor.toFixed(3),
        unit: '',
        icon: BarChart3,
        color: 'from-orange-500 to-red-500',
        status: avgPowerFactor > 0.9 ? 'optimal' : 'normal',
      },
    ];
  }, [summary, livePower, livePowerStats, translate]);

  const historyData = useMemo(() => {
    const historical = historyPoints.map((point) => {
      const label = new Date(point.timestamp * 1000).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit' });
      const apparent = point.voltage != null && point.current != null ? (point.voltage * point.current) : null;
      const active = point.realPowerKw ? point.realPowerKw * 1000 : null;
      const reactive = apparent != null && active != null ? Math.sqrt(Math.max(apparent ** 2 - active ** 2, 0)) : null;
      const pf = point.powerFactor ?? (apparent && active ? active / apparent : null);
      return {
        date: label,
        timestamp: point.timestamp,
        activePower: active ?? 0,
        reactivePower: reactive ?? 0,
        apparentPower: apparent ?? 0,
        powerFactor: pf ?? 0,
      };
    });
    
    // Add current live data point to chart for seamless integration
    if (livePower.active > 0) {
      const livePoint = {
        date: 'Now',
        timestamp: Math.floor(Date.now() / 1000),
        activePower: livePower.active,
        reactivePower: livePower.reactive,
        apparentPower: livePower.apparent,
        powerFactor: livePower.factor,
      };
      return [...historical, livePoint];
    }
    
    return historical;
  }, [historyPoints, livePower]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg flex items-center justify-center">
            <Power className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-medium text-white">{translate('power_analysis')}</h1>
            <p className="text-gray-400">
              {translate('total_consumption')}: {(((summary?.totals?.real_power_kwh ?? 0) * 1000) + livePowerStats.liveConsumptionWh).toFixed(0)} W·h
            </p>
          </div>
        </div>

        <motion.div
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-500/20 rounded-lg border border-purple-500/30"
        >
          <Zap className="w-5 h-5 text-purple-400" />
          <span className="text-purple-400 font-medium">
            {livePower.active.toFixed(1)} W
          </span>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.labelKey}
              initial={{ opacity: 0, rotateY: -90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              whileHover={{ scale: 1.05, rotateX: 5 }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 relative overflow-hidden"
            >
              <motion.div
                animate={{
                  background: [
                    'radial-gradient(circle at 0% 0%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
                    'radial-gradient(circle at 100% 100%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
                    'radial-gradient(circle at 0% 0%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
                  ],
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute inset-0"
              />

              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      stat.status === 'excellent'
                        ? 'bg-green-500'
                        : stat.status === 'optimal'
                          ? 'bg-emerald-500'
                          : stat.status === 'good'
                            ? 'bg-blue-500'
                            : stat.status === 'high'
                              ? 'bg-purple-500'
                              : stat.status === 'normal'
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                    }`}
                  />
                </div>

                <div>
                  <h3 className="text-gray-400 text-sm font-medium mb-1">{translate(stat.labelKey)}</h3>
                  <div className="flex items-baseline space-x-2">
                    <motion.span
                      key={stat.value}
                      animate={{ opacity: [1, 0.7, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-2xl font-medium text-white"
                    >
                      {stat.value}
                    </motion.span>
                    <span className="text-gray-400 text-sm">{stat.unit}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-lg font-medium">Power Distribution</h3>
            <div className="flex items-center space-x-2">
              {Object.entries(RANGE_OPTIONS).map(([key, option]) => (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedRange(key as keyof typeof RANGE_OPTIONS)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedRange === key
                      ? 'bg-purple-500/60 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  {option.label}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="h-64">
            {powerDistribution.every(d => d.value === 0) ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                  <p className="text-gray-300 text-lg font-medium">No Data Present</p>
                  <p className="text-gray-500 text-sm mt-2">Graph will be updated after successful data logging</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                <Pie
                  data={powerDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  dataKey="value"
                  label={({ value }) => `${Number(value).toFixed(1)}%`}
                  labelLine={true}
                >
                  {powerDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#ffffff',
                  }}
                  formatter={(value, name) => [`${Number(value).toFixed(2)} %`, name]}
                />
              </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-6 space-y-2">
            {metrics.map((metric) => (
              <motion.button
                key={metric.key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedMetric(metric.key)}
                className={`w-full flex items-center justify-between p-2 rounded-lg transition-all duration-200 ${
                  selectedMetric === metric.key
                    ? 'bg-purple-500/30 border border-purple-500/50'
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                <span className="text-white text-sm">{translate(metric.labelKey)}</span>
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: metric.color }}
                />
              </motion.button>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-3 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white text-lg font-medium">
                {translate(metrics.find((m) => m.key === selectedMetric)?.labelKey || 'power')} Trends
              </h3>
              {loadingHistory && <p className="text-xs text-gray-400 mt-1">Loading latest analytics…</p>}
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center space-x-2 text-purple-400"
            >
              <TrendingUp className="w-5 h-5" />
            </motion.div>
          </div>

          <div className="h-80">
            {historyData.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                  <p className="text-gray-300 text-lg font-medium">No Data Present</p>
                  <p className="text-gray-500 text-sm mt-2">Graph will be updated after successful data logging</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData}>
                <defs>
                  <linearGradient id="powerGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={metrics.find((m) => m.key === selectedMetric)?.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={metrics.find((m) => m.key === selectedMetric)?.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={12}
                  label={{
                    value: translate(metrics.find((m) => m.key === selectedMetric)?.labelKey || 'power'),
                    angle: -90,
                    position: 'insideLeft',
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#ffffff',
                  }}
                  formatter={(value) => {
                    const metric = metrics.find((m) => m.key === selectedMetric);
                    const unit = metric?.unit || '';
                    const precision = selectedMetric === 'powerFactor' ? 3 : 2;
                    return [`${Number(value).toFixed(precision)} ${unit}`.trim(), translate(metric?.labelKey || 'power')];
                  }}
                />
                <Line
                  type="monotone"
                  dataKey={selectedMetric}
                  stroke={metrics.find((m) => m.key === selectedMetric)?.color}
                  strokeWidth={3}
                  dot={{ fill: metrics.find((m) => m.key === selectedMetric)?.color, strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 6, stroke: metrics.find((m) => m.key === selectedMetric)?.color, strokeWidth: 2 }}
                  fill="url(#powerGradient)"
                />
              </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}