// Live Currency Service - Fetches real-time exchange rates from multiple APIs
export class LiveCurrencyService {
  private static instance: LiveCurrencyService;
  private exchangeRates: { [key: string]: number } = {};
  private lastUpdate: number = 0;
  private rateSource: string = '';
  private readonly CACHE_DURATION = 300000; // 5 minutes in milliseconds
  private readonly BASE_CURRENCY = 'INR'; // Indian Rupee as base
  private updateInterval: any = null;
  private listeners: Array<() => void> = [];
  
  private constructor() {
    // Initialize with fallback rates immediately
    this.exchangeRates = this.getFallbackRates();
    this.rateSource = 'Fallback Rates';
    this.lastUpdate = Date.now();
    
    // Start periodic updates
    this.startPeriodicUpdates();
    
    // Initial fetch of live rates
    this.fetchLiveRates();
  }
  
  public static getInstance(): LiveCurrencyService {
    if (!LiveCurrencyService.instance) {
      LiveCurrencyService.instance = new LiveCurrencyService();
    }
    return LiveCurrencyService.instance;
  }
  
  // Reliable fallback rates (updated December 2024)
  private getFallbackRates(): { [key: string]: number } {
    return {
      INR: 1.0000,
      USD: 0.011835,  // 1 INR = 0.011835 USD
      EUR: 0.011324,  // 1 INR = 0.011324 EUR
      GBP: 0.009441,  // 1 INR = 0.009441 GBP
      JPY: 1.8124,    // 1 INR = 1.8124 JPY
      CAD: 0.016850,  // 1 INR = 0.016850 CAD
      AUD: 0.018673,  // 1 INR = 0.018673 AUD
      CHF: 0.010652,  // 1 INR = 0.010652 CHF
      CNY: 0.086135,  // 1 INR = 0.086135 CNY
      BRL: 0.072458,  // 1 INR = 0.072458 BRL
      MXN: 0.240550,  // 1 INR = 0.240550 MXN
      KRW: 16.9850,   // 1 INR = 16.9850 KRW
      THB: 0.411230,  // 1 INR = 0.411230 THB
      SGD: 0.016085,  // 1 INR = 0.016085 SGD
      AED: 0.043485,  // 1 INR = 0.043485 AED
      SAR: 0.044440,  // 1 INR = 0.044440 SAR
      ZAR: 0.216890,  // 1 INR = 0.216890 ZAR
      RUB: 1.194400,  // 1 INR = 1.194400 RUB
      TRY: 0.416420,  // 1 INR = 0.416420 TRY
      PLN: 0.048235,  // 1 INR = 0.048235 PLN
      CZK: 0.285640,  // 1 INR = 0.285640 CZK
      HUF: 4.618500,  // 1 INR = 4.618500 HUF
      RON: 0.056285,  // 1 INR = 0.056285 RON
      BGN: 0.022145,  // 1 INR = 0.022145 BGN
      HRK: 0.085230,  // 1 INR = 0.085230 HRK
      UAH: 0.493850,  // 1 INR = 0.493850 UAH
      SEK: 0.131250,  // 1 INR = 0.131250 SEK
      NOK: 0.134680,  // 1 INR = 0.134680 NOK
      DKK: 0.084525,  // 1 INR = 0.084525 DKK
    };
  }
  
