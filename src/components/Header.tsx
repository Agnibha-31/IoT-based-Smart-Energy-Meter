import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, Thermometer, Cloud, Sun, CloudRain } from 'lucide-react';
import { useSettings } from './SettingsContext';

interface HeaderProps {
  wakeUpTime: number;
}

export default function Header({ wakeUpTime }: HeaderProps) {
  const { getCurrentTime, getLocationName, getWeatherData, translate, timezone, location: settingsLocation } = useSettings();
  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  const [location, setLocation] = useState(getLocationName());
  const [weather, setWeather] = useState(getWeatherData());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 1000);

    return () => clearInterval(timer);
  }, [getCurrentTime]);

  // Update location and weather when settings change
  useEffect(() => {
    setLocation(getLocationName());
    setWeather(getWeatherData());
  }, [settingsLocation, timezone, getLocationName, getWeatherData]);

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'Sunny': return Sun;
      case 'Cloudy': return Cloud;
      case 'Rainy': return CloudRain;
      case 'Partly Cloudy': return Cloud;
      default: return Cloud;
    }
  };

  const WeatherIcon = getWeatherIcon(weather.condition);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-slate-800/50 backdrop-blur-lg border-b border-slate-700 p-4"
    >
      <div className="flex justify-between items-center">
        {/* Wake-up Timer */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center space-x-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-4 py-2 rounded-lg border border-green-500/30"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Clock className="w-5 h-5 text-green-400" />
          </motion.div>
          <span className="text-green-400 font-medium">{translate('uptime')}: {(() => {
            const hours = Math.floor(wakeUpTime / 3600);
            const minutes = Math.floor((wakeUpTime % 3600) / 60);
            const seconds = wakeUpTime % 60;
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          })()}</span>
        </motion.div>

        {/* Date, Time, Location & Weather */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center space-x-6"
        >
          {/* Date & Time */}
          <div className="text-right">
            <motion.div
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-white font-medium text-lg"
            >
              {currentTime.toLocaleTimeString()}
            </motion.div>
            <div className="text-gray-400 text-sm">
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>

          <div className="w-px h-12 bg-slate-600" />

          {/* Location */}
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-blue-400" />
            <div>
              <div className="text-white font-medium text-sm">{location}</div>
              <div className="text-gray-400 text-xs">{translate('current_location')}</div>
            </div>
          </div>

          <div className="w-px h-12 bg-slate-600" />

          {/* Weather */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-2 bg-blue-500/20 px-3 py-2 rounded-lg border border-blue-500/30"
          >
            <WeatherIcon className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-white font-medium text-sm flex items-center space-x-1">
                <Thermometer className="w-3 h-3" />
                <span>{weather.temperature}°C</span>
              </div>
              <div className="text-gray-400 text-xs">{translate(weather.condition.toLowerCase().replace(' ', '_'))}</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.header>
  );
}