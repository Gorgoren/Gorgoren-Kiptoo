
import { BillingConfig } from './types';

export const calculateBill = (consumption: number, config: BillingConfig): number => {
  let total = config.baseFee;
  
  if (consumption <= config.tier1Limit) {
    total += consumption * config.tier1Rate;
  } else if (consumption <= config.tier2Limit) {
    total += (config.tier1Limit * config.tier1Rate) + 
             ((consumption - config.tier1Limit) * config.tier2Rate);
  } else {
    total += (config.tier1Limit * config.tier1Rate) + 
             ((config.tier2Limit - config.tier1Limit) * config.tier2Rate) +
             ((consumption - config.tier2Limit) * config.tier3Rate);
  }
  
  return parseFloat(total.toFixed(2));
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};
