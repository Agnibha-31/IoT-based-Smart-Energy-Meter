import { toast } from 'sonner';

export interface NotificationSettings {
  email: boolean;
  alerts: boolean;
  reports: boolean;
  maintenance: boolean;
  powerOutage: boolean;
  lowVoltage: boolean;
  highUsage: boolean;
  weeklyReport: boolean;
}

export class NotificationService {
  private settings: NotificationSettings;
  private lastChecks: Map<string, number> = new Map();

  constructor(settings: NotificationSettings) {
    this.settings = settings;
  }

  updateSettings(settings: NotificationSettings) {
    this.settings = settings;
    console.log('Notification settings updated:', settings);
  }

  // Check voltage levels and notify if enabled
  checkVoltage(voltage: number) {
    if (!this.settings.lowVoltage) return;
    
    const LOW_VOLTAGE_THRESHOLD = 200; // volts
    const lastCheck = this.lastChecks.get('lowVoltage') || 0;
    const now = Date.now();
    
    // Only check every 30 seconds to avoid spam
    if (now - lastCheck < 30000) return;
    
    if (voltage < LOW_VOLTAGE_THRESHOLD && voltage > 0) {
      this.lastChecks.set('lowVoltage', now);
      toast.warning(`⚠️ Low Voltage Warning: ${voltage.toFixed(1)}V`, {
        description: 'Voltage is below safe operating levels',
        duration: 5000,
      });
    }
  }

  // Check power outage and notify if enabled
  checkPowerOutage(voltage: number, current: number) {
    if (!this.settings.powerOutage) return;
    
    const lastCheck = this.lastChecks.get('powerOutage') || 0;
    const now = Date.now();
    
    // Only check every 10 seconds
    if (now - lastCheck < 10000) return;
    
    if (voltage === 0 && current === 0) {
      this.lastChecks.set('powerOutage', now);
      toast.error('🔌 Power Outage Detected!', {
        description: 'No voltage or current detected on the system',
        duration: 10000,
      });
    }
  }

  // Check high usage and notify if enabled
  checkHighUsage(power: number) {
    if (!this.settings.highUsage) return;
    
    const HIGH_USAGE_THRESHOLD = 5000; // watts (5kW)
    const lastCheck = this.lastChecks.get('highUsage') || 0;
    const now = Date.now();
    
    // Only check every 60 seconds
    if (now - lastCheck < 60000) return;
    
    if (power > HIGH_USAGE_THRESHOLD) {
      this.lastChecks.set('highUsage', now);
      toast.warning(`⚡ High Power Usage Alert: ${(power / 1000).toFixed(2)}kW`, {
        description: 'Power consumption is above normal levels',
        duration: 5000,
      });
    }
  }

  // System alert notification
  sendSystemAlert(message: string, description?: string) {
    if (!this.settings.alerts) return;
    
    toast.info(`🔔 ${message}`, {
      description: description,
      duration: 4000,
    });
  }

  // Maintenance notice
  sendMaintenanceNotice(message: string, description?: string) {
    if (!this.settings.maintenance) return;
    
    toast.info(`🔧 Maintenance: ${message}`, {
      description: description,
      duration: 6000,
    });
  }

  // Email notification (would trigger actual email in production)
  sendEmailNotification(subject: string, body: string) {
    if (!this.settings.email) return;
    
    console.log('[Email Notification]', { subject, body });
    toast.success('📧 Email notification sent', {
      description: subject,
      duration: 3000,
    });
  }

  // Weekly report notification
  sendWeeklyReport() {
    if (!this.settings.weeklyReport) return;
    
    toast.info('📊 Weekly Report Ready', {
      description: 'Your energy consumption report is available',
      duration: 5000,
    });
  }

  // Check if it's time for weekly report (every Sunday at 9 AM)
  checkWeeklyReport() {
    if (!this.settings.weeklyReport) return;
    
    const now = new Date();
    const lastReport = this.lastChecks.get('weeklyReport') || 0;
    
    // Only send once per week
    if (Date.now() - lastReport < 7 * 24 * 60 * 60 * 1000) return;
    
    if (now.getDay() === 0 && now.getHours() === 9) {
      this.lastChecks.set('weeklyReport', Date.now());
      this.sendWeeklyReport();
    }
  }
}

// Global notification service instance
let notificationService: NotificationService | null = null;

export function initializeNotificationService(settings: NotificationSettings) {
  notificationService = new NotificationService(settings);
  return notificationService;
}

export function getNotificationService(): NotificationService | null {
  return notificationService;
}

export function updateNotificationSettings(settings: NotificationSettings) {
  if (notificationService) {
    notificationService.updateSettings(settings);
  }
}
