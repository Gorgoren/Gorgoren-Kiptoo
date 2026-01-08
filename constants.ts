
import { BillingConfig, Customer } from './types';

export const DEFAULT_BILLING_CONFIG: BillingConfig = {
  baseFee: 15.00,
  tier1Limit: 10,
  tier1Rate: 1.50,
  tier2Limit: 30,
  tier2Rate: 2.75,
  tier3Rate: 4.50,
};

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: '1',
    name: 'John Doe',
    address: '123 River Road',
    meterNumber: 'MTR-001',
    lastReading: 1250,
    readings: [
      { id: 'r1', date: '2023-10-01', value: 1200, consumption: 25, amount: 52.5, status: 'Paid' },
      { id: 'r2', date: '2023-11-01', value: 1250, consumption: 50, amount: 110.0, status: 'Paid' },
    ],
  },
  {
    id: '2',
    name: 'Alice Smith',
    address: '456 Hill Street',
    meterNumber: 'MTR-002',
    lastReading: 890,
    readings: [
      { id: 'r3', date: '2023-11-15', value: 890, consumption: 15, amount: 42.25, status: 'Unpaid' },
    ],
  },
];
