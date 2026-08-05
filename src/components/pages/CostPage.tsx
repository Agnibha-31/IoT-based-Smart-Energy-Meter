import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Calculator, TrendingUp, Clock, Zap, Receipt, RefreshCw, AlertTriangle } from 'lucide-react';
import { useSettings, CURRENCIES } from '../SettingsContext';
import { useLiveCurrency } from '../../utils/useLiveCurrency';
import { useElectricityRate } from '../../utils/useElectricityRate';
import { fetchSummary, fetchHistory, fetchCostProjection } from '../../utils/apiClient';

type CostPoint = { date: string; cost: number; energy: number; peakCost: number; offPeakCost: number };

interface LiveData {
  vrms: number;
  irms: number;
  power: number;
  energy: number;
  real_power_kw: number;
  apparent_power_kva: number;
  power_factor: number;
  reactive_power_kvar: number;
  instant_cost: number;
  carbon_footprint: number;
  timestamp: any;
}

interface CostPageProps {
  liveData?: LiveData;
}

const periodKeyToBackend = (key: string) => {
  switch (key) {
    case 'weekly': return 'week';
    case 'monthly': return 'month';
    case 'yearly': return 'year';
    default: return 'month';
  }
};

export default function CostPage({ liveData }: CostPageProps) {
  const { translate, setCurrency, currency } = useSettings();
  const {
    exchangeRates,
    convertFromINR
  } = useLiveCurrency();
  
  const {
    rate: electricityRate,
    rateInfo,
    isRefreshing: isRefreshingRate,
    forceRefresh: handleRefreshRate,
    isFresh,
    lastUpdate
  } = useElectricityRate();

  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [calculatorValues, setCalculatorValues] = useState({ voltage: 220, current: 15, hours: 24, rate: 9.0 });
  const [calculatedCost, setCalculatedCost] = useState(0);
  const [summary, setSummary] = useState<any | null>(null);
  const [projection, setProjection] = useState<any | null>(null);
  const [costData, setCostData] = useState<CostPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveCosts, setLiveCosts] = useState({ hourly: 0, daily: 0, monthly: 0, yearly: 0 });

  useEffect(() => { setSelectedCurrency(currency); }, [currency]);

  // Calculate cost based on user-input values in the calculator
  useEffect(() => {
    const { voltage, current, hours, rate } = calculatorValues;
    // Power (W) = Voltage × Current
    // Energy (kWh) = Power (W) × Hours / 1000
    // Cost = Energy (kWh) × Rate (per kWh)
    const energyKWh = (voltage * current * hours) / 1000;
    const costInINR = energyKWh * rate;
    const convertedCost = convertFromINR(costInINR, selectedCurrency);
    setCalculatedCost(convertedCost);
  }, [calculatorValues, selectedCurrency, exchangeRates, convertFromINR]);

  // Calculate live costs based on real-time data
  useEffect(() => {
    if (liveData && electricityRate) {
      // Calculate power in kW
      const powerKW = (liveData.real_power_kw || (liveData.vrms * liveData.irms / 1000)) || 0;
      
      // Calculate costs in INR
      const hourlyCostINR = powerKW * electricityRate;
      const dailyCostINR = hourlyCostINR * 24;
      const monthlyCostINR = dailyCostINR * 30;
      const yearlyCostINR = dailyCostINR * 365;
      
      setLiveCosts({
        hourly: hourlyCostINR,
        daily: dailyCostINR,
        monthly: monthlyCostINR,
        yearly: yearlyCostINR
      });
    }
  }, [liveData, electricityRate]);

  const buildCostBuckets = useCallback((history: any[], baseRate: number, energySplit: any): CostPoint[] => {
    if (!Array.isArray(history) || !history.length) return [];
    const peakPct = energySplit?.peak ?? 0;
    const offPeakPct = energySplit?.offPeak ?? 0;
    if (selectedPeriod === 'yearly') {
      const byMonth: Record<string, number> = {};
      history.forEach(p => {
        const ts = Number(p.timestamp); if (!ts) return;
        const d = new Date(ts * 1000);
        const key = d.getFullYear() + '-' + d.getMonth();
        byMonth[key] = (byMonth[key] || 0) + (Number(p.energyKwh) || 0);
      });
      return Object.entries(byMonth).sort((a,b)=>a[0].localeCompare(b[0])).map(([key, energy]) => {
        const [, m] = key.split('-');
        const monthLabel = new Date(2000, Number(m), 1).toLocaleDateString('en-US',{month:'short'});
        const cost = energy * baseRate;
        return {
          date: monthLabel,
          energy: Number(energy.toFixed(3)),
          cost: Number(cost.toFixed(2)),
          peakCost: Number((cost * peakPct/100).toFixed(2)),
          offPeakCost: Number((cost * offPeakPct/100).toFixed(2))
        };
      });
    }
    const byDay: Record<string, number> = {};
    history.forEach(p => {
      const ts = Number(p.timestamp); if (!ts) return;
      const d = new Date(ts * 1000);
      const key = d.toISOString().split('T')[0];
      byDay[key] = (byDay[key] || 0) + (Number(p.energyKwh) || 0);
    });
    return Object.entries(byDay).sort((a,b)=>a[0].localeCompare(b[0])).map(([key, energy]) => {
      const cost = energy * baseRate;
      return {
        date: key,
        energy: Number(energy.toFixed(3)),
        cost: Number(cost.toFixed(2)),
        peakCost: Number((cost * peakPct/100).toFixed(2)),
        offPeakCost: Number((cost * offPeakPct/100).toFixed(2))
      };
    });
  }, [selectedPeriod]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true); setError(null);
      try {
        const backendPeriod = periodKeyToBackend(selectedPeriod);
        const summaryResp = await fetchSummary({ period: backendPeriod });
        const historyResp = await fetchHistory({ period: backendPeriod, interval_seconds: 3600 });
        const costResp = await fetchCostProjection({ period: backendPeriod });
        if (cancelled) return;
        const s = (summaryResp as any).summary;
        const proj = (costResp as any).projection;
        setSummary(s); setProjection(proj);
        const points = (historyResp as any)?.points || [];
        const buckets = buildCostBuckets(points, proj?.baseRate ?? 0, s?.energySplit || {});
        setCostData(buckets);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load cost data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [selectedPeriod, buildCostBuckets]);

  const getCurrencySymbol = () => {
    const currencyInfo = CURRENCIES.find(c => c.code === selectedCurrency);
    return currencyInfo?.symbol || '$';
  };

  const handleCurrencyChange = (newCurrency: string) => {
    setSelectedCurrency(newCurrency);
    setCurrency(newCurrency);
  };

  const convertCurrency = (inrAmount: number) => {
    const amount = typeof inrAmount === 'string' ? parseFloat(inrAmount as any) : inrAmount;
    if (isNaN(amount)) return '0.00';
    return convertFromINR(amount, selectedCurrency).toFixed(2);
  };

  const periods = [
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'yearly', label: 'Yearly' }
  ];

  // Use live costs for breakdown calculation, fallback to projection
  const totalCostINR = liveCosts.daily > 0 ? liveCosts.daily : (projection?.daily ?? 0);
  const costBreakdown = [
    { name: 'Energy Cost', value: totalCostINR * 0.72, color: '#3b82f6' },
    { name: 'Transmission', value: totalCostINR * 0.12, color: '#10b981' },
    { name: 'Distribution', value: totalCostINR * 0.10, color: '#f59e0b' },
    { name: 'Taxes & Fees', value: totalCostINR * 0.06, color: '#ef4444' }
  ];

  const rateStructure = [
    { time: 'Peak (2-8 PM)', rate: (projection?.baseRate ?? 6.5) * 1.46, usage: summary?.energySplit?.peak ?? 0 },
    { time: 'Shoulder (10 AM-2 PM)', rate: (projection?.baseRate ?? 6.5) * 1.0, usage: summary?.energySplit?.shoulder ?? 0 },
    { time: 'Off-Peak (8 PM-10 AM)', rate: (projection?.baseRate ?? 6.5) * 0.65, usage: summary?.energySplit?.offPeak ?? 0 }
  ];

  const currentBill = {
    previous: projection ? projection.monthly * 1.05 : 0,
    current: projection ? projection.monthly : 0,
    savings: projection ? (projection.monthly * 1.05 - projection.monthly) : 0,
    dueDate: new Date(Date.now() + 14*86400000).toISOString().split('T')[0]
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
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-medium text-white">{translate('cost_analysis')}</h1>
            <p className="text-gray-400">{translate('track_electricity_costs')}</p>
          </div>
        </div>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRefreshRate}
          className={`px-6 py-3 rounded-lg border flex items-center space-x-3 cursor-pointer ${
            isFresh 
              ? 'bg-green-500/20 border-green-500/30' 
              : 'bg-yellow-500/20 border-yellow-500/30'
          }`}
        >
          <RefreshCw className={`w-5 h-5 ${
            isFresh ? 'text-green-400' : 'text-yellow-400'
          } ${isRefreshingRate ? 'animate-spin' : ''}`} />
          <div>
            <p className="text-gray-400 text-xs">{translate('current_rate')}</p>
            <p className="text-white font-medium text-lg">₹{electricityRate.toFixed(2)}/kWh</p>
            <p className={`text-xs ${
              isFresh ? 'text-green-400' : 'text-yellow-400'
            }`}>
              {rateInfo.source} • {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Loading...'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Live Cost Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: translate('hourly_cost'), value: `${getCurrencySymbol()}${convertCurrency(liveCosts.hourly)}`, icon: Clock, color: 'from-blue-500 to-cyan-500' },
          { label: translate('daily_cost'), value: `${getCurrencySymbol()}${convertCurrency(liveCosts.daily)}`, icon: DollarSign, color: 'from-green-500 to-emerald-500' },
          { label: translate('monthly_est'), value: `${getCurrencySymbol()}${convertCurrency(liveCosts.monthly)}`, icon: Receipt, color: 'from-purple-500 to-violet-500' },
          { label: translate('yearly_est'), value: `${getCurrencySymbol()}${convertCurrency(liveCosts.yearly)}`, icon: TrendingUp, color: 'from-orange-500 to-red-500' }
        ].map((metric, index) => {
          const Icon = metric.icon;
          
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
              whileHover={{ scale: 1.05, rotateY: 5 }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 relative overflow-hidden"
            >
              <motion.div
                animate={{ 
                  background: [
                    'radial-gradient(circle at 0% 0%, rgba(34, 197, 94, 0.1) 0%, transparent 50%)',
                    'radial-gradient(circle at 100% 100%, rgba(34, 197, 94, 0.1) 0%, transparent 50%)',
                    'radial-gradient(circle at 0% 0%, rgba(34, 197, 94, 0.1) 0%, transparent 50%)'
                  ]
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute inset-0"
              />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${metric.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <Zap className="w-5 h-5 text-green-400" />
                </div>
                
                <div>
                  <h3 className="text-gray-400 text-sm font-medium mb-1">{metric.label}</h3>
                  <motion.span
                    key={metric.value}
                    initial={{ scale: 1.3, color: '#22c55e' }}
                    animate={{ scale: 1, color: '#ffffff' }}
                    transition={{ duration: 0.6 }}
                    className="text-2xl font-medium text-white"
                  >
                    {metric.value}
                  </motion.span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Calculator */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Calculator className="w-5 h-5 text-blue-400" />
            <h3 className="text-white text-lg font-medium">{translate('cost_calculator')}</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">{translate('voltage_v')}</label>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="number"
                min="0"
                value={calculatorValues.voltage === 0 ? '' : calculatorValues.voltage}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  setCalculatorValues(prev => ({ ...prev, voltage: isNaN(value) ? 0 : value }));
                }}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
              />
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">{translate('current_a')}</label>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="number"
                min="0"
                value={calculatorValues.current === 0 ? '' : calculatorValues.current}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  setCalculatorValues(prev => ({ ...prev, current: isNaN(value) ? 0 : value }));
                }}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
              />
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">{translate('usage_hours')}</label>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="number"
                min="0"
                value={calculatorValues.hours === 0 ? '' : calculatorValues.hours}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  setCalculatorValues(prev => ({ ...prev, hours: isNaN(value) ? 0 : value }));
                }}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
              />
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">Rate (₹/kWh)</label>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="number"
                step="0.01"
                min="0"
                value={calculatorValues.rate === 0 ? '' : calculatorValues.rate}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  setCalculatorValues(prev => ({ ...prev, rate: isNaN(value) ? 0 : value }));
                }}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
              />
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">{translate('select_currency')}</label>
              <motion.select
                whileFocus={{ scale: 1.02 }}
                value={selectedCurrency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
              >
                {CURRENCIES.map(curr => (
                  <option key={curr.code} value={curr.code}>
                    {curr.symbol} {curr.name} ({curr.code})
                  </option>
                ))}
              </motion.select>
            </div>
            
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30"
            >
              <div className="text-center">
                <p className="text-green-400 text-sm font-medium mb-1">{translate('calculated_cost')}</p>
                <div className="flex items-center justify-center space-x-2">
                  {isRefreshingRate && (
                    <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                  )}
                  <p className="text-2xl font-medium text-white">
                    {getCurrencySymbol()}{calculatedCost.toFixed(4)}
                  </p>
                </div>
                {!isFresh && (
                  <p className="text-xs mt-1 text-yellow-400">
                    ⚠️ Using cached rates
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Cost Trends Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white text-lg font-medium">{translate('cost_trends')}</h3>
            <div className="flex space-x-2">
              {periods.map((period) => (
                <motion.button
                  key={period.key}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedPeriod(period.key)}
                  className={`px-3 py-1 text-sm rounded-lg transition-all duration-200 ${
                    selectedPeriod === period.key
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  {period.label}
                </motion.button>
              ))}
            </div>
          </div>
          
          <div className="h-80">
            {costData.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                  <p className="text-gray-300 text-lg font-medium">No Data Present</p>
                  <p className="text-gray-500 text-sm mt-2">Graph will be updated after successful data logging</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={costData}>
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
                <Line type="monotone" dataKey="cost" stroke="#22c55e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="peakCost" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="offPeakCost" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>

      {/* Additional Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Bill */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Receipt className="w-5 h-5 text-indigo-400" />
            <h3 className="text-white text-lg font-medium">{translate('current_bill')}</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-400">{translate('previous_month')}:</span>
              <span className="text-white">{getCurrencySymbol()}{convertCurrency(currentBill.previous)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">{translate('current_month')}:</span>
              <span className="text-white">{getCurrencySymbol()}{convertCurrency(currentBill.current)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-500/20 rounded-lg border border-green-500/30">
              <span className="text-green-400">{translate('savings')}:</span>
              <span className="text-green-400 font-medium">{getCurrencySymbol()}{convertCurrency(currentBill.savings)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-500/20 rounded-lg border border-orange-500/30">
              <span className="text-orange-400">{translate('due_date')}:</span>
              <span className="text-orange-400 font-medium">{currentBill.dueDate}</span>
            </div>
          </div>
        </motion.div>

        {/* Rate Structure */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700"
        >
          <h3 className="text-white text-lg font-medium mb-6">{translate('rate_structure')}</h3>
          
          <div className="space-y-3">
            {rateStructure.map((rate, index) => (
              <motion.div
                key={rate.time}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex justify-between items-center p-3 bg-slate-700 rounded-lg"
              >
                <div>
                  <p className="text-white text-sm font-medium">{rate.time}</p>
                  <p className="text-gray-400 text-xs">{rate.usage?.toFixed(2)}% {translate('usage')}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">₹{rate.rate.toFixed(2)}/kWh</p>
                  <div className="w-12 bg-gray-600 rounded-full h-2 mt-1">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${rate.usage}%` }}
                      transition={{ duration: 1, delay: 0.2 * index }}
                      className="bg-green-500 h-2 rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Cost Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700"
        >
          <h3 className="text-white text-lg font-medium mb-6">{translate('cost_breakdown')}</h3>
          
          <div className="space-y-4">
            {totalCostINR > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={costBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                      label={(entry) => `${((entry.value / totalCostINR) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {costBreakdown.map((entry, index) => (
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
                      formatter={(value: any) => `₹${Number(value).toFixed(2)}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-400 text-sm">No cost data available</p>
                  <p className="text-gray-500 text-xs mt-1">Waiting for live power consumption data...</p>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              {costBreakdown.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-300 text-sm">{item.name}</span>
                  </div>
                  <span className="text-white text-sm font-medium">
                    {getCurrencySymbol()}{convertCurrency(item.value)}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
      {loading && <div className="text-center text-sm text-gray-400">Loading cost data...</div>}
    </motion.div>
  );
}