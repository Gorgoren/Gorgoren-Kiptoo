
export interface Customer {
  id: string;
  name: string;
  address: string;
  meterNumber: string;
  lastReading: number;
  readings: Reading[];
  scans?: ScanEntry[];
}

export interface Reading {
  id: string;
  date: string;
  value: number;
  consumption: number;
  amount: number;
  status: 'Unpaid' | 'Paid';
}

export interface ScanEntry {
  id: string;
  date: string;
  analysis: string;
  alertLevel: string;
}

export interface BillingConfig {
  baseFee: number;
  tier1Limit: number; // e.g. 10 m3
  tier1Rate: number;
  tier2Limit: number; // e.g. 30 m3
  tier2Rate: number;
  tier3Rate: number;
}

export type View = 'Dashboard' | 'Customers' | 'Billing' | 'Insights';
