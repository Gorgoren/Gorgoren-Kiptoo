
import React from 'react';
import { View } from '../types';

interface LayoutProps {
  currentView: View;
  setView: (view: View) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentView, setView, children }) => {
  const navItems = [
    { name: 'Dashboard' as View, icon: (active: boolean) => (
      <svg className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )},
    { name: 'Customers' as View, icon: (active: boolean) => (
      <svg className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )},
    { name: 'Billing' as View, icon: (active: boolean) => (
      <svg className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    )},
    { name: 'Insights' as View, icon: (active: boolean) => (
      <svg className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )},
  ];

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto bg-white shadow-xl relative">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-blue-600 text-white p-4 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-white p-1 rounded-lg">
            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight">AquaFlow</h1>
        </div>
        <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white/20 flex items-center justify-center text-xs font-bold">
          AD
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 pb-24 overflow-y-auto px-4 py-6">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-slate-200 flex justify-around items-center py-2 safe-bottom z-50">
        {navItems.map((item) => (
          <button
            key={item.name}
            onClick={() => setView(item.name)}
            className="flex flex-col items-center gap-1 px-4 py-1"
          >
            {item.icon(currentView === item.name)}
            <span className={`text-[10px] font-medium ${currentView === item.name ? 'text-blue-600' : 'text-slate-500'}`}>
              {item.name}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
