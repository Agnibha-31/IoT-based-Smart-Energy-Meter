import { useState, useEffect } from 'react';
import { electricityRateService } from './electricityRateService';

export function useElectricityRate() {
  const [rate, setRate] = useState(electricityRateService.getCurrentRate());
  const [rateInfo, setRateInfo] = useState(electricityRateService.getRateInfo());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const updateRate = () => {
      setRate(electricityRateService.getCurrentRate());
      setRateInfo(electricityRateService.getRateInfo());
    };

    // Subscribe to rate updates
    const unsubscribe = electricityRateService.subscribe(updateRate);

    return () => {
      unsubscribe();
    };
  }, []);

  const forceRefresh = async () => {
    setIsRefreshing(true);
    try {
      await electricityRateService.forceRefresh();
      setRate(electricityRateService.getCurrentRate());
      setRateInfo(electricityRateService.getRateInfo());
    } catch (error) {
      console.error('Failed to refresh rate:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    rate,
    rateInfo,
    isRefreshing,
    forceRefresh,
    isFresh: electricityRateService.isRateFresh(),
    lastUpdate: electricityRateService.getLastUpdateTime(),
  };
}
