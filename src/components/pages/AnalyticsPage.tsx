import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, RadialBarChart, RadialBar 
} from 'recharts';
import { BarChart3, TrendingUp, Zap, Activity, Power, Battery, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { useTelemetrySummary } from '../../hooks/useTelemetry';

export default function AnalyticsPage() {
  const { translate } = useSettings();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  const summaryParams = useMemo(() => {
    if (selectedPeriod === 'custom' && customDateFrom && customDateTo) {
      const from = Math.floor(new Date(customDateFrom).getTime() / 1000);
      const to = Math.floor(new Date(customDateTo).getTime() / 1000);
      return { from, to };
    }
    return { period: selectedPeriod } as any;
  }, [selectedPeriod, customDateFrom, customDateTo]);

  const { summary } = useTelemetrySummary(summaryParams);

  const analyticsData = useMemo(() => {
    const hist = summary?.voltageHistory || [];
    return hist.map((p: any) => ({
      time: new Date(p.timestamp * 1000).toLocaleString([], { hour: '2-digit', minute: '2-digit' }),
      voltage: p.voltage ?? null,
      peak: p.peak ?? null,
      minimum: p.minimum ?? null,
    }));
  }, [summary]);

  const statistics = useMemo(() => {
    return {
      total: {
        voltage: summary?.totals?.voltage_vh ?? 0,
        current: summary?.totals?.current_ah ?? 0,
        power: summary?.totals?.real_power_kwh ?? 0,
        energy: summary?.totals?.energy_kwh ?? 0,
      },
      average: {
        voltage: summary?.averages?.voltage ?? 0,
        current: summary?.averages?.current ?? 0,
        power: summary?.averages?.power_kw ?? 0,
        energy: summary?.totals?.energy_kwh ?? 0,
      },
      peak: {
        voltage: summary?.peaks?.voltage ?? 0,
        current: summary?.peaks?.current ?? 0,
        power: summary?.peaks?.power_kw ?? 0,
        energy: summary?.totals?.energy_kwh ?? 0,
      }
    };
  }, [summary]);

  const periods = [
    { key: 'day', label: 'Last Day', icon: Clock },
    { key: 'week', label: 'Last 7 Days', icon: Calendar },
    { key: 'month', label: 'Last Month', icon: BarChart3 },
    { key: 'custom', label: 'Custom Period', icon: Calendar }
  ];

  const metrics = [
    { key: 'all', label: 'All Metrics', color: '#6366f1' },
    { key: 'voltage', label: 'Voltage', color: '#3b82f6' },
    { key: 'current', label: 'Current', color: '#10b981' },
    { key: 'power', label: 'Power', color: '#8b5cf6' },
    { key: 'energy', label: 'Energy', color: '#f59e0b' }
  ];

  const performanceData = [
    { name: 'Efficiency', value: summary?.efficiencyScore ?? 0, color: '#3b82f6' },
    { name: 'PF Avg', value: Math.round((summary?.averages?.pf ?? 0) * 100), color: '#10b981' },
    { name: 'Load Factor', value: Math.round((summary?.loadFactor ?? 0) * 100), color: '#8b5cf6' },
  ];

  const distributionData = [
    { name: 'Peak Hours', value: summary?.energySplit?.peak ?? 0, color: '#ef4444' },
    { name: 'Shoulder', value: summary?.energySplit?.shoulder ?? 0, color: '#3b82f6' },
    { name: 'Off-Peak Hours', value: summary?.energySplit?.offPeak ?? 0, color: '#10b981' }
  ];

  const renderChart = () => {
    return (
      <AreaChart data={analyticsData}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={metrics.find(m => m.key === selectedMetric)?.color} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={metrics.find(m => m.key === selectedMetric)?.color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
        <YAxis stroke="#9ca3af" fontSize={12} />
        <Tooltip 
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#ffffff'
          }}
        />
        {selectedMetric === 'all' ? (
          <>
            <Area type="monotone" dataKey="voltage" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            <Area type="monotone" dataKey="current" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
            <Area type="monotone" dataKey="power" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
          </>
        ) : (
          <Area
            type="monotone"
            dataKey={selectedMetric}
            stroke={metrics.find(m => m.key === selectedMetric)?.color}
            fill="url(#areaGradient)"
          />
        )}
      </AreaChart>
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
          <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-medium text-white">Advanced Analytics</h1>
            <p className="text-gray-400">Comprehensive statistical analysis and insights</p>
          </div>
        </div>
        
        <motion.div
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="px-4 py-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30"
        >
          <span className="text-indigo-400 font-medium">
            {selectedPeriod === 'custom' ? 
              (customDateFrom && customDateTo ? `${customDateFrom} to ${customDateTo}` : 'Custom Period') :
              periods.find(p => p.key === selectedPeriod)?.label
            }
          </span>
        </motion.div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Voltage', value: statistics.total.voltage, unit: 'V·h', icon: Zap, color: 'from-blue-500 to-cyan-500' },
          { label: 'Current', value: statistics.total.current, unit: 'A·h', icon: Activity, color: 'from-green-500 to-emerald-500' },
          { label: 'Power', value: statistics.total.power, unit: 'kW·h', icon: Power, color: 'from-purple-500 to-violet-500' },
          { label: 'Energy', value: statistics.total.energy, unit: 'kWh', icon: Battery, color: 'from-orange-500 to-red-500' }
        ].map((stat, index) => {
          const Icon = stat.icon;
          
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
              whileHover={{ scale: 1.05, rotateY: 10 }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 relative overflow-hidden"
            >
              <motion.div
                animate={{ 
                  background: [
                    'radial-gradient(circle at 0% 0%, rgba(99, 102, 241, 0.1) 0%, transparent 50%)',
                    'radial-gradient(circle at 100% 100%, rgba(99, 102, 241, 0.1) 0%, transparent 50%)',
                    'radial-gradient(circle at 0% 0%, rgba(99, 102, 241, 0.1) 0%, transparent 50%)'
                  ]
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute inset-0"
              />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                
                <div>
                  <h3 className="text-gray-400 text-sm font-medium mb-1">Total {stat.label}</h3>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-medium text-white">
                      {stat.value.toLocaleString()}
                    </span>
                    <span className="text-gray-400 text-sm">{stat.unit}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Analytics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          {/* Period Selector */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
            <h3 className="text-white text-lg font-medium mb-4">Time Period</h3>
            <div className="space-y-3">
              {periods.map((period) => {
                const Icon = period.icon;
                return (
                  <motion.button
                    key={period.key}
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPeriod(period.key)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                      selectedPeriod === period.key
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{period.label}</span>
                  </motion.button>
                );
              })}
            </div>
            
            {/* Custom Date Range Inputs */}
            {selectedPeriod === 'custom' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-3"
              >
                <div>
                  <label className="block text-gray-400 text-sm mb-2">From Date</label>
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">To Date</label>
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Metric Selector */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
            <h3 className="text-white text-lg font-medium mb-4">Metrics</h3>
            <div className="space-y-2">
              {metrics.map((metric) => (
                <motion.button
                  key={metric.key}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedMetric(metric.key)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg transition-all duration-200 ${
                    selectedMetric === metric.key
                      ? 'bg-indigo-500/30 border border-indigo-500/50'
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  <span className="text-white text-sm">{metric.label}</span>
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: metric.color }}
                  />
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Main Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-3 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white text-lg font-medium">
              Statistical Analysis - {selectedPeriod === 'custom' ? 
                (customDateFrom && customDateTo ? `${customDateFrom} to ${customDateTo}` : 'Custom Period') :
                periods.find(p => p.key === selectedPeriod)?.label
              }
            </h3>
            <motion.div
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center space-x-2 text-blue-400"
            >
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span className="text-sm">Historical Data</span>
            </motion.div>
          </div>
          
          <div className="h-80">
            {analyticsData.length === 0 ? (
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

      {/* Performance & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700"
        >
          <h3 className="text-white text-lg font-medium mb-6">Performance Score</h3>
          <div className="h-64">
            {performanceData.length === 0 || performanceData.every(d => d.value === 0) ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                  <p className="text-gray-300 text-lg font-medium">No Data Present</p>
                  <p className="text-gray-500 text-sm mt-2">Graph will be updated after successful data logging</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart data={performanceData}>
                <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                />
              </RadialBarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Usage Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700"
        >
          <h3 className="text-white text-lg font-medium mb-6">Usage Distribution</h3>
          <div className="h-64">
            {distributionData.length === 0 || distributionData.every(d => d.value === 0) ? (
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
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                />
              </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}