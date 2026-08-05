import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Battery, TrendingUp, Calendar, Clock, Leaf, Zap, AlertTriangle } from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { subscribeToLiveReadings, fetchLatest, type LiveReading } from '../../utils/liveApi';
import { fetchSummary, fetchHistory } from '../../utils/apiClient';

type EnergyPoint = { date: string; energy: number; renewable: number };

const periodKeyToBackend = (key: string) => {
  switch (key) {
    case 'weekly': return 'week';
    case 'monthly': return 'month';
    case 'yearly': return 'year';
    default: return 'month';
  }
};

export default function EnergyPage() {
  const { translate } = useSettings();
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [liveEnergy, setLiveEnergy] = useState<number>(0);
  const [summary, setSummary] = useState<any | null>(null);
  const [energyData, setEnergyData] = useState<EnergyPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Live energy statistics tracking (resets on page load/refresh)
  const [liveEnergyStats, setLiveEnergyStats] = useState({
    energyReadings: [] as { energy: number; timestamp: number; hour: number }[],
    peakEnergy: 0,
    offPeakEnergy: 0,
    shoulderEnergy: 0,
    renewableEnergy: 0,
    totalTracked: 0,
    dailyPeak: 0
  });

  // Fetch latest live reading and track energy statistics by time of day
  useEffect(() => {
    let unsub = () => {};
    let previousEnergy = 0;
    
    const updateEnergyStats = (reading: LiveReading) => {
      const currentEnergy = reading.energy_kwh ?? reading.total_energy_kwh ?? 0;
      const timestamp = (reading.captured_at ?? reading.created_at ?? Math.floor(Date.now() / 1000)) * 1000;
      const hour = new Date(timestamp).getHours();
      
      setLiveEnergy(currentEnergy);
      
      // Calculate energy delta from previous reading
      const energyDelta = previousEnergy > 0 ? Math.max(0, currentEnergy - previousEnergy) : 0;
      previousEnergy = currentEnergy;
      
      if (energyDelta > 0 || currentEnergy > 0) {
        setLiveEnergyStats(prev => {
          const newReading = { energy: currentEnergy, timestamp, hour };
          const newReadings = [...prev.energyReadings, newReading];
          
          // Classify energy by time of day
          // Peak: 17:00-22:00 (5 PM - 10 PM)
          // Off-Peak: 00:00-06:00 (12 AM - 6 AM)
          // Shoulder: Everything else
          // Renewable: 10:00-16:00 (10 AM - 4 PM) - solar hours
          let peakEnergy = prev.peakEnergy;
          let offPeakEnergy = prev.offPeakEnergy;
          let shoulderEnergy = prev.shoulderEnergy;
          let renewableEnergy = prev.renewableEnergy;
          
          if (energyDelta > 0) {
            if (hour >= 17 && hour < 22) {
              peakEnergy += energyDelta;
            } else if (hour >= 0 && hour < 6) {
              offPeakEnergy += energyDelta;
            } else {
              shoulderEnergy += energyDelta;
            }
            
            // Track renewable energy (solar hours)
            if (hour >= 10 && hour < 16) {
              renewableEnergy += energyDelta;
            }
          }
          
          const totalTracked = peakEnergy + offPeakEnergy + shoulderEnergy;
          const dailyPeak = Math.max(...newReadings.map(r => r.energy));
          
          return {
            energyReadings: newReadings,
            peakEnergy,
            offPeakEnergy,
            shoulderEnergy,
            renewableEnergy,
            totalTracked,
            dailyPeak
          };
        });
      }
    };
    
    fetchLatest().then(r => {
      const reading = (r as any)?.reading as LiveReading | undefined;
      if (reading) {
        const ts = (reading.captured_at ?? reading.created_at ?? Math.floor(Date.now() / 1000)) * 1000;
        const ageMinutes = (Date.now() - ts) / 60000;
        
        // Only use if device is online (data within 5 minutes)
        if (ageMinutes <= 5) {
          updateEnergyStats(reading);
        }
        // Otherwise leave at 0 (device offline)
      }
    }).catch(() => {});
    
    unsub = subscribeToLiveReadings(lr => {
      updateEnergyStats(lr);
    });
    
    return () => unsub();
  }, []);

  const buildEnergyBuckets = useCallback((history: any[], renewableShare: number): EnergyPoint[] => {
    if (!Array.isArray(history) || !history.length) return [];
    // Determine grouping granularity based on selectedPeriod
    if (selectedPeriod === 'yearly') {
      // Group by month
      const byMonth: Record<string, number> = {};
      history.forEach(p => {
        const ts = Number(p.timestamp);
        if (!ts) return;
        const d = new Date(ts * 1000);
        const key = d.getFullYear() + '-' + d.getMonth();
        byMonth[key] = (byMonth[key] || 0) + (Number(p.energyKwh) || 0);
      });
      return Object.entries(byMonth)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, energy]) => {
          const [, monthIdxStr] = key.split('-');
          const monthIdx = Number(monthIdxStr);
          const dateLabel = new Date(2000, monthIdx, 1).toLocaleDateString('en-US', { month: 'short' });
          return { date: dateLabel, energy: Number(energy.toFixed(3)), renewable: Number((energy * renewableShare / 100).toFixed(3)) };
        });
    }
    // Weekly / Monthly: group by calendar day
    const byDay: Record<string, number> = {};
    history.forEach(p => {
      const ts = Number(p.timestamp);
      if (!ts) return;
      const d = new Date(ts * 1000);
      const key = d.toISOString().split('T')[0];
      byDay[key] = (byDay[key] || 0) + (Number(p.energyKwh) || 0);
    });
    return Object.entries(byDay)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, energy]) => ({
        date: key,
        energy: Number(energy.toFixed(3)),
        renewable: Number((energy * renewableShare / 100).toFixed(3)),
      }));
  }, [selectedPeriod]);

  // Fetch summary + history whenever period changes
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true); setError(null);
      try {
        const backendPeriod = periodKeyToBackend(selectedPeriod);
        const summaryResp = await fetchSummary({ period: backendPeriod });
        const historyResp = await fetchHistory({ period: backendPeriod, interval_seconds: 3600 });
        if (cancelled) return;
        const s = (summaryResp as any).summary;
        setSummary(s);
        const points = (historyResp as any)?.points || [];
        const buckets = buildEnergyBuckets(points, s?.renewableShare ?? 0);
        
        // Add live energy data point for real-time chart integration
        if (liveEnergy > 0) {
          const livePoint: EnergyPoint = {
            date: 'Now',
            energy: liveEnergy,
            renewable: liveEnergyStats.totalTracked > 0 
              ? liveEnergyStats.renewableEnergy 
              : liveEnergy * ((s?.renewableShare ?? 0) / 100)
          };
          setEnergyData([...buckets, livePoint]);
        } else {
          setEnergyData(buckets);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load energy data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [selectedPeriod, buildEnergyBuckets, liveEnergy, liveEnergyStats]);

  const periods = [
    { key: 'weekly', label: 'Weekly', icon: Calendar },
    { key: 'monthly', label: 'Monthly', icon: Calendar },
    { key: 'yearly', label: 'Yearly', icon: Calendar }
  ];

  const totalEnergy = summary?.totals?.energy_kwh ?? 0;
  const historicalOffPeakPct = summary?.energySplit?.offPeak ?? 0;
  const historicalRenewablePct = summary?.renewableShare ?? 0;
  const historicalDailyPeak = energyData.length ? Math.max(...energyData.map(d => d.energy)) : 0;
  
  // Use live calculated values when available, otherwise fall back to historical
  const dailyPeakEnergy = liveEnergyStats.dailyPeak > 0 ? liveEnergyStats.dailyPeak : historicalDailyPeak;
  
  const offPeakEnergy = liveEnergyStats.totalTracked > 0 
    ? liveEnergyStats.offPeakEnergy 
    : (totalEnergy * historicalOffPeakPct / 100);
  
  const renewablePct = liveEnergyStats.totalTracked > 0
    ? (liveEnergyStats.renewableEnergy / liveEnergyStats.totalTracked * 100)
    : historicalRenewablePct;

  const stats = [
    {
      label: 'Current Energy',
      value: ((liveEnergy || totalEnergy) * 1000).toFixed(0),
      unit: 'Wh',
      icon: Battery,
      color: 'from-orange-500 to-red-500',
      change: ''
    },
    {
      label: 'Daily Peak',
      value: (dailyPeakEnergy * 1000).toFixed(0),
      unit: 'Wh',
      icon: TrendingUp,
      color: 'from-red-500 to-pink-500',
      change: ''
    },
    {
      label: 'Off-Peak Usage',
      value: (offPeakEnergy * 1000).toFixed(0),
      unit: 'Wh',
      icon: Clock,
      color: 'from-blue-500 to-cyan-500',
      change: ''
    },
    {
      label: 'Renewable %',
      value: renewablePct.toFixed(1),
      unit: '%',
      icon: Leaf,
      color: 'from-green-500 to-emerald-500',
      change: ''
    }
  ];

  // Calculate efficiency score with live integration
  const historicalEfficiency = summary?.efficiencyScore ?? 0;
  const liveEfficiencyBonus = liveEnergyStats.totalTracked > 0
    ? Math.min(5, (liveEnergyStats.renewableEnergy / liveEnergyStats.totalTracked) * 10) // Up to 5% bonus for renewable
    : 0;
  const currentEfficiency = Math.min(100, historicalEfficiency + liveEfficiencyBonus);
  
  const energyEfficiency = {
    current: currentEfficiency,
    target: Math.min(100, currentEfficiency + 10),
    improvement: Math.max(0, Math.min(100, currentEfficiency + 10) - currentEfficiency)
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
          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
            <Battery className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-medium text-white">Energy Management</h1>
            <p className="text-gray-400">Period energy: {(totalEnergy * 1000).toLocaleString(undefined,{maximumFractionDigits:0})} Wh</p>
          </div>
        </div>
        
        <motion.div
          animate={{ 
            boxShadow: [
              '0 0 20px rgba(249, 115, 22, 0.3)',
              '0 0 40px rgba(249, 115, 22, 0.6)',
              '0 0 20px rgba(249, 115, 22, 0.3)'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="px-4 py-2 bg-orange-500/20 rounded-lg border border-orange-500/30"
        >
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-orange-400" />
            <span className="text-orange-400 font-medium">{((liveEnergy || totalEnergy) * 1000).toFixed(0)} Wh</span>
          </div>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const isPositive = stat.change.startsWith('+');
          
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 relative overflow-hidden"
            >
              {/* Animated Energy Flow */}
              <motion.div
                animate={{ 
                  opacity: [0.1, 0.3, 0.1],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent"
              />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {stat.change}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-gray-400 text-sm font-medium mb-1">{stat.label}</h3>
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

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Period Controls & Efficiency */}
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
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{period.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Energy Efficiency */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
            <h3 className="text-white text-lg font-medium mb-4">Efficiency Score</h3>
            <div className="space-y-4">
              <div className="relative">
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${energyEfficiency.current}%` }}
                    transition={{ duration: 2, delay: 0.5 }}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full"
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-400 mt-2">
                  <span>Current: {energyEfficiency.current}%</span>
                  <span>Target: {energyEfficiency.target}%</span>
                </div>
              </div>
              
              <motion.div
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-center p-3 bg-green-500/20 rounded-lg border border-green-500/30"
              >
                <Leaf className="w-6 h-6 text-green-400 mx-auto mb-1" />
                <p className="text-green-400 text-sm">
                  +{energyEfficiency.improvement}% improvement
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Energy Consumption Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-3 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white text-lg font-medium">
              Energy Consumption - {periods.find(p => p.key === selectedPeriod)?.label}
            </h3>
              <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full" />
                <span className="text-gray-400 text-sm">Total Energy</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-gray-400 text-sm">Renewable</span>
              </div>
            </div>
          </div>
          
          <div className="h-80">
            {energyData.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                  <p className="text-gray-300 text-lg font-medium">No Data Present</p>
                  <p className="text-gray-500 text-sm mt-2">Graph will be updated after successful data logging</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={energyData}>
                <defs>
                  <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="renewableGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af" 
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="energy"
                  stroke="#f97316"
                  strokeWidth={2}
                  fill="url(#energyGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="renewable"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#renewableGradient)"
                />
              </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>
      {loading && (
        <div className="text-center text-sm text-gray-400">Loading energy data...</div>
      )}
    </motion.div>
  );
}