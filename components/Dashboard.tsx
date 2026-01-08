
import React from 'react';
import { Customer } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  customers: Customer[];
}

const Dashboard: React.FC<DashboardProps> = ({ customers }) => {
  const totalRevenue = customers.reduce((acc, c) => 
    acc + c.readings.reduce((sum, r) => sum + r.amount, 0), 0
  );

  const totalUnpaid = customers.reduce((acc, c) => 
    acc + c.readings.filter(r => r.status === 'Unpaid').reduce((sum, r) => sum + r.amount, 0), 0
  );

  const activeMeters = customers.length;

  // Chart data: Monthly usage aggregated
  const chartData = [
    { name: 'Aug', usage: 450 },
    { name: 'Sep', usage: 520 },
    { name: 'Oct', usage: 610 },
    { name: 'Nov', usage: 580 },
    { name: 'Dec', usage: 630 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-slate-800">Hello, Admin</h2>
        <p className="text-slate-500 text-sm">System summary for today</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex flex-col gap-1">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Total Revenue</span>
          <span className="text-2xl font-bold text-slate-800">${totalRevenue.toLocaleString()}</span>
        </div>
        <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex flex-col gap-1">
          <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">Unpaid Bills</span>
          <span className="text-2xl font-bold text-slate-800">${totalUnpaid.toLocaleString()}</span>
        </div>
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 col-span-2 flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Active Service Points</span>
            <span className="bg-emerald-200 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">Online</span>
          </div>
          <span className="text-2xl font-bold text-slate-800">{activeMeters} Meters Connected</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Total Usage Trend (m³)</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="usage" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#2563eb' : '#cbd5e1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-900 text-white p-5 rounded-2xl flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="font-bold">Next Reading Cycle</h3>
          <p className="text-xs text-slate-400">Scheduled for Jan 15th, 2024</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-500 text-sm font-bold px-4 py-2 rounded-xl transition-colors">
          View Schedule
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
