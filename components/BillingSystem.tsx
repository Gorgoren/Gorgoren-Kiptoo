
import React, { useState, useEffect } from 'react';
// Fixed: DEFAULT_BILLING_CONFIG is exported from constants, not types
import { Customer } from '../types';
import { DEFAULT_BILLING_CONFIG } from '../constants';
import { calculateBill, formatDate } from '../utils';

interface BillingSystemProps {
  customers: Customer[];
  onAddReading: (id: string, value: number) => void;
  pendingReading?: { customerId: string, value: string } | null;
  onClearPendingReading?: () => void;
}

const BillingSystem: React.FC<BillingSystemProps> = ({ customers, onAddReading, pendingReading, onClearPendingReading }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [newReading, setNewReading] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'record' | 'history'>('record');

  // Handle incoming OCR results
  useEffect(() => {
    if (pendingReading) {
      setSelectedCustomerId(pendingReading.customerId);
      setNewReading(pendingReading.value);
      setActiveTab('record');
      
      // We keep it once for pre-fill, then parent should clear it if we want it to be a one-time thing
      // or we can just leave it if the component unmounts
    }
  }, [pendingReading]);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const handleReadingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !newReading) return;
    
    const value = parseFloat(newReading);
    if (value <= (selectedCustomer?.lastReading || 0)) {
      alert("New reading must be higher than the last reading!");
      return;
    }

    onAddReading(selectedCustomerId, value);
    setNewReading('');
    setSelectedCustomerId('');
    if (onClearPendingReading) onClearPendingReading();
    alert("Reading recorded successfully!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-slate-800">Billing Center</h2>
        <p className="text-slate-500 text-sm">Manage meter readings and invoices</p>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-xl">
        <button 
          onClick={() => setActiveTab('record')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'record' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
        >
          Record Reading
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'history' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
        >
          Invoices
        </button>
      </div>

      {activeTab === 'record' ? (
        <form onSubmit={handleReadingSubmit} className="space-y-4">
          {pendingReading && (
            <div className="bg-blue-600 text-white p-3 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top duration-300">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
                <span className="text-[10px] font-bold uppercase tracking-widest">Reading Pre-filled via OCR</span>
              </div>
              <button 
                type="button" 
                onClick={onClearPendingReading}
                className="text-white/50 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Select Customer</label>
              <select 
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="">Choose a customer...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.meterNumber})</option>
                ))}
              </select>
            </div>

            {selectedCustomer && (
              <div className="bg-blue-50 p-4 rounded-2xl flex justify-between items-center">
                <div>
                  <span className="block text-[10px] font-bold text-blue-500 uppercase">Last Meter Reading</span>
                  <span className="text-lg font-bold text-blue-900">{selectedCustomer.lastReading} m³</span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-bold text-blue-500 uppercase">Meter Number</span>
                  <span className="text-sm font-mono font-bold text-blue-900">{selectedCustomer.meterNumber}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Current Meter Reading</label>
              <div className="relative">
                <input 
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newReading}
                  onChange={e => setNewReading(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-6 px-4 text-center text-4xl font-mono font-bold text-slate-800 outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                />
                <span className="absolute right-4 bottom-4 text-slate-400 font-bold text-sm">m³</span>
              </div>
            </div>

            {selectedCustomer && newReading && (
              <div className="p-4 border-t border-slate-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Consumption</span>
                  <span className="font-bold text-slate-800">{(parseFloat(newReading) - selectedCustomer.lastReading).toFixed(2)} m³</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="text-slate-800 font-bold">Estimated Bill</span>
                  <span className="font-bold text-blue-600">
                    ${calculateBill(parseFloat(newReading) - selectedCustomer.lastReading, DEFAULT_BILLING_CONFIG).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <button 
            type="submit"
            disabled={!selectedCustomerId || !newReading}
            className="w-full bg-blue-600 disabled:opacity-50 hover:bg-blue-700 text-white font-bold py-5 rounded-3xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Generate & Send Invoice
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          {customers.flatMap(c => c.readings.map(r => ({ ...r, customerName: c.name, meter: c.meterNumber }))).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(inv => (
            <div key={inv.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-800">{inv.customerName}</h4>
                  <p className="text-xs text-slate-500">Invoice #{inv.id.toUpperCase()}</p>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {inv.status}
                </span>
              </div>
              <div className="flex justify-between items-end border-t border-slate-50 pt-3">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Date</span>
                  <span className="text-xs font-medium">{formatDate(inv.date)}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Amount</span>
                  <span className="text-lg font-bold text-slate-800">${inv.amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BillingSystem;
