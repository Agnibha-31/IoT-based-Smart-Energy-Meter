import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, TrendingUp, Gauge, Zap, BarChart3, AlertTriangle } from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { subscribeToLiveReadings, fetchLatest, type LiveReading } from '../../utils/liveApi';
import { useTelemetryHistory, useTelemetrySummary } from '../../hooks/useTelemetry';

export default function CurrentPage() {
  const { translate } = useSettings();
  const [liveCurrent, setLiveCurrent] = useState(0);
  const history = useTelemetryHistory({ period: 'month', interval_seconds: 24 * 3600 });
  const { summary } = useTelemetrySummary({ period: 'month' });
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [selectedView, setSelectedView] = useState('trend');
  
  // Live statistics tracking (resets on page load/refresh)
  const [liveStats, setLiveStats] = useState({
    currentReadings: [] as number[],
    powerReadings: [] as number[],
    peakCurrent: 0,
    rmsCurrent: 0,
    avgPower: 0,
    peakPower: 0,
    loadFactor: 0,
    liveConsumptionAh: 0  // Accumulated live consumption in Ah
  });

  useEffect(() => {
    let unsub = () => {};
    
    const updateCurrentStats = (reading: LiveReading) => {
      const current = reading.current ?? 0;
      const power = reading.real_power_kw ?? 0;
      
      if (current > 0) {
        setLiveStats(prev => {
          const newCurrentReadings = [...prev.currentReadings, current];
          const newPowerReadings = [...prev.powerReadings, power];
          
          // Calculate peak current
          const peak = Math.max(...newCurrentReadings);
          
          // Calculate RMS current
          const sumSquares = newCurrentReadings.reduce((sum, i) => sum + (i * i), 0);
          const rms = Math.sqrt(sumSquares / newCurrentReadings.length);
          
          // Calculate average and peak power
          const avgPow = newPowerReadings.reduce((sum, p) => sum + p, 0) / newPowerReadings.length;
          const peakPow = Math.max(...newPowerReadings);
          
          // Calculate load factor (average power / peak power)
          const loadFac = peakPow > 0 ? (avgPow / peakPow) : 0;
          
          // Accumulate live consumption: Current (A) * time (h) = Charge (Ah)
          // Assume ~3 second intervals = 3/3600 h
          const chargeDelta = current * (3 / 3600); // Ah per reading
          const newLiveConsumption = prev.liveConsumptionAh + chargeDelta;
          
          return {
            currentReadings: newCurrentReadings,
            powerReadings: newPowerReadings,
            peakCurrent: peak,
            rmsCurrent: rms,
            avgPower: avgPow,
            peakPower: peakPow,
            loadFactor: loadFac,
            liveConsumptionAh: newLiveConsumption
          };
        });
      }
    };
    
    fetchLatest().then(r => {
      if (r?.reading) {
        const reading = r.reading as LiveReading;
        const ts = (reading.captured_at ?? reading.created_at ?? Math.floor(Date.now() / 1000)) * 1000;
        const ageMinutes = (Date.now() - ts) / 60000;
        
        // Only use if device is online (data within 5 minutes)
        if (ageMinutes <= 5) {
          setLiveCurrent(reading.current ?? 0);
          updateCurrentStats(reading);
        }
        // Otherwise leave at 0 (device offline)
      }
    }).catch(() => {});
    
    unsub = subscribeToLiveReadings(lr => {
      setLiveCurrent(lr.current ?? 0);
      updateCurrentStats(lr);
    });
    
    return () => unsub();
  }, []);

  useEffect(() => {
    const points = history.history?.points || [];
    const mapped = points.map((p: any) => ({
      date: new Date(p.timestamp * 1000).toLocaleDateString(),
      current: p.current ?? 0,
      rms: p.current ? Math.sqrt((p.current * p.current)) : 0,
    }));
    
    // Add live data point for real-time integration
    if (liveCurrent > 0 && liveStats.rmsCurrent > 0) {
      const livePoint = {
        date: 'Now',
        current: liveCurrent,
        rms: liveStats.rmsCurrent,
      };
      setHistoricalData([...mapped, livePoint]);
    } else {
      setHistoricalData(mapped);
    }
  }, [history.history, liveCurrent, liveStats.rmsCurrent]);

  const views = [
    { key: 'trend', labelKey: 'trend_analysis', icon: TrendingUp },
    { key: 'distribution', labelKey: 'distribution', icon: BarChart3 },
    { key: 'realtime', labelKey: 'real_time', icon: Activity }
  ];

  // Combine live stats with historical summary
  const peakCurrent = Math.max(liveStats.peakCurrent, summary?.peaks?.current ?? 0);
  const rmsCurrent = liveStats.currentReadings.length > 0 ? liveStats.rmsCurrent : (summary?.rmsCurrent ?? liveCurrent);
  const loadFactor = liveStats.currentReadings.length > 0 ? liveStats.loadFactor : (summary?.loadFactor ?? 0);
  
  const stats = [
    {
      labelKey: 'live_current',
      value: liveCurrent.toFixed(2),
      unit: translate('amperes'),
      icon: Activity,
      color: 'from-green-500 to-emerald-500',
      status: 'normal'
    },
    {
      labelKey: 'rms_current',
      value: rmsCurrent.toFixed(2),
      unit: translate('amperes'),
      icon: Gauge,
      color: 'from-blue-500 to-cyan-500',
      status: 'normal'
    },
    {
      labelKey: 'peak_current',
      value: peakCurrent.toFixed(1),
      unit: translate('amperes'),
      icon: TrendingUp,
      color: 'from-purple-500 to-violet-500',
      status: 'high'
    },
    {
      labelKey: 'load_factor',
      value: (loadFactor * 100).toFixed(1),
      unit: translate('percent'),
      icon: BarChart3,
      color: 'from-orange-500 to-red-500',
      status: 'optimal'
    }
  ];

  const renderChart = () => {
    if (selectedView === 'distribution') {
      return (
        <BarChart data={historicalData.slice(-7)}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
          <YAxis stroke="#9ca3af" fontSize={12} />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#ffffff'
            }}
          />
          <Bar dataKey="current" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      );
    }

    return (
      <LineChart data={historicalData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
        <YAxis stroke="#9ca3af" fontSize={12} />
        <Tooltip 
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#ffffff'
          }}
        />
        <Line
          type="monotone"
          dataKey="current"
          stroke="#10b981"
          strokeWidth={3}
          dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="rms"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
        />
      </LineChart>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-medium text-white">{translate('current_monitoring')}</h1>
            <p className="text-gray-400">{translate('total_consumption')}: {((summary?.totals?.current_ah ?? 0) + liveStats.liveConsumptionAh).toFixed(3)} A·h</p>
          </div>
        </div>
        
        <motion.div
          animate={{ 
            boxShadow: [
              '0 0 20px rgba(16, 185, 129, 0.3)',
              '0 0 40px rgba(16, 185, 129, 0.6)',
              '0 0 20px rgba(16, 185, 129, 0.3)'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="px-4 py-2 bg-green-500/20 rounded-lg border border-green-500/30"
        >
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-medium">{liveCurrent.toFixed(2)} A</span>
          </div>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          
          return (
            <motion.div
              key={stat.labelKey}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.05, rotateY: 5 }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 relative overflow-hidden"
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    stat.status === 'optimal' ? 'bg-green-500' :
                    stat.status === 'high' ? 'bg-orange-500' : 'bg-blue-500'
                  }`} />
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

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* View Controls */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700"
        >
          <h3 className="text-white text-lg font-medium mb-4">{translate('analysis_views')}</h3>
          <div className="space-y-3">
            {views.map((view) => {
              const Icon = view.icon;
              return (
                <motion.button
                  key={view.key}
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedView(view.key)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                    selectedView === view.key
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{translate(view.labelKey)}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Current Waveform Simulation */}
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mt-6 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30"
          >
            <div className="text-center">
              <Zap className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-green-400 text-sm font-medium">{translate('current_flow')}</p>
              <p className="text-2xl font-medium text-white">{liveCurrent.toFixed(2)} A</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Current Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-3 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white text-lg font-medium">
              {translate('current_analysis')} - {translate(views.find(v => v.key === selectedView)?.labelKey || 'overview')}
            </h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-gray-400 text-sm">{translate('current')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-gray-400 text-sm">RMS</span>
              </div>
            </div>
          </div>
          
          <div className="h-80">
            {historicalData.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                  <p className="text-gray-300 text-lg font-medium">No Data Present</p>
                  <p className="text-gray-500 text-sm mt-2">Graph will be updated after successful data logging</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {renderChart()}
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}