  // Subscribe to rate updates
  public subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }
  
  // Notify all listeners of rate updates
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error notifying currency rate listener:', error);
      }
    });
  }
  
  // Start periodic updates every 5 minutes
  private startPeriodicUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    this.updateInterval = setInterval(() => {
      this.fetchLiveRates();
    }, this.CACHE_DURATION);
  }
  
  // Stop periodic updates
  public stopPeriodicUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
  
  // Fetch from ExchangeRate-API (free and reliable)
  private async fetchFromExchangeRateAPI(): Promise<{ [key: string]: number }> {
    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${this.BASE_CURRENCY}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.rates && Object.keys(data.rates).length > 10) {
        console.log('✅ ExchangeRate-API rates fetched successfully');
        return data.rates;
      } else {
        throw new Error('Invalid response format from ExchangeRate-API');
      }
    } catch (error) {
      console.warn('ExchangeRate-API failed:', error);
      throw error;
    }
  }
  
  // Fetch from Fixer.io API (backup)
  private async fetchFromFixerAPI(): Promise<{ [key: string]: number }> {
    try {
      const response = await fetch(`https://api.fixer.io/latest?base=${this.BASE_CURRENCY}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.rates && Object.keys(data.rates).length > 10) {
        console.log('✅ Fixer.io rates fetched successfully');
        return { [this.BASE_CURRENCY]: 1, ...data.rates };
      } else {
        throw new Error('Invalid response format from Fixer.io');
      }
    } catch (error) {
      console.warn('Fixer.io failed:', error);
      throw error;
    }
  }
  
  // Fetch from Free Currency API (backup)
  private async fetchFromFreeCurrencyAPI(): Promise<{ [key: string]: number }> {
    try {
      const response = await fetch(`https://api.freecurrencyapi.com/v1/latest?apikey=fca_live_your_api_key&base_currency=${this.BASE_CURRENCY}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.data && Object.keys(data.data).length > 10) {
        console.log('✅ FreeCurrencyAPI rates fetched successfully');
        return { [this.BASE_CURRENCY]: 1, ...data.data };
      } else {
        throw new Error('Invalid response format from FreeCurrencyAPI');
      }
    } catch (error) {
      console.warn('FreeCurrencyAPI failed:', error);
      throw error;
    }
  }
  
  // Validate exchange rates
  private validateRates(rates: { [key: string]: number }): boolean {
    if (!rates || typeof rates !== 'object') {
      return false;
    }
    
    const rateCount = Object.keys(rates).length;
    if (rateCount < 10) {
      return false;
    }
    
    // Check if we have major currencies with reasonable values
    const majorCurrencies = ['USD', 'EUR', 'GBP', 'JPY'];
    let validMajorCurrencies = 0;
    
    for (const currency of majorCurrencies) {
      if (rates[currency] && typeof rates[currency] === 'number' && 
          rates[currency] > 0 && isFinite(rates[currency])) {
        validMajorCurrencies++;
      }
    }
    
    return validMajorCurrencies >= 3; // At least 3 major currencies
  }
  
  // Fetch live rates from multiple sources
  private async fetchLiveRates(): Promise<void> {
    const sources = [
      { name: 'ExchangeRate-API', fetch: () => this.fetchFromExchangeRateAPI() },
      { name: 'Fixer.io', fetch: () => this.fetchFromFixerAPI() },
      { name: 'FreeCurrencyAPI', fetch: () => this.fetchFromFreeCurrencyAPI() },
    ];
    
    for (const source of sources) {
      try {
        console.log(`🔄 Fetching rates from ${source.name}...`);
        const rates = await source.fetch();
        
        if (this.validateRates(rates)) {
          const previousRates = { ...this.exchangeRates };
          this.exchangeRates = rates;
          this.rateSource = source.name;
          this.lastUpdate = Date.now();
          
          console.log(`✅ Successfully updated rates from ${source.name}`);
          
          // Check if rates have changed significantly
          const hasSignificantChange = this.hasSignificantRateChange(previousRates, rates);
          if (hasSignificantChange) {
            console.log('📈 Significant rate changes detected, notifying listeners');
          }
          
          // Notify listeners of the update
          this.notifyListeners();
          return;
        } else {
          console.warn(`⚠️ Invalid rates from ${source.name}`);
        }
      } catch (error) {
        console.warn(`❌ Failed to fetch from ${source.name}:`, error);
        continue;
      }
    }
    
    console.warn('⚠️ All currency API sources failed, using existing rates');
  }
  
  // Check for significant rate changes (>2% change)
  private hasSignificantRateChange(oldRates: { [key: string]: number }, newRates: { [key: string]: number }): boolean {
    const majorCurrencies = ['USD', 'EUR', 'GBP', 'JPY'];
    
    for (const currency of majorCurrencies) {
      if (oldRates[currency] && newRates[currency]) {
        const change = Math.abs((newRates[currency] - oldRates[currency]) / oldRates[currency]);
        if (change > 0.02) { // 2% change threshold
          return true;
        }
      }
    }
    
    return false;
  }
  
  // Get exchange rates (always returns valid rates)
  public getExchangeRates(): { [key: string]: number } {
    return { ...this.exchangeRates };
  }
  
  // Convert amount from INR to target currency
  public convertFromINR(amountINR: number, targetCurrency: string): number {
    if (!amountINR || isNaN(amountINR) || !isFinite(amountINR)) {
      return 0;
    }
    
    if (targetCurrency === this.BASE_CURRENCY) {
      return amountINR;
    }
    
    const rate = this.exchangeRates[targetCurrency];
    if (!rate || isNaN(rate)) {
      console.warn(`Exchange rate not found for ${targetCurrency}, using 1:1 ratio`);
      return amountINR;
    }
    
    return amountINR * rate;
  }
  
  // Get specific exchange rate for a currency
  public getRate(currency: string): number {
    if (currency === this.BASE_CURRENCY) {
      return 1;
    }
    
    return this.exchangeRates[currency] || 1;
  }
  
  // Force refresh rates
  public async forceRefresh(): Promise<{ [key: string]: number }> {
    await this.fetchLiveRates();
    return this.getExchangeRates();
  }
  
  // Get last update timestamp
  public getLastUpdate(): Date {
    return new Date(this.lastUpdate);
  }
  
  // Check if rates are fresh
  public areRatesFresh(): boolean {
    const now = Date.now();
    return (now - this.lastUpdate) < this.CACHE_DURATION;
  }
  
  // Get rate source information
  public getRateSource(): string {
    return this.rateSource;
  }
  
  // Get rate accuracy status
  public getRateAccuracy(): 'live' | 'cached' | 'fallback' {
    const now = Date.now();
    const timeSinceUpdate = now - this.lastUpdate;
    
    if (this.rateSource === 'Fallback Rates') {
      return 'fallback';
    } else if (timeSinceUpdate < this.CACHE_DURATION) {
      return 'live';
    } else {
      return 'cached';
    }
  }
  
  // Get formatted rate update time
  public getFormattedLastUpdate(): string {
    return this.getLastUpdate().toLocaleTimeString();
  }
  
  // Cleanup method
  public cleanup(): void {
    this.stopPeriodicUpdates();
    this.listeners = [];
  }
}

// Export singleton instance
export const liveCurrencyService = LiveCurrencyService.getInstance();