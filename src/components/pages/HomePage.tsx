import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Zap, Activity, Power, Battery, TrendingUp, TrendingDown, Monitor, Radio } from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { subscribeToLiveReadings, fetchLatest, type LiveReading } from '../../utils/liveApi';

export default function HomePage() {
  const { translate } = useSettings();
  const [liveData, setLiveData] = useState({
    voltage: 0,
    current: 0,
    power: 0,
    energy: 0,
    frequency: 0,
    timestamp: new Date().toLocaleTimeString()
  });
  const [liveChartData, setLiveChartData] = useState<any[]>([]);
  const [selectedMetric, setSelectedMetric] = useState('voltage');
  
  // Live-only statistics tracking (session-based, resets on reload)
  const [liveHomeStats, setLiveHomeStats] = useState({
    voltageReadings: [] as number[],
    currentReadings: [] as number[],
    powerReadings: [] as number[],
    energyReadings: [] as number[],
    avgVoltage: 0,
    avgCurrent: 0,
    avgPower: 0,
    peakVoltage: 0,
    peakCurrent: 0,
    peakPower: 0
  });

  useEffect(() => {
    let unsub = () => {};
    
    // Prime latest once on mount - but only if data is recent (within 5 minutes)
    fetchLatest().then(r => {
      if (r?.reading) {
        const lr: LiveReading = r.reading;
        const ts = (lr.captured_at ?? lr.created_at ?? Math.floor(Date.now() / 1000)) * 1000;
        const nowTs = Date.now();
        const ageMinutes = (nowTs - ts) / 60000;
        
        // Only use reading if it's less than 5 minutes old (device is actively sending data)
        if (ageMinutes <= 5) {
          const newData = {
            voltage: lr.voltage ?? 0,
            current: lr.current ?? 0,
            power: lr.real_power_kw ?? 0,
            energy: lr.energy_kwh ?? 0,
            frequency: lr.frequency ?? 0,
            timestamp: new Date(ts).toLocaleTimeString()
          };
          setLiveData(newData);
          
          // Add to live chart data - start accumulating from first point
          const chartPoint = {
            time: new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            timestamp: ts,
            voltage: parseFloat((newData.voltage).toFixed(2)),
            current: parseFloat((newData.current).toFixed(3)),
            power: parseFloat((newData.power).toFixed(3)),
            energy: parseFloat((newData.energy).toFixed(4))
          };
          setLiveChartData([chartPoint]);
        }
        // If data is too old, leave initial state at 0.0 (device offline)
      }
    }).catch(() => {});
    
    // Subscribe to live SSE
    unsub = subscribeToLiveReadings((lr) => {
      const ts = (lr.captured_at ?? lr.created_at ?? Math.floor(Date.now() / 1000)) * 1000;
      const newData = {
        voltage: lr.voltage ?? 0,
        current: lr.current ?? 0,
        power: lr.real_power_kw ?? 0,
        energy: lr.energy_kwh ?? 0,
        frequency: lr.frequency ?? 0,
        timestamp: new Date(ts).toLocaleTimeString()
      };
      setLiveData(newData);
      
      // Track live statistics for all metrics
      if (newData.voltage > 0 || newData.current > 0) {
        setLiveHomeStats(prev => {
          const newVoltageReadings = [...prev.voltageReadings, newData.voltage];
          const newCurrentReadings = [...prev.currentReadings, newData.current];
          const newPowerReadings = [...prev.powerReadings, newData.power];
          const newEnergyReadings = [...prev.energyReadings, newData.energy];
          
          return {
            voltageReadings: newVoltageReadings,
            currentReadings: newCurrentReadings,
            powerReadings: newPowerReadings,
            energyReadings: newEnergyReadings,
            avgVoltage: newVoltageReadings.reduce((a, b) => a + b, 0) / newVoltageReadings.length,
            avgCurrent: newCurrentReadings.reduce((a, b) => a + b, 0) / newCurrentReadings.length,
            avgPower: newPowerReadings.reduce((a, b) => a + b, 0) / newPowerReadings.length,
            peakVoltage: Math.max(...newVoltageReadings),
            peakCurrent: Math.max(...newCurrentReadings),
            peakPower: Math.max(...newPowerReadings)
          };
        });
      }
      
      // Add to live chart data - accumulate all points during this session
      const chartPoint = {
        time: new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        timestamp: ts,
        voltage: parseFloat((newData.voltage).toFixed(2)),
        current: parseFloat((newData.current).toFixed(3)),
        power: parseFloat((newData.power).toFixed(3)),
        energy: parseFloat((newData.energy).toFixed(4))
      };
      
      setLiveChartData(prev => {
        // Avoid duplicate timestamps
        const filtered = prev.filter(p => Math.abs(p.timestamp - ts) > 1000);
        // Keep ALL points from session start - no limit, accumulates until dashboard is closed
        const updated = [...filtered, chartPoint];
        return updated;
      });
    });
    
    return () => unsub();
  }, []);



  const formatChange = (currentValue: number, baseline?: number | null) => {
    if (!baseline || baseline === 0) return '+0.0%';
    const delta = ((currentValue - baseline) / baseline) * 100;
    const sign = delta >= 0 ? '+' : '';
    return `${sign}${delta.toFixed(1)}%`;
  };

  // Pure live data display - no historical integration
  const displayVoltage = liveData.voltage;
  const displayCurrent = liveData.current;
  const displayPower = liveData.power;
  const displayEnergy = liveData.energy;
  
  // Use only live session averages for comparison
  const baselineVoltage = liveHomeStats.voltageReadings.length > 5 ? liveHomeStats.avgVoltage : null;
  const baselineCurrent = liveHomeStats.currentReadings.length > 5 ? liveHomeStats.avgCurrent : null;
  const baselinePower = liveHomeStats.powerReadings.length > 5 ? liveHomeStats.avgPower : null;
  
  const metrics = [
    {
      key: 'voltage',
      label: translate('voltage'),
      value: displayVoltage.toFixed(2),
      unit: translate('volts'),
      icon: Zap,
      color: 'from-blue-500 to-cyan-500',
      dotColor: 'bg-blue-400',
      shadowColor: 'shadow-blue-400/50'
    },
    {
      key: 'current',
      label: translate('current'),
      value: displayCurrent.toFixed(2),
      unit: translate('amperes'),
      icon: Activity,
      color: 'from-green-500 to-emerald-500',
      dotColor: 'bg-green-400',
      shadowColor: 'shadow-green-400/50'
    },
    {
      key: 'power',
      label: translate('power'),
      value: (displayPower * 1000).toFixed(1),
      unit: translate('watts'),
      icon: Power,
      color: 'from-purple-500 to-violet-500',
      dotColor: 'bg-purple-400',
      shadowColor: 'shadow-purple-400/50'
    },
    {
      key: 'energy',
      label: translate('energy'),
      value: (displayEnergy * 1000).toFixed(0),
      unit: translate('watt_hours'),
      icon: Battery,
      color: 'from-orange-500 to-red-500',
      dotColor: 'bg-orange-400',
      shadowColor: 'shadow-orange-400/50'
    }
  ];

  const getChartColor = (metric: string) => {
    switch (metric) {
      case 'voltage': return '#3b82f6';
      case 'current': return '#10b981';
      case 'power': return '#8b5cf6';
      case 'energy': return '#f97316';
      default: return '#3b82f6';
    }
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
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
            <Monitor className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-medium text-white mb-2">{translate('smart_meter_dashboard')}</h1>
            <p className="text-gray-400">{translate('real_time_monitoring')}</p>
          </div>
        </div>
        
        {/* Frequency Display Box */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ 
            opacity: 1, 
            x: 0,
            boxShadow: ['0 0 20px rgba(251, 146, 60, 0.3)', '0 0 30px rgba(251, 146, 60, 0.5)', '0 0 20px rgba(251, 146, 60, 0.3)']
          }}
          transition={{ 
            opacity: { delay: 0.3 },
            x: { delay: 0.3 },
            boxShadow: { duration: 2, repeat: Infinity }
          }}
          className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 rounded-lg p-4 border border-orange-500/30 shadow-lg"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
              <Radio className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-orange-200 text-sm font-medium">Frequency:</p>
              <div className="flex items-baseline space-x-1">
                <span className="text-xl font-medium text-white">
                  {liveData.frequency.toFixed(2)}
                </span>
                <span className="text-orange-300 text-sm">Hz</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Live Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          
          return (
            <motion.div
              key={metric.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${metric.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <motion.div
                  animate={{ 
                    opacity: [1, 0.4, 1],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="relative"
                >
                  <div className={`w-3 h-3 ${metric.dotColor} rounded-full ${metric.shadowColor} shadow-lg`} />
                  <div className={`absolute inset-0 w-3 h-3 ${metric.dotColor} rounded-full blur-sm opacity-75`} />
                </motion.div>
              </div>
              
              <div>
                <h3 className="text-gray-400 text-sm font-medium mb-1">{metric.label}</h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-medium text-white">
                    {metric.value}
                  </span>
                  <span className="text-gray-400 text-sm">{metric.unit}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Controls */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700"
        >
          <h3 className="text-white text-lg font-medium mb-4">{translate('analytics_control')}</h3>
          <div className="space-y-3">
            {metrics.map((metric) => (
              <motion.button
                key={metric.key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedMetric(metric.key)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                  selectedMetric === metric.key
                    ? `bg-gradient-to-r ${metric.color} text-white`
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                <metric.icon className="w-5 h-5" />
                <span className="font-medium">{metric.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Live Selected Metric Display */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-6 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg p-4 border border-slate-600 relative overflow-hidden"
          >
            {/* Glowing effect */}
            <motion.div
              animate={{ 
                opacity: [0.2, 0.5, 0.2],
                scale: [1, 1.02, 1]
              }}
              transition={{ 
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={`absolute inset-0 bg-gradient-to-r ${metrics.find(m => m.key === selectedMetric)?.color.replace('from-', 'from-').replace('to-', 'to-')}/20 rounded-lg`}
            />
            
            <div className="relative z-10">
              <div className="flex items-center space-x-2 mb-2">
                <div className={`w-6 h-6 bg-gradient-to-r ${metrics.find(m => m.key === selectedMetric)?.color} rounded-md flex items-center justify-center`}>
                  {metrics.find(m => m.key === selectedMetric)?.icon && React.createElement(metrics.find(m => m.key === selectedMetric)!.icon, { className: "w-3 h-3 text-white" })}
                </div>
                <span className="text-gray-300 text-sm font-medium">
                  Live {metrics.find(m => m.key === selectedMetric)?.label}
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-medium text-white">
                  {metrics.find(m => m.key === selectedMetric)?.value}
                </span>
                <span className="text-gray-400 text-sm">
                  {metrics.find(m => m.key === selectedMetric)?.unit}
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Live Streaming Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white text-lg font-medium">
                Live Analytics - {metrics.find(m => m.key === selectedMetric)?.label}
              </h3>
              <p className="text-gray-400 text-sm mt-1">Real-time streaming data (1 hour window)</p>
            </div>
            <motion.div
              animate={{ 
                opacity: [1, 0.5, 1],
                scale: [1, 1.05, 1]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full text-green-400 text-sm border border-green-500/30"
            >
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>Live Streaming</span>
            </motion.div>
          </div>
          
          <div className="h-80">
            {liveChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4 animate-pulse" />
                  <p className="text-gray-400">Waiting for live data...</p>
                  <p className="text-gray-500 text-sm mt-2">Streaming will begin when readings arrive</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={liveChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVoltage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#9ca3af" 
                    fontSize={11}
                    tick={{ fill: '#9ca3af' }}
                    tickMargin={8}
                    interval="preserveStart"
                    minTickGap={30}
                  />
                  <YAxis 
                    stroke="#9ca3af" 
                    fontSize={11}
                    tick={{ fill: '#9ca3af' }}
                    tickMargin={8}
                    domain={['auto', 'auto']}
                    tickFormatter={(value) => {
                      if (selectedMetric === 'energy') return value.toFixed(4);
                      if (selectedMetric === 'voltage') return value.toFixed(1);
                      return value.toFixed(2);
                    }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #4b5563',
                      borderRadius: '8px',
                      color: '#ffffff',
                      padding: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                    }}
                    labelStyle={{ color: '#d1d5db', marginBottom: '8px', fontWeight: 'bold' }}
                    formatter={(value: any, name: string) => {
                      const metricInfo = metrics.find(m => m.key === name);
                      const formattedValue = name === 'energy' ? parseFloat(value).toFixed(4) :
                                            name === 'voltage' ? parseFloat(value).toFixed(2) :
                                            parseFloat(value).toFixed(3);
                      return [
                        `${formattedValue} ${metricInfo?.unit || ''}`,
                        metricInfo?.label || name
                      ];
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey={selectedMetric}
                    stroke={getChartColor(selectedMetric)}
                    strokeWidth={2}
                    fill={`url(#color${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)})`}
                    dot={{ 
                      fill: getChartColor(selectedMetric), 
                      strokeWidth: 2, 
                      r: 3,
                      stroke: '#1f2937'
                    }}
                    isAnimationActive={false}
                    activeDot={{ 
                      r: 6, 
                      stroke: getChartColor(selectedMetric), 
                      strokeWidth: 3,
                      fill: '#ffffff'
                    }}
                    animationDuration={1200}
                    animationEasing="ease-in-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}