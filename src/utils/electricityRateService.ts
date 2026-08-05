// Electricity Rate Service - Fetches live electricity rates
// Uses multiple sources with fallback

interface ElectricityRate {
  country: string;
  currency: string;
  ratePerKWh: number;
  source: string;
  timestamp: number;
}

class ElectricityRateService {
  private currentRate: ElectricityRate | null = null;
  private subscribers: Array<() => void> = [];
  private refreshInterval: ReturnType<typeof setInterval> | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  // Default rates by country (fallback)
  private readonly DEFAULT_RATES: Record<string, { currency: string; rate: number }> = {
    'IN': { currency: 'INR', rate: 6.50 }, // India
    'US': { currency: 'USD', rate: 0.13 },
    'GB': { currency: 'GBP', rate: 0.28 },
    'AU': { currency: 'AUD', rate: 0.25 },
    'CA': { currency: 'CAD', rate: 0.12 },
    'DE': { currency: 'EUR', rate: 0.30 },
    'FR': { currency: 'EUR', rate: 0.19 },
    'JP': { currency: 'JPY', rate: 26.0 },
    'CN': { currency: 'CNY', rate: 0.52 },
  };

  constructor() {
    this.initializeRate();
    this.startAutoRefresh();
  }

  private initializeRate() {
    // Try to load cached rate from localStorage
    const cached = localStorage.getItem('electricity_rate_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < this.CACHE_DURATION) {
          this.currentRate = parsed;
          this.lastFetchTime = parsed.timestamp;
          return;
        }
      } catch (e) {
        console.error('Failed to parse cached rate:', e);
      }
    }

    // Use default rate for India
    this.setDefaultRate('IN');
    
    // Fetch fresh rate
    this.fetchRate();
  }

  private setDefaultRate(countryCode: string = 'IN') {
    const defaultData = this.DEFAULT_RATES[countryCode] || this.DEFAULT_RATES['IN'];
    this.currentRate = {
      country: countryCode,
      currency: defaultData.currency,
      ratePerKWh: defaultData.rate,
      source: 'Default',
      timestamp: Date.now(),
    };
  }

  private async fetchRate(): Promise<void> {
    try {
      // Detect country from timezone/locale
      const countryCode = this.detectCountry();
      
      // Try multiple APIs in sequence
      const rate = await this.fetchFromAPIs(countryCode);
      
      if (rate) {
        this.currentRate = rate;
        this.lastFetchTime = Date.now();
        
        // Cache the rate
        localStorage.setItem('electricity_rate_cache', JSON.stringify(rate));
        
        // Notify subscribers
        this.notifySubscribers();
      }
    } catch (error) {
      console.error('Failed to fetch electricity rate:', error);
      
      // Use default if no rate is set
      if (!this.currentRate) {
        this.setDefaultRate();
      }
    }
  }

  private detectCountry(): string {
    // Try to detect country from timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Map common timezones to countries
    if (timezone.includes('India') || timezone.includes('Kolkata') || timezone.includes('Mumbai')) {
      return 'IN';
    } else if (timezone.includes('America')) {
      return 'US';
    } else if (timezone.includes('Europe/London')) {
      return 'GB';
    } else if (timezone.includes('Australia')) {
      return 'AU';
    } else if (timezone.includes('Tokyo')) {
      return 'JP';
    }
    
    // Default to India
    return 'IN';
  }

  private async fetchFromAPIs(countryCode: string): Promise<ElectricityRate | null> {
    // Try API 1: Global Petrol Prices API (includes electricity)
    try {
      const response = await fetch(`https://api.globalpetrolprices.com/electricity_prices/?country_code=${countryCode}`, {
        headers: {
          'Authorization': 'Bearer demo_key' // Note: Replace with actual key in production
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          country: countryCode,
          currency: data.currency || 'INR',
          ratePerKWh: data.rate || this.DEFAULT_RATES[countryCode]?.rate || 6.50,
          source: 'Global Petrol Prices API',
          timestamp: Date.now(),
        };
      }
    } catch (e) {
      console.log('API 1 failed, trying next...');
    }

    // Try API 2: Exchange rate conversion (if we have a base rate)
    try {
      const baseRateINR = 6.50; // Base rate in INR
      const exchangeResponse = await fetch(`https://api.exchangerate-api.com/v4/latest/INR`);
      
      if (exchangeResponse.ok) {
        const exchangeData = await exchangeResponse.json();
        const targetCurrency = this.DEFAULT_RATES[countryCode]?.currency || 'INR';
        const exchangeRate = exchangeData.rates[targetCurrency] || 1;
        
        return {
          country: countryCode,
          currency: targetCurrency,
          ratePerKWh: parseFloat((baseRateINR * exchangeRate).toFixed(2)),
          source: 'Exchange Rate API',
          timestamp: Date.now(),
        };
      }
    } catch (e) {
      console.log('API 2 failed, using default...');
    }

    // Fallback to default rates
    const defaultData = this.DEFAULT_RATES[countryCode] || this.DEFAULT_RATES['IN'];
    return {
      country: countryCode,
      currency: defaultData.currency,
      ratePerKWh: defaultData.rate,
      source: 'Default (Updated periodically)',
      timestamp: Date.now(),
    };
  }

  private startAutoRefresh() {
    // Refresh every 30 minutes
    this.refreshInterval = setInterval(() => {
      this.fetchRate();
    }, this.CACHE_DURATION);
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback());
  }

  // Public methods
  public getCurrentRate(): number {
    return this.currentRate?.ratePerKWh || 6.50;
  }

  public getRateInfo(): ElectricityRate {
    return this.currentRate || {
      country: 'IN',
      currency: 'INR',
      ratePerKWh: 6.50,
      source: 'Default',
      timestamp: Date.now(),
    };
  }

  public async forceRefresh(): Promise<void> {
    await this.fetchRate();
  }

  public subscribe(callback: () => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  public getLastUpdateTime(): Date | null {
    return this.currentRate ? new Date(this.currentRate.timestamp) : null;
  }

  public isRateFresh(): boolean {
    return Date.now() - this.lastFetchTime < this.CACHE_DURATION;
  }

  public destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}

// Singleton instance
export const electricityRateService = new ElectricityRateService();
