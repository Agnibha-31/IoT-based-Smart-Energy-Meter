import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  Home, 
  Zap, 
  Activity, 
  Power, 
  Battery, 
  BarChart3, 
  Download, 
  Settings, 
  DollarSign, 
  LogOut,
  User
} from 'lucide-react';
import { useSettings } from './SettingsContext';
import { toast } from 'sonner';

const menuItems = [
  { id: 'home', labelKey: 'overview', icon: Home },
  { id: 'voltage', labelKey: 'voltage', icon: Zap },
  { id: 'current', labelKey: 'current', icon: Activity },
  { id: 'power', labelKey: 'power', icon: Power },
  { id: 'energy', labelKey: 'energy', icon: Battery },
  { id: 'analytics', labelKey: 'analytics', icon: BarChart3 },
  { id: 'data-download', labelKey: 'data_download', icon: Download },
  { id: 'cost', labelKey: 'cost_calculation', icon: DollarSign },
  { id: 'settings', labelKey: 'settings', icon: Settings },
];

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  user: any;
  onLogout: () => void;
}

export default function Sidebar({ currentPage, onPageChange, collapsed, onToggleCollapse, user, onLogout }: SidebarProps) {
  const { translate } = useSettings();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    toast.success(translate('signout_success'));
    setTimeout(() => {
      onLogout();
    }, 1000);
    setShowLogoutConfirm(false);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };
  return (
    <motion.div
      initial={{ x: -100 }}
      animate={{ 
        x: 0,
        width: collapsed ? 64 : 256
      }}
      transition={{ 
        x: { type: "spring", stiffness: 300, damping: 30 },
        width: { type: "spring", stiffness: 300, damping: 30, mass: 0.8 }
      }}
      className="fixed left-0 top-0 h-full bg-gradient-to-b from-slate-800 to-slate-900 border-r border-slate-700 z-50"
    >
      {/* Header */}
      <div className={`${collapsed ? 'flex items-center justify-center p-4' : 'flex items-center justify-between p-4'} border-b border-slate-700`}>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-medium text-lg">Smart IoT Meter</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onToggleCollapse}
          className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
        >
          <Menu className={`${collapsed ? 'w-7 h-7' : 'w-4 h-4'}`} />
        </motion.button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} ${collapsed ? 'py-2.5 px-1' : 'p-3'} rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon className={`${collapsed ? 'w-6 h-6' : 'w-5 h-5'} ${isActive ? 'text-white' : 'text-gray-400'} transition-all duration-200`} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="font-medium"
                  >
                    {translate(item.labelKey)}
                  </motion.span>
                )}
              </AnimatePresence>
              
              {/* Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 w-1 h-8 bg-white rounded-r-full"
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-2 border-t border-slate-700 space-y-1.5">
        {/* User Profile - Clickable to access Device Config */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onPageChange('device-config')}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors cursor-pointer`}
        >
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="flex-1 min-w-0"
              >
                <p className="text-white font-medium truncate">{user?.username || user?.email || user?.name || 'User'}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Show user icon when collapsed */}
        {collapsed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="flex items-center justify-center py-1.5"
          >
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
          </motion.div>
        )}
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogoutClick}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} ${collapsed ? 'py-2 px-1' : 'p-2'} rounded-lg text-red-400 hover:bg-red-500/20 transition-all duration-200`}
        >
          <LogOut className={`${collapsed ? 'w-5 h-5' : 'w-4 h-4'} transition-all duration-200`} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="font-medium text-sm"
              >
                {translate('sign_out')}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Logout Confirmation Dialog */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-sm mx-4 shadow-xl"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {translate('confirm')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {translate('signout_confirm')}
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={confirmLogout}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors text-center"
                >
                  {translate('yes')}
                </button>
                <button
                  onClick={cancelLogout}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-slate-600 dark:hover:bg-slate-500 text-gray-800 dark:text-white px-4 py-2 rounded-lg transition-colors text-center"
                >
                  {translate('cancel')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}