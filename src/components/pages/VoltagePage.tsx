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
  AreaChart,
  Area,
} from 'recharts';
import { Zap, TrendingUp, AlertTriangle, Activity, BarChart3 } from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { subscribeToLiveReadings, fetchLatest, type LiveReading } from '../../utils/liveApi';
import { fetchSummary as fetchSummaryApi, fetchVoltageHistory } from '../../utils/apiClient';

const RANGE_OPTIONS = [
  { key: '7d', label: '7 Days', seconds: 7 * 24 * 3600, interval: 1800 },
  { key: '30d', label: '30 Days', seconds: 30 * 24 * 3600, interval: 4 * 3600 },
  { key: '90d', label: '90 Days', seconds: 90 * 24 * 3600, interval: 12 * 3600 },
  { key: '1y', label: '1 Year', seconds: 365 * 24 * 3600, interval: 24 * 3600 },
];

export default function VoltagePage() {
  const { translate } = useSettings();
  const [liveVoltage, setLiveVoltage] = useState(0);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [summary, setSummary] = useState<any>(null);
  const [historyPoints, setHistoryPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Live statistics tracking (resets on page load/refresh)
  const [liveStats, setLiveStats] = useState({
    voltageReadings: [] as number[],
    peakVoltage: 0,
    avgVoltage: 0,
    lowVoltage: 0,
    liveConsumptionVh: 0  // Accumulated live consumption in Vh
  });

  useEffect(() => {
    let unsub = () => {};
    
    const updateVoltageStats = (voltage: number) => {
      if (voltage > 0) {
        setLiveStats(prev => {
          const newReadings = [...prev.voltageReadings, voltage];
          const peak = Math.max(...newReadings);
          const low = Math.min(...newReadings);
          const avg = newReadings.reduce((sum, v) => sum + v, 0) / newReadings.length;
          
          // Accumulate live consumption: Voltage (V) * time (h) = Vh
          // Assume ~3 second intervals = 3/3600 h
          const voltageDelta = voltage * (3 / 3600); // Vh per reading
          const newLiveConsumption = prev.liveConsumptionVh + voltageDelta;
          
          return {
            voltageReadings: newReadings,
            peakVoltage: peak,
            avgVoltage: avg,
            lowVoltage: low,
            liveConsumptionVh: newLiveConsumption
          };
        });
      }
    };
    
    fetchLatest()
      .then((r) => {
        if (r?.reading) {
          const lr = r.reading as LiveReading;
          const ts = (lr.captured_at ?? lr.created_at ?? Math.floor(Date.now() / 1000)) * 1000;
          const ageMinutes = (Date.now() - ts) / 60000;
          
          // Only use if device sent data within last 5 minutes (device is online)
          if (ageMinutes <= 5) {
            const voltage = lr.voltage ?? 0;
            setLiveVoltage(voltage);
            updateVoltageStats(voltage);
          }
          // Otherwise leave at 0 (device offline)
        }
      })
      .catch(() => {});
      
    unsub = subscribeToLiveReadings((lr) => {
      const voltage = lr.voltage ?? 0;
      setLiveVoltage(voltage);
      updateVoltageStats(voltage);
    });
    
    return () => unsub();
  }, []); 

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const option = RANGE_OPTIONS.find((r) => r.key === selectedTimeframe) || RANGE_OPTIONS[1];
        const now = Math.floor(Date.now() / 1000);
        const from = now - option.seconds;
        const [summaryRes, voltageRes] = await Promise.all([
          fetchSummaryApi({ from, to: now }),
          fetchVoltageHistory({ from, to: now, interval_seconds: option.interval }),
        ]);
        setSummary(summaryRes.summary);
        setHistoryPoints(voltageRes.points || []);
      } catch (err) {
        console.error('Failed to load voltage analytics', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedTimeframe]);

  const stats = useMemo(() => {
    // Combine live stats with historical summary (use whichever is more extreme)
    const peakVoltage = Math.max(liveStats.peakVoltage, summary?.peaks?.voltage ?? 0);
    const avgVoltage = liveStats.voltageReadings.length > 0 ? liveStats.avgVoltage : (summary?.averages?.voltage ?? 0);
    const lowVoltage = liveStats.lowVoltage > 0 ? Math.min(liveStats.lowVoltage, summary?.lows?.voltage ?? 999) : (summary?.lows?.voltage ?? 0);
    
    return [
      {
        labelKey: 'current_voltage',
        value: liveVoltage.toFixed(2),
        unit: translate('volts'),
        icon: Zap,
        color: 'from-blue-500 to-cyan-500',
        status: liveVoltage >= 210 && liveVoltage <= 240 ? 'good' : 'warning',
      },
      {
        labelKey: 'peak_today',
        value: peakVoltage.toFixed(1),
        unit: translate('volts'),
        icon: TrendingUp,
        color: 'from-green-500 to-emerald-500',
        status: 'good',
      },
      {
        labelKey: 'average',
        value: avgVoltage.toFixed(1),
        unit: translate('volts'),
        icon: BarChart3,
        color: 'from-purple-500 to-violet-500',
        status: 'normal',
      },
      {
        labelKey: 'low_warning',
        value: lowVoltage.toFixed(1),
        unit: translate('volts'),
        icon: AlertTriangle,
        color: 'from-orange-500 to-red-500',
        status: lowVoltage < 205 ? 'warning' : 'good',
      },
    ];
  }, [summary, liveVoltage, liveStats, translate]);

  const chartData = useMemo(() => {
    const historical = historyPoints.map((point) => ({
      date: new Date(point.timestamp * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      voltage: point.voltage ?? null,
      peak: point.peak ?? null,
      minimum: point.minimum ?? null,
    }));
    
    // Add live data point for seamless real-time integration
    if (liveVoltage > 0) {
      const livePoint = {
        date: 'Now',
        voltage: liveVoltage,
        peak: liveStats.peakVoltage > 0 ? liveStats.peakVoltage : liveVoltage,
        minimum: liveStats.lowVoltage > 0 ? liveStats.lowVoltage : liveVoltage,
      };
      return [...historical, livePoint];
    }
    
    return historical;
  }, [historyPoints, liveVoltage, liveStats]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-medium text-white">{translate('voltage_monitoring')}</h1>
            <p className="text-gray-400">
              {translate('total_consumption')}: {((summary?.totals?.voltage_vh ?? 0) + liveStats.liveConsumptionVh).toFixed(2)} V·h
            </p>
          </div>
        </div>

        <motion.div
          animate={{
            boxShadow: [
              '0 0 20px rgba(59, 130, 246, 0.3)',
              '0 0 40px rgba(59, 130, 246, 0.6)',
              '0 0 20px rgba(59, 130, 246, 0.3)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="px-4 py-2 bg-blue-500/20 rounded-lg border border-blue-500/30"
        >
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-blue-400" />
            <span className="text-blue-400 font-medium">{liveVoltage.toFixed(2)} V</span>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.labelKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div
                  className={`w-3 h-3 rounded-full ${
                    stat.status === 'good' ? 'bg-green-500' :
                    stat.status === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
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
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700"
        >
          <h3 className="text-white text-lg font-medium mb-4">Time Range</h3>
          <div className="space-y-3">
            {RANGE_OPTIONS.map((timeframe) => (
              <motion.button
                key={timeframe.key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedTimeframe(timeframe.key)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                  selectedTimeframe === timeframe.key
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                <span className="font-medium">{timeframe.label}</span>
                <Activity className="w-4 h-4" />
              </motion.button>
            ))}
          </div>

          <motion.div
            animate={{
              boxShadow: [
                '0 0 20px rgba(59, 130, 246, 0.3)',
                '0 0 30px rgba(59, 130, 246, 0.5)',
                '0 0 20px rgba(59, 130, 246, 0.3)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mt-6 p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg border border-blue-500/30"
          >
            <div className="text-center">
              <p className="text-blue-400 text-sm font-medium mb-2">Live Voltage</p>
              <p className="text-3xl font-medium text-white">
                {liveVoltage.toFixed(2)} V
              </p>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white text-lg font-medium">Voltage History ({selectedTimeframe})</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-gray-400 text-sm">Average</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-gray-400 text-sm">Peak</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-gray-400 text-sm">Low</span>
              </div>
            </div>
          </div>

          <div className="h-80">
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                  <p className="text-gray-300 text-lg font-medium">No Data Present</p>
                  <p className="text-gray-500 text-sm mt-2">Graph will be updated after successful data logging</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="voltageGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#ffffff',
                  }}
                  formatter={(value, name) => [`${Number(value).toFixed(2)} V`, name]}
                />
                <Area
                  type="monotone"
                  dataKey="voltage"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#voltageGradient)"
                />
                <Line
                  type="monotone"
                  dataKey="peak"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="minimum"
                  stroke="#fb7185"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  dot={false}
                />
              </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {loading && <p className="text-sm text-gray-400 mt-3">Refreshing voltage telemetry…</p>}
        </motion.div>
      </div>
    </motion.div>
  );
}

