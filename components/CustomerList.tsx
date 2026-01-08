
import React, { useState } from 'react';
import { Customer } from '../types';

interface CustomerListProps {
  customers: Customer[];
  onAdd: (customer: Omit<Customer, 'id' | 'readings'>) => void;
}

const CustomerList: React.FC<CustomerListProps> = ({ customers, onAdd }) => {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    meterNumber: '',
    lastReading: 0
  });

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.meterNumber.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      ...formData,
      lastReading: Number(formData.lastReading)
    });
    setShowModal(false);
    setFormData({ name: '', address: '', meterNumber: '', lastReading: 0 });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Customers</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white p-2 rounded-full shadow-lg"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>

      <div className="relative">
        <input 
          type="text"
          placeholder="Search name or meter #"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
        />
        <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <div className="space-y-3">
        {filtered.map(customer => (
          <div key={customer.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-lg">
                {customer.name.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-800">{customer.name}</span>
                <span className="text-xs text-slate-500">{customer.address}</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Meter #</span>
              <span className="text-sm font-mono text-slate-700">{customer.meterNumber}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            No customers found matching "{search}"
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">New Customer</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Full Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Address</label>
                <input required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Meter #</label>
                  <input required value={formData.meterNumber} onChange={e => setFormData({...formData, meterNumber: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Starting Reading</label>
                  <input type="number" required value={formData.lastReading} onChange={e => setFormData({...formData, lastReading: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95">
                Register Customer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;
