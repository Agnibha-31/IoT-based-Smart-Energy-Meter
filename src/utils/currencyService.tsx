// Currency service - now uses live rates from the internet
import { liveCurrencyService } from './liveCurrencyService';

// Export the live currency service functions for backward compatibility
export const EXCHANGE_RATES = liveCurrencyService.getExchangeRates();

// Simple currency conversion function that uses live rates
export function convertFromINR(amountINR: number, targetCurrency: string): number {
  return liveCurrencyService.convertFromINR(amountINR, targetCurrency);
}

// Export the live service instance
export { liveCurrencyService };