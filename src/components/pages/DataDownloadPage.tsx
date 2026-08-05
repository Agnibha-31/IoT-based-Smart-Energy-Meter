import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Calendar, FileText, Database, CheckCircle, Filter, AlertCircle, Trash2, Eye, Save, X, HardDrive } from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { toast } from 'sonner';
import { getDownloadPreview, downloadReadings, getDatabaseStats } from '../../utils/apiClient';

export default function DataDownloadPage() {
  const { translate, getCurrentTime, getLocationName } = useSettings();
  const [selectedDateFrom, setSelectedDateFrom] = useState('');
  const [selectedDateTo, setSelectedDateTo] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [selectedMetrics, setSelectedMetrics] = useState(['voltage', 'current', 'real_power_kw', 'energy_kwh', 'power_factor']);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadHistory, setDownloadHistory] = useState(() => {
    const saved = localStorage.getItem('smartmeter_download_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [compressionEnabled, setCompressionEnabled] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [samplingRate, setSamplingRate] = useState('all');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [dbStats, setDbStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 1000);
    return () => clearInterval(timer);
  }, [getCurrentTime]);

  // Fetch database stats on mount and periodically
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoadingStats(true);
      try {
        const stats = await getDatabaseStats();
        setDbStats(stats);
      } catch (error) {
        console.error('Failed to fetch database stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats(); // Initial fetch
    const statsTimer = setInterval(fetchStats, 30000); // Refresh every 30 seconds

    return () => clearInterval(statsTimer);
  }, []);

  // Save download history to localStorage
  useEffect(() => {
    localStorage.setItem('smartmeter_download_history', JSON.stringify(downloadHistory));
  }, [downloadHistory]);

  // Set default dates on load
  useEffect(() => {
    if (!selectedDateFrom || !selectedDateTo) {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      setSelectedDateTo(today.toISOString().split('T')[0]);
      setSelectedDateFrom(yesterday.toISOString().split('T')[0]);
    }
  }, [selectedDateFrom, selectedDateTo]);

  const formats = [
    { 
      key: 'csv', 
      label: 'CSV', 
      description: 'Comma-separated values - Universal format', 
      icon: FileText,
      extension: '.csv',
      mimeType: 'text/csv'
    },
    { 
      key: 'excel', 
      label: 'Excel', 
      description: 'Microsoft Excel spreadsheet format', 
      icon: Database,
      extension: '.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  ];

  const metrics = [
    { key: 'voltage', label: 'Voltage (V)', color: 'from-blue-500 to-cyan-500', unit: 'V' },
    { key: 'current', label: 'Current (A)', color: 'from-green-500 to-emerald-500', unit: 'A' },
    { key: 'real_power_kw', label: 'Real Power (W)', color: 'from-purple-500 to-violet-500', unit: 'W', convertFromKilo: true },
    { key: 'apparent_power_kva', label: 'Apparent Power (VA)', color: 'from-emerald-500 to-teal-500', unit: 'VA', convertFromKilo: true },
    { key: 'reactive_power_kvar', label: 'Reactive Power (VAR)', color: 'from-cyan-500 to-blue-500', unit: 'VAR', convertFromKilo: true },
    { key: 'energy_kwh', label: 'Energy (Wh)', color: 'from-orange-500 to-red-500', unit: 'Wh', convertFromKilo: true },
    { key: 'total_energy_kwh', label: 'Total Energy (Wh)', color: 'from-amber-500 to-yellow-500', unit: 'Wh', convertFromKilo: true },
    { key: 'frequency', label: 'Frequency (Hz)', color: 'from-indigo-500 to-blue-500', unit: 'Hz' },
    { key: 'power_factor', label: 'Power Factor', color: 'from-pink-500 to-rose-500', unit: '' },
  ];

  const presetRanges = [
    { label: 'Last Hour', hours: 1 },
    { label: 'Last 6 Hours', hours: 6 },
    { label: 'Last 24 Hours', hours: 24 },
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'Last 90 Days', days: 90 },
    { label: 'Last Year', days: 365 }
  ];

  const samplingRateOptions = [
    { value: 'all', label: 'All Data Points', description: 'Every recorded measurement' },
    { value: '1min', label: '1 Minute', description: 'One reading per minute' },
    { value: '5min', label: '5 Minutes', description: 'One reading every 5 minutes' },
    { value: '15min', label: '15 Minutes', description: 'One reading every 15 minutes' },
    { value: '1hour', label: '1 Hour', description: 'One reading per hour' },
    { value: '1day', label: '1 Day', description: 'Daily averages' }
  ];

  const buildRangeSeconds = () => {
    if (!selectedDateFrom || !selectedDateTo) return null;
    const fromDate = new Date(`${selectedDateFrom}T00:00:00`);
    const toDate = new Date(`${selectedDateTo}T23:59:59`);
    const fromSeconds = Math.floor(fromDate.getTime() / 1000);
    const toSeconds = Math.floor(toDate.getTime() / 1000);
    if (Number.isNaN(fromSeconds) || Number.isNaN(toSeconds) || fromSeconds > toSeconds) {
      return null;
    }
    return { from: fromSeconds, to: toSeconds, duration: Math.max(toSeconds - fromSeconds, 1) };
  };

  const estimatePointsFromRange = () => {
    const range = buildRangeSeconds();
    if (!range) return 0;
    const hours = range.duration / 3600;
    switch (samplingRate) {
      case '1min':
        return Math.floor(hours * 60);
      case '5min':
        return Math.floor(hours * 12);
      case '15min':
        return Math.floor(hours * 4);
      case '1hour':
        return Math.floor(hours);
      case '1day':
        return Math.floor(range.duration / 86400);
      default:
        return Math.min(Math.floor(hours * 3600), 50000);
    }
  };

  const previewTimestampLabel = (row: Record<string, any>) => {
    if (row.iso8601) {
      return new Date(row.iso8601).toLocaleString();
    }
    if (row.timestamp) {
      const ts = Number(row.timestamp);
      if (!Number.isNaN(ts)) {
        const ms = ts > 1e12 ? ts : ts * 1000;
        return new Date(ms).toLocaleString();
      }
    }
    return '-';
  };

  const compressionSupported = typeof window !== 'undefined' && 'CompressionStream' in window;

  const maybeCompressBlob = async (blob: Blob, baseName: string) => {
    if (!compressionEnabled || !compressionSupported || typeof window === 'undefined') {
      return { blob, fileName: baseName };
    }
    const CompressionCtor = (window as any).CompressionStream;
    if (!CompressionCtor) {
      return { blob, fileName: baseName };
    }
    try {
      const compressedStream = blob.stream().pipeThrough(new CompressionCtor('gzip'));
      const compressedBlob = await new Response(compressedStream).blob();
      return { blob: compressedBlob, fileName: `${baseName}.gz` };
    } catch (error) {
      console.warn('Compression failed, sending original file', error);
      return { blob, fileName: baseName };
    }
  };

  const handleMetricToggle = (metricKey: string) => {
    setSelectedMetrics(prev => {
      const label = metrics.find((m) => m.key === metricKey)?.label || metricKey;
      const newMetrics = prev.includes(metricKey)
        ? prev.filter(m => m !== metricKey)
        : [...prev, metricKey];
      
      toast.success(`${label} ${prev.includes(metricKey) ? 'removed from' : 'added to'} selection`);
      return newMetrics;
    });
  };

  const handleSelectAllMetrics = () => {
    if (selectedMetrics.length === metrics.length) {
      setSelectedMetrics([]);
      toast.success('All metrics deselected');
    } else {
      setSelectedMetrics(metrics.map(m => m.key));
      toast.success('All metrics selected');
    }
  };

  const handlePresetRange = (preset: any) => {
    const to = new Date();
    const from = new Date();
    
    if (preset.hours) {
      from.setHours(from.getHours() - preset.hours);
    } else if (preset.days) {
      from.setDate(from.getDate() - preset.days);
    }
    
    setSelectedDateTo(to.toISOString().split('T')[0]);
    setSelectedDateFrom(from.toISOString().split('T')[0]);
    toast.success(`Date range set to ${preset.label}`);
  };

  const generateFileName = () => {
    const formatInfo = formats.find((f) => f.key === selectedFormat) || formats[0];
    const dateRange = `${selectedDateFrom || 'start'}_to_${selectedDateTo || 'end'}`;
    const metricsStr = selectedMetrics.length > 3 ? 'multiple_metrics' : selectedMetrics.join('_');
    return `smartmeter_data_${dateRange}_${metricsStr}${formatInfo.extension || ''}`;
  };

  const calculateFileSize = () => {
    if (!selectedDateFrom || !selectedDateTo || selectedMetrics.length === 0) {
      return '0.0';
    }

    const previewCount = Array.isArray(previewData) && previewData.length > 1 ? previewData.length : null;
    const pointCount = previewCount ?? Math.max(1, estimatePointsFromRange());
    if (!pointCount) return '0.0';

    const timestampSize = 25;
    const metricSize = 8;
    const headerSize = includeMetadata ? 500 : 100;

    let totalSize = headerSize + pointCount * (timestampSize + (selectedMetrics.length * metricSize));

    if (selectedFormat === 'excel') {
      totalSize *= 1.5;
    } else if (selectedFormat === 'csv') {
      totalSize *= 1.1;
    }

    const shouldCompress = compressionEnabled && compressionSupported;
    if (shouldCompress) {
      totalSize *= 0.35;
    }

    return (totalSize / (1024 * 1024)).toFixed(1);
  };


  const handlePreviewData = async () => {
    if (!isValidRange) {
      toast.error('Please select a valid date range');
      return;
    }

    if (selectedMetrics.length === 0) {
      toast.error('Please select at least one metric');
      return;
    }

    const range = buildRangeSeconds();
    if (!range) {
      toast.error('Invalid date selection');
      return;
    }

    setIsGeneratingPreview(true);

    try {
      const preview = await getDownloadPreview({
        from: range.from,
        to: range.to,
        metrics: selectedMetrics.join(','),
        sampling: samplingRate,
      });
      const dataset = preview.points || [];
      if (!dataset.length) {
        toast.error('No telemetry found for the selected period');
        return;
      }
      setPreviewData(dataset);
      setShowPreview(true);
      toast.success(`Preview ready: ${dataset.length.toLocaleString()} rows`);
    } catch (error: any) {
      console.error('Preview generation error:', error);
      toast.error(error?.message || 'Failed to generate preview');
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleDownload = async () => {
    if (!canDownload) {
      toast.error('Please select a valid date range and at least one metric');
      return;
    }

    const range = buildRangeSeconds();
    if (!range) {
      toast.error('Invalid date selection');
      return;
    }

    setIsDownloading(true);
    setDownloadComplete(false);
    setDownloadProgress(0);
    const progressInterval = setInterval(() => {
      setDownloadProgress((prev) => (prev >= 90 ? 90 : prev + Math.random() * 10));
    }, 200);

    try {
      const params: Record<string, string> = {
        from: String(range.from),
        to: String(range.to),
        format: selectedFormat,
        metrics: selectedMetrics.join(','),
        sampling: samplingRate,
        include_metadata: String(includeMetadata),
      };

      const blob = await downloadReadings(params);
      let fileName = generateFileName();
      const { blob: finalBlob, fileName: maybeCompressedName } = await maybeCompressBlob(blob, fileName);
      fileName = maybeCompressedName;

      const url = URL.createObjectURL(finalBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const downloadRecord = {
        id: Date.now(),
        fileName,
        format: selectedFormat,
        dateRange: `${selectedDateFrom} to ${selectedDateTo}`,
        metrics: selectedMetrics.length,
        sampling: samplingRate,
        size: calculateFileSize(),
        downloadedAt: new Date().toISOString(),
      };
      setDownloadHistory((prev: any) => [downloadRecord, ...prev.slice(0, 19)]);

      setDownloadProgress(100);
      setIsDownloading(false);
      setDownloadComplete(true);
      toast.success(`Successfully downloaded ${fileName}`);
      setTimeout(() => {
        setDownloadComplete(false);
        setDownloadProgress(0);
      }, 3000);
    } catch (error: any) {
      console.error('Download error:', error);
      setIsDownloading(false);
      setDownloadProgress(0);
      toast.error(error?.message || 'Download failed. Please try again.');
    } finally {
      clearInterval(progressInterval);
    }
  };

  const handleClearHistory = () => {
    setDownloadHistory([]);
    toast.success('Download history cleared');
  };

  const handleDeleteHistoryItem = (id: any) => {
    setDownloadHistory((prev: any) => prev.filter((item: any) => item.id !== id));
    toast.success('Download record deleted');
  };

  const isValidRange = selectedDateFrom && selectedDateTo && new Date(selectedDateFrom) <= new Date(selectedDateTo);
  const canDownload = isValidRange && selectedMetrics.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
            <Download className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-medium text-white">Data Export & Download</h1>
            <p className="text-gray-400">Export historical meter data in various formats</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {downloadComplete && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 rounded-lg border border-green-500/30"
            >
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-medium">Download Complete!</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Database Status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <HardDrive className="w-6 h-6 text-cyan-400" />
            <h3 className="text-white text-xl font-semibold">Live Database Status</h3>
          </div>
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center space-x-2"
          >
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-green-400 text-sm font-medium">Real-time</span>
          </motion.div>
        </div>
        
        {isLoadingStats ? (
          <div className="flex items-center justify-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Database className="w-8 h-8 text-cyan-400" />
            </motion.div>
            <span className="ml-3 text-gray-400">Loading database statistics...</span>
          </div>
        ) : dbStats ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-300 text-xs font-medium mb-2">Total Records</p>
                <p className="text-white text-2xl font-bold">{dbStats.total_readings?.toLocaleString() || 0}</p>
                <p className="text-blue-400 text-xs mt-1">Data points stored</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-lg p-4">
                <p className="text-purple-300 text-xs font-medium mb-2">Time Span</p>
                <p className="text-white text-2xl font-bold">{dbStats.time_span_days || 0}</p>
                <p className="text-purple-400 text-xs mt-1">Days of data</p>
              </div>
              
              <div className="bg-gradient-to-br from-cyan-600/20 to-cyan-800/20 border border-cyan-500/30 rounded-lg p-4">
                <p className="text-cyan-300 text-xs font-medium mb-2">Database Size</p>
                <p className="text-white text-2xl font-bold">{dbStats.database_size_mb || 0}</p>
                <p className="text-cyan-400 text-xs mt-1">MB on disk</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-300 text-xs font-medium mb-2">Earliest Record</p>
                <p className="text-white text-sm font-semibold">
                  {dbStats.earliest_date ? new Date(dbStats.earliest_date).toLocaleDateString() : 'N/A'}
                </p>
                <p className="text-green-400 text-xs mt-1">
                  {dbStats.earliest_date ? new Date(dbStats.earliest_date).toLocaleTimeString() : ''}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 border border-orange-500/30 rounded-lg p-4">
                <p className="text-orange-300 text-xs font-medium mb-2">Latest Record</p>
                <p className="text-white text-sm font-semibold">
                  {dbStats.latest_date ? new Date(dbStats.latest_date).toLocaleDateString() : 'N/A'}
                </p>
                <p className="text-orange-400 text-xs mt-1">
                  {dbStats.latest_date ? new Date(dbStats.latest_date).toLocaleTimeString() : ''}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-pink-600/20 to-pink-800/20 border border-pink-500/30 rounded-lg p-4">
                <p className="text-pink-300 text-xs font-medium mb-2">Last Updated</p>
                <p className="text-white text-sm font-semibold">
                  {dbStats.last_updated ? new Date(dbStats.last_updated).toLocaleDateString() : 'N/A'}
                </p>
                <p className="text-pink-400 text-xs mt-1">
                  {dbStats.last_updated ? new Date(dbStats.last_updated).toLocaleTimeString() : ''}
                </p>
              </div>
            </div>

            {/* Metrics Availability */}
            {dbStats.metrics_availability && (
              <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
                <p className="text-gray-300 text-sm font-medium mb-3">Data Metrics Availability</p>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  <div className="text-center">
                    <p className="text-blue-400 text-lg font-bold">{dbStats.metrics_availability.voltage?.toLocaleString() || 0}</p>
                    <p className="text-gray-400 text-xs">Voltage</p>
                  </div>
                  <div className="text-center">
                    <p className="text-green-400 text-lg font-bold">{dbStats.metrics_availability.current?.toLocaleString() || 0}</p>
                    <p className="text-gray-400 text-xs">Current</p>
                  </div>
                  <div className="text-center">
                    <p className="text-purple-400 text-lg font-bold">{dbStats.metrics_availability.power?.toLocaleString() || 0}</p>
                    <p className="text-gray-400 text-xs">Power</p>
                  </div>
                  <div className="text-center">
                    <p className="text-yellow-400 text-lg font-bold">{dbStats.metrics_availability.energy?.toLocaleString() || 0}</p>
                    <p className="text-gray-400 text-xs">Energy</p>
                  </div>
                  <div className="text-center">
                    <p className="text-orange-400 text-lg font-bold">{dbStats.metrics_availability.power_factor?.toLocaleString() || 0}</p>
                    <p className="text-gray-400 text-xs">PF</p>
                  </div>
                  <div className="text-center">
                    <p className="text-cyan-400 text-lg font-bold">{dbStats.metrics_availability.frequency?.toLocaleString() || 0}</p>
                    <p className="text-gray-400 text-xs">Frequency</p>
                  </div>
                </div>
              </div>
            )}

            {/* Storage Info */}
            <div className="mt-4 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-300 text-sm">Statistics refresh every 30 seconds automatically</span>
                </div>
                <span className="text-blue-400 text-xs font-mono">
                  Updated: {dbStats.last_updated ? new Date(dbStats.last_updated).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Database className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No database statistics available</p>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Download Configuration */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Date Range Selection */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-blue-400" />
                <h3 className="text-white text-lg font-medium">Date Range Selection</h3>
              </div>
              {!isValidRange && selectedDateFrom && selectedDateTo && (
                <div className="flex items-center space-x-2 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Invalid date range</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">From Date</label>
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type="date"
                  value={selectedDateFrom}
                  onChange={(e) => setSelectedDateFrom(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">To Date</label>
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type="date"
                  value={selectedDateTo}
                  onChange={(e) => setSelectedDateTo(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                />
              </div>
            </div>

            {/* Preset Ranges */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {presetRanges.map((range, index) => (
                <motion.button
                  key={range.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePresetRange(range)}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-all duration-200"
                >
                  {range.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Metrics Selection */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Filter className="w-5 h-5 text-green-400" />
                <h3 className="text-white text-lg font-medium">Select Metrics</h3>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSelectAllMetrics}
                className="px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-400 text-sm rounded-lg hover:bg-green-500/30 transition-all"
              >
                {selectedMetrics.length === metrics.length ? 'Deselect All' : 'Select All'}
              </motion.button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {metrics.map((metric, index) => (
                <motion.label
                  key={metric.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ scale: 1.02 }}
                  className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedMetrics.includes(metric.key) 
                      ? 'bg-slate-600 border border-green-500/30' 
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedMetrics.includes(metric.key)}
                    onChange={() => handleMetricToggle(metric.key)}
                    className="w-4 h-4 text-blue-600 bg-slate-600 border-slate-500 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <div className={`w-3 h-3 bg-gradient-to-r ${metric.color} rounded-full`} />
                  <span className="text-white text-sm font-medium flex-1">{metric.label}</span>
                  <span className="text-gray-400 text-xs">{metric.unit}</span>
                </motion.label>
              ))}
            </div>
          </div>

          {/* Advanced Options */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center space-x-3 mb-6">
              <Database className="w-5 h-5 text-purple-400" />
              <h3 className="text-white text-lg font-medium">Advanced Options</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Sampling Rate</label>
                <motion.select
                  whileFocus={{ scale: 1.02 }}
                  value={samplingRate}
                  onChange={(e) => setSamplingRate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                >
                  {samplingRateOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </motion.select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                  <span className="text-white text-sm">Enable Compression</span>
                  <div className="flex items-center space-x-2">
                    {!compressionSupported && (
                      <span className="text-xs text-gray-400">Unsupported</span>
                    )}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={compressionEnabled && compressionSupported}
                        disabled={!compressionSupported}
                        onChange={(e) => setCompressionEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 ${!compressionSupported ? 'bg-gray-500' : 'bg-gray-600'} peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${compressionSupported ? 'peer-checked:bg-purple-500' : ''}`}></div>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                  <span className="text-white text-sm">Include Metadata</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeMetadata}
                      onChange={(e) => setIncludeMetadata(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Export Format Selection */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center space-x-3 mb-6">
              <FileText className="w-5 h-5 text-orange-400" />
              <h3 className="text-white text-lg font-medium">Export Format</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formats.map((format) => {
                const Icon = format.icon;
                return (
                  <motion.button
                    key={format.key}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedFormat(format.key);
                      toast.success(`Export format changed to ${format.label}`);
                    }}
                    className={`p-6 rounded-lg border-2 transition-all duration-200 ${
                      selectedFormat === format.key
                        ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/20'
                        : 'border-slate-600 bg-slate-700 hover:border-slate-500 hover:bg-slate-600'
                    }`}
                  >
                    <Icon className={`w-10 h-10 mx-auto mb-3 ${
                      selectedFormat === format.key ? 'text-purple-400' : 'text-gray-400'
                    }`} />
                    <h4 className={`font-medium mb-2 ${
                      selectedFormat === format.key ? 'text-white' : 'text-gray-300'
                    }`}>
                      {format.label}
                    </h4>
                    <p className="text-xs text-gray-400 leading-relaxed">{format.description}</p>
                    <div className="mt-2 text-xs text-purple-400">
                      {format.extension}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Sidebar with Summary and Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          {/* Export Summary */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center space-x-3 mb-6">
              <Save className="w-5 h-5 text-yellow-400" />
              <h3 className="text-white text-lg font-medium">Export Summary</h3>
            </div>
            
            {dbStats && dbStats.total_readings === 0 ? (
              <div className="flex items-center space-x-2 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <div>
                  <p className="text-yellow-400 font-medium text-sm">No Data Available</p>
                  <p className="text-gray-400 text-xs mt-1">The database is currently empty. Please add data to enable exports.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Format:</span>
                  <span className="text-white">{formats.find(f => f.key === selectedFormat)?.label}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Metrics:</span>
                  <span className="text-white">{selectedMetrics.length} selected</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Date Range:</span>
                  <span className="text-white text-xs">
                    {selectedDateFrom && selectedDateTo ? (() => {
                      const days = Math.ceil((new Date(selectedDateTo).getTime() - new Date(selectedDateFrom).getTime()) / (1000 * 60 * 60 * 24));
                      return days === 0 ? '1 day' : `${days} day${days > 1 ? 's' : ''}`;
                    })() : 'Not set'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Est. Size:</span>
                  <span className="text-white text-sm">
                    {dbStats && dbStats.total_readings > 0 ? (
                      <>
                        {calculateFileSize()} MB
                        {compressionEnabled && compressionSupported && <span className="text-green-400 ml-1">(compressed)</span>}
                        {!compressionEnabled && parseFloat(calculateFileSize()) > 10 && (
                          <span className="text-yellow-400 ml-1">(large file)</span>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-500">0 MB</span>
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Data Points:</span>
                  <span className="text-white text-sm">
                    {previewData && previewData.length > 0 ? (
                      <span className="text-green-400">{previewData.length.toLocaleString()} <span className="text-gray-500 text-xs">(actual)</span></span>
                    ) : dbStats && dbStats.total_readings > 0 ? (
                      <span className="text-gray-400">{dbStats.total_readings.toLocaleString()} <span className="text-gray-500 text-xs">(in DB)</span></span>
                    ) : (
                      <span className="text-gray-500">0</span>
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePreviewData}
              disabled={!canDownload || isGeneratingPreview}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                canDownload && !isGeneratingPreview
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isGeneratingPreview ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  <span>Generating Preview...</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span>Preview Data</span>
                </>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDownload}
              disabled={!canDownload || isDownloading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                canDownload && !isDownloading
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isDownloading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Data</span>
                </>
              )}
            </motion.button>
          </div>

          {/* Download Progress */}
          <AnimatePresence>
            {isDownloading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full"
                  />
                  <span className="text-white font-medium">Processing...</span>
                </div>
                
                <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: `${downloadProgress}%` }}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full"
                  />
                </div>
                
                <p className="text-gray-400 text-sm">
                  Generating {selectedFormat.toUpperCase()} file with {selectedMetrics.length} metric{selectedMetrics.length !== 1 ? 's' : ''}
                  {selectedDateFrom && selectedDateTo && (
                    <span> • {(() => {
                      const startDate = new Date(selectedDateFrom);
                      const endDate = new Date(selectedDateTo);
                      const timeDiff = endDate.getTime() - startDate.getTime();
                      const hours = Math.ceil(timeDiff / (1000 * 60 * 60));
                      const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                      
                      if (hours < 24) {
                        return `${hours} hour${hours !== 1 ? 's' : ''} of data`;
                      } else {
                        return `${days} day${days !== 1 ? 's' : ''} of data`;
                      }
                    })()}</span>
                  )}
                  {' • '}
                  {(() => {
                    const startDate = new Date(selectedDateFrom);
                    const endDate = new Date(selectedDateTo);
                    const timeDiff = endDate.getTime() - startDate.getTime();
                    const hours = timeDiff / (1000 * 60 * 60);
                    
                    let pointCount;
                    switch (samplingRate) {
                      case '1min': pointCount = Math.floor(hours * 60); break;
                      case '5min': pointCount = Math.floor(hours * 12); break;
                      case '15min': pointCount = Math.floor(hours * 4); break;
                      case '1hour': pointCount = Math.floor(hours); break;
                      case '1day': pointCount = Math.floor(timeDiff / (1000 * 60 * 60 * 24)); break;
                      default: pointCount = Math.floor(hours * 3600);
                    }
                    return `${Math.max(1, pointCount).toLocaleString()} data points`;
                  })()}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Download History */}
          {downloadHistory.length > 0 && (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium">Recent Downloads</h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClearHistory}
                  className="text-gray-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {downloadHistory.slice(0, 5).map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-slate-700 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{item.fileName}</p>
                      <p className="text-gray-400 text-xs">
                        {new Date(item.downloadedAt).toLocaleDateString()} • {item.size} MB • {item.sampling || 'all'}
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDeleteHistoryItem(item.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors ml-2"
                    >
                      <X className="w-3 h-3" />
                    </motion.button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Data Preview Modal */}
      <AnimatePresence>
        {showPreview && previewData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-slate-800 rounded-xl p-6 max-w-6xl w-full max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white text-lg font-medium">Complete Data Preview</h3>
                  <p className="text-gray-400 text-sm">
                    Showing all {previewData.length.toLocaleString()} data points with {selectedMetrics.length} metric{selectedMetrics.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-white transition-colors text-xl p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-800 border-b border-slate-700">
                    <tr>
                      <th className="text-left p-3 text-gray-400 font-medium">Timestamp</th>
                      {selectedMetrics.map(metric => {
                        const metricInfo = metrics.find(m => m.key === metric);
                        return (
                          <th key={metric} className="text-left p-3 text-gray-400 font-medium">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 bg-gradient-to-r ${metricInfo?.color || 'from-gray-500 to-gray-600'} rounded-full`} />
                              <span>{metricInfo?.label || metric}</span>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, index) => (
                      <tr key={index} className={`border-b border-slate-700/30 ${index % 2 === 0 ? 'bg-slate-800/50' : 'bg-slate-700/30'} hover:bg-slate-600/30 transition-colors`}>
                        <td className="p-3 text-white font-mono text-xs">
                          {previewTimestampLabel(row)}
                        </td>
                        {selectedMetrics.map(metric => {
                          const metricInfo = metrics.find(m => m.key === metric);
                          let value = row[metric];
                          
                          // Convert kilo units to base units
                          if (metricInfo?.convertFromKilo && typeof value === 'number') {
                            value = value * 1000;
                          }
                          
                          const formatted = typeof value === 'number'
                            ? value.toFixed(metric === 'power_factor' ? 4 : 2)
                            : value ?? '--';
                          return (
                            <td key={metric} className="p-3 text-white">
                              <span className="font-mono">
                                {formatted}
                              </span>
                              {metricInfo?.unit && (
                                <span className="text-gray-400 ml-1 text-xs">{metricInfo.unit}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
                <div className="text-sm text-gray-400">
                  Date Range: {selectedDateFrom} to {selectedDateTo} • 
                  Sampling: {samplingRateOptions.find(o => o.value === samplingRate)?.label}
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}