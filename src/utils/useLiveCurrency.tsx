import { useState, useEffect } from 'react';
import { liveCurrencyService } from './liveCurrencyService';

// Custom hook for using live currency rates
export function useLiveCurrency() {
  const [exchangeRates, setExchangeRates] = useState({});
  const [rateSource, setRateSource] = useState('');
  const [rateAccuracy, setRateAccuracy] = useState('fallback');
  const [lastRateUpdate, setLastRateUpdate] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Update function
    const updateRates = () => {
      setExchangeRates(liveCurrencyService.getExchangeRates());
      setRateSource(liveCurrencyService.getRateSource());
      setRateAccuracy(liveCurrencyService.getRateAccuracy());
      setLastRateUpdate(liveCurrencyService.getLastUpdate() as any);
    };

    // Initial update
    updateRates();

    // Subscribe to rate updates
    const unsubscribe = liveCurrencyService.subscribe(updateRates);

    return () => {
      unsubscribe();
    };
  }, []);

  // Convert function
  const convertFromINR = (amountINR: number, targetCurrency: string): number => {
    return liveCurrencyService.convertFromINR(amountINR, targetCurrency);
  };

  // Force refresh function
  const forceRefresh = async () => {
    setIsRefreshing(true);
    try {
      await liveCurrencyService.forceRefresh();
    } catch (error) {
      console.error('Failed to refresh rates:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get specific rate
  const getRate = (currency: string): number => {
    return liveCurrencyService.getRate(currency);
  };

  return {
    exchangeRates,
    rateSource,
    rateAccuracy,
    lastRateUpdate,
    isRefreshing,
    convertFromINR,
    forceRefresh,
    getRate,
    areRatesFresh: liveCurrencyService.areRatesFresh(),
    getFormattedLastUpdate: liveCurrencyService.getFormattedLastUpdate(),
  };
}