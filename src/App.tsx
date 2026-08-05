import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import LoginPage from './components/LoginPage';
import LoadingScreen from './components/LoadingScreen';
import Dashboard from './components/Dashboard';
import { SettingsProvider } from './components/SettingsContext';
import { fetchCurrentUser, login as apiLogin, register as apiRegister, setAccessToken } from './utils/apiClient';

type ViewState = 'checking' | 'login' | 'loading' | 'dashboard';

export default function App() {
  const [view, setView] = useState<ViewState>('checking');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const result = await fetchCurrentUser();
        setUser(result.user);
        setView('dashboard');
      } catch {
        setUser(null);
        setAccessToken(null);
        setView('login');
      }
    };
    hydrate();
  }, []);

  const handleLogin = async ({ email, password }: { email: string; password: string }) => {
    setView('loading');
    try {
      const result = await apiLogin(email, password);
      setUser(result.user);
      setView('dashboard');
      
      // Show alert to update location manually from Settings
      setTimeout(() => {
        toast.info('Please update your location by clicking on Use Current Location (GPS) from the Settings.', {
          duration: 6000,
          position: 'top-center',
        });
      }, 1500);
    } catch (err: any) {
      setView('login');
      toast.error(err?.message || 'Authentication failed');
    }
  };

  const handleRegister = async ({ email, password, name }: { email: string; password: string; name: string }) => {
    setView('loading');
    try {
      const result = await apiRegister(email, password, name);
      setUser(result.user);
      toast.success('Account created successfully!');
      setView('dashboard');
      
      // Show alert to update location manually from Settings
      setTimeout(() => {
        toast.info('Please update your location by clicking on Use Current Location (GPS) from the Settings.', {
          duration: 6000,
          position: 'top-center',
        });
      }, 1500);
    } catch (err: any) {
      setView('login');
      toast.error(err?.message || 'Authentication failed');
    }
  };

  // Location permission request removed - users can manually update location from Settings page

  const handleLogout = () => {
    setAccessToken(null);
    setUser(null);
    setView('login');
  };

  const initialSettings = React.useMemo(() => {
    console.log('App.tsx: Creating initialSettings from user:', user);
    return user
      ? {
          language: user.language,
          timezone: user.timezone,
          currency: user.currency,
          location: user.location,
        }
      : undefined;
  }, [user?.language, user?.timezone, user?.currency, user?.location]);

  return (
    <SettingsProvider key={`${user?.timezone}-${user?.location}`} initialSettings={initialSettings}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-800" style={{ fontFamily: 'Arial, sans-serif' }}>
        <Toaster
          position="top-right"
          theme="dark"
          richColors
          expand={false}
          duration={3000}
        />
        <AnimatePresence mode="wait">
          {(view === 'checking' || view === 'loading') && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <LoadingScreen />
            </motion.div>
          )}

          {view === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <LoginPage onLogin={handleLogin} onRegister={handleRegister} />
            </motion.div>
          )}

          {view === 'dashboard' && user && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6 }}
            >
              <Dashboard user={user} onLogout={handleLogout} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SettingsProvider>
  );
}
