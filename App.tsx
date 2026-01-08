
import React, { useState, useEffect } from 'react';
// Fixed: DEFAULT_BILLING_CONFIG is exported from constants, not types
import { Customer, View, ScanEntry } from './types';
import { INITIAL_CUSTOMERS, DEFAULT_BILLING_CONFIG } from './constants';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CustomerList from './components/CustomerList';
import BillingSystem from './components/BillingSystem';
import Insights from './components/Insights';

const App: React.FC = () => {
  const [view, setView] = useState<View>('Dashboard');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingReading, setPendingReading] = useState<{ customerId: string, value: string } | null>(null);

  useEffect(() => {
    // Load data from localStorage or fallback to constants
    const saved = localStorage.getItem('aquaflow_customers');
    if (saved) {
      setCustomers(JSON.parse(saved));
    } else {
      setCustomers(INITIAL_CUSTOMERS);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('aquaflow_customers', JSON.stringify(customers));
    }
  }, [customers, isLoading]);

  const addCustomer = (customer: Omit<Customer, 'id' | 'readings'>) => {
    const newCustomer: Customer = {
      ...customer,
      id: Math.random().toString(36).substr(2, 9),
      readings: [],
      scans: []
    };
    setCustomers(prev => [...prev, newCustomer]);
  };

  const addReading = (customerId: string, readingValue: number) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        const consumption = readingValue - c.lastReading;
        const amount = 50; // Simple placeholder, logic should be robust
        
        const newReading = {
          id: Math.random().toString(36).substr(2, 9),
          date: new Date().toISOString(),
          value: readingValue,
          consumption,
          amount,
          status: 'Unpaid' as const
        };
        return {
          ...c,
          lastReading: readingValue,
          readings: [...c.readings, newReading]
        };
      }
      return c;
    }));
  };

  const handleAddScan = (customerId: string, scan: Omit<ScanEntry, 'id' | 'date'>) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        const newScan: ScanEntry = {
          ...scan,
          id: Math.random().toString(36).substr(2, 9),
          date: new Date().toISOString()
        };
        return {
          ...c,
          scans: [newScan, ...(c.scans || [])]
        };
      }
      return c;
    }));
  };

  const handleOcrReading = (customerId: string, value: string) => {
    setPendingReading({ customerId, value });
    setView('Billing');
  };

  const clearPendingReading = () => {
    setPendingReading(null);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-blue-600 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mb-4"></div>
        <p className="font-medium">AquaFlow is starting...</p>
      </div>
    );
  }

  return (
    <Layout currentView={view} setView={setView}>
      {view === 'Dashboard' && <Dashboard customers={customers} />}
      {view === 'Customers' && <CustomerList customers={customers} onAdd={addCustomer} />}
      {view === 'Billing' && (
        <BillingSystem 
          customers={customers} 
          onAddReading={addReading} 
          pendingReading={pendingReading}
          onClearPendingReading={clearPendingReading}
        />
      )}
      {view === 'Insights' && (
        <Insights 
          customers={customers} 
          onAddScan={handleAddScan} 
          onOcrReading={handleOcrReading}
        />
      )}
    </Layout>
  );
};

export default App;
