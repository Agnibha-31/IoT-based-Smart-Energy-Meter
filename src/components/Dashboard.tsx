import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import HomePage from './pages/HomePage';
import VoltagePage from './pages/VoltagePage';
import CurrentPage from './pages/CurrentPage';
import PowerPage from './pages/PowerPage';
import EnergyPage from './pages/EnergyPage';
import AnalyticsPage from './pages/AnalyticsPage';
import DataDownloadPage from './pages/DataDownloadPage';
import SettingsPage from './pages/SettingsPage';
import CostPage from './pages/CostPage';
import DeviceConfigPage from './pages/DeviceConfigPage';
import { initializeNotificationService, getNotificationService } from '../utils/notificationService';

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [currentPage, setCurrentPage] = useState('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [wakeUpTime, setWakeUpTime] = useState(0);
  const [liveData, setLiveData] = useState({
    vrms: 0,
    irms: 0,
    power: 0,
    energy: 0,
    real_power_kw: 0,
    apparent_power_kva: 0,
    power_factor: 0,
    reactive_power_kvar: 0,
    instant_cost: 0,
    carbon_footprint: 0,
    timestamp: null,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setWakeUpTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Initialize notification service with saved settings
  useEffect(() => {
    const savedNotifications = localStorage.getItem('smartmeter_notifications');
    if (savedNotifications) {
      try {
        const settings = JSON.parse(savedNotifications);
        initializeNotificationService(settings);
      } catch (e) {
        console.error('Failed to initialize notification service:', e);
      }
    }
  }, []);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3000', {
      transports: ['websocket'],
    });

    socket.on('live_data_update', payload => {
      setLiveData(prev => ({
        ...prev,
        ...payload,
      }));

      // Check notification conditions with the new data
      const notifService = getNotificationService();
      if (notifService && payload) {
        if (payload.vrms !== undefined) {
          notifService.checkVoltage(payload.vrms);
          notifService.checkPowerOutage(payload.vrms, payload.irms || 0);
        }
        if (payload.power !== undefined) {
          notifService.checkHighUsage(payload.power);
        }
      }
    });

    return () => {
      socket.off('live_data_update');
      socket.disconnect();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage />;
      case 'voltage': return <VoltagePage />;
      case 'current': return <CurrentPage />;
      case 'power': return <PowerPage />;
      case 'energy': return <EnergyPage />;
      case 'analytics': return <AnalyticsPage />;
      case 'data-download': return <DataDownloadPage />;
      case 'settings': return <SettingsPage onLogout={onLogout} />;
      case 'cost': return <CostPage liveData={liveData} />;
      case 'device-config': return <DeviceConfigPage />;
      default: return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 flex">
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={user}
        onLogout={onLogout}
      />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Header wakeUpTime={wakeUpTime} />
        
        <main className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}