
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Customer, ScanEntry } from '../types';
import { getWaterInsights, extractMeterReadingFromImage } from '../services/geminiService';
import { formatDate } from '../utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface InsightsProps {
  customers: Customer[];
  onAddScan: (customerId: string, scan: Omit<ScanEntry, 'id' | 'date'>) => void;
  onOcrReading: (customerId: string, value: string) => void;
}

interface AppAlert {
  id: string;
  type: 'Overdue Bill' | 'Critical Leak';
  message: string;
  customerId: string;
  customerName: string;
  severity: 'high' | 'medium';
}

type AlertFilter = 'All' | 'Overdue Bill' | 'Critical Leak';

const Insights: React.FC<InsightsProps> = ({ customers, onAddScan, onOcrReading }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [insight, setInsight] = useState<{ analysis: string, alertLevel: string } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<AlertFilter>('All');
  
  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Prepare chart data for the selected customer
  const chartData = useMemo(() => {
    if (!selectedCustomer) return [];
    return selectedCustomer.readings.slice(-5).map(r => ({
      date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      consumption: r.consumption
    }));
  }, [selectedCustomer]);

  // Calculate all potential alerts
  const allAlerts = useMemo(() => {
    const alerts: AppAlert[] = [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    customers.forEach(customer => {
      customer.readings.forEach(reading => {
        if (reading.status === 'Unpaid' && new Date(reading.date) < thirtyDaysAgo) {
          const alertId = `overdue-${reading.id}`;
          if (!dismissedAlertIds.includes(alertId)) {
            alerts.push({
              id: alertId,
              type: 'Overdue Bill',
              message: `Bill of $${reading.amount.toFixed(2)} is overdue by more than 30 days.`,
              customerId: customer.id,
              customerName: customer.name,
              severity: 'high'
            });
          }
        }
      });
    });

    // Add current critical leak if it exists and wasn't dismissed
    if (insight && insight.alertLevel === 'high' && selectedCustomer) {
      const leakAlertId = `leak-${selectedCustomer.id}-${insight.alertLevel}`;
      if (!dismissedAlertIds.includes(leakAlertId)) {
        alerts.push({
          id: leakAlertId,
          type: 'Critical Leak',
          message: insight.analysis,
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          severity: 'high'
        });
      }
    }

    return alerts;
  }, [customers, insight, selectedCustomer, dismissedAlertIds]);

  // Apply filter to the alerts
  const filteredAlerts = useMemo(() => {
    if (filterType === 'All') return allAlerts;
    return allAlerts.filter(alert => alert.type === filterType);
  }, [allAlerts, filterType]);

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlertIds(prev => [...prev, alertId]);
  };

  const handleRunScan = async () => {
    if (!selectedCustomer) return;
    
    setIsScanning(true);
    setInsight(null); // Clear previous results
    
    try {
      const data = await getWaterInsights(selectedCustomer);
      setInsight(data);
      // Persist scan result to history
      onAddScan(selectedCustomer.id, {
        analysis: data.analysis,
        alertLevel: data.alertLevel
      });
    } catch (error) {
      console.error("Scan failed", error);
    } finally {
      setIsScanning(false);
    }
  };

  // Camera logic
  const openCamera = async () => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Camera error:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setIsCameraOpen(false);
  };

  const captureAndOcr = async () => {
    if (!videoRef.current || !canvasRef.current || !selectedCustomerId) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];
    
    setIsOcrProcessing(true);
    try {
      const reading = await extractMeterReadingFromImage(base64Image);
      if (reading) {
        onOcrReading(selectedCustomerId, reading);
        closeCamera();
      } else {
        alert("Could not extract a clear reading. Please try again.");
      }
    } catch (err) {
      console.error("OCR capture error:", err);
    } finally {
      setIsOcrProcessing(false);
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const getSeverityConfig = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700',
          badge: 'bg-red-200',
          label: 'Critical Leak Detected'
        };
      case 'medium':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-700',
          badge: 'bg-amber-200',
          label: 'Potential Irregularity'
        };
      default:
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'text-emerald-700',
          badge: 'bg-emerald-200',
          label: 'System Healthy'
        };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-slate-800">Insights & Alerts</h2>
        <p className="text-slate-500 text-sm">Automated system monitoring</p>
      </div>

      {/* Priority Alerts Section */}
      {allAlerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black text-red-500 uppercase tracking-[0.2em]">Priority Alerts</h3>
            <span className="text-[10px] font-bold text-slate-400">{allAlerts.length} total</span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {(['All', 'Overdue Bill', 'Critical Leak'] as AlertFilter[]).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${
                  filterType === type 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                {type === 'All' ? 'Show All' : type + 's'}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map(alert => (
                <div key={alert.id} className="bg-white border-l-4 border-red-500 p-4 rounded-xl shadow-sm animate-in slide-in-from-left duration-300 flex items-start gap-3">
                  <div className="bg-red-100 p-1.5 rounded-lg text-red-600 shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{alert.type}</span>
                      <button 
                        onClick={() => handleDismissAlert(alert.id)}
                        className="text-slate-300 hover:text-slate-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm truncate">{alert.customerName}</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{alert.message}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-400 text-xs font-medium italic">No active alerts for this filter.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 text-white overflow-hidden relative shadow-lg shadow-blue-200">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <h3 className="text-lg font-bold">Manual AI Scanner</h3>
          </div>
          <p className="text-blue-100 text-sm opacity-90 mb-4 leading-relaxed">
            Select a customer below to run a deep analysis on their flow data or scan their meter via camera.
          </p>
        </div>
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest px-1">Registered Meters</label>
        {customers.map(customer => (
          <button 
            key={customer.id} 
            onClick={() => {
              setSelectedCustomerId(customer.id);
              setInsight(null);
            }}
            className={`w-full text-left bg-white p-4 rounded-2xl border transition-all flex items-center justify-between shadow-sm ${selectedCustomerId === customer.id ? 'border-blue-600 ring-2 ring-blue-600/10' : 'border-slate-100'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${selectedCustomerId === customer.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {customer.name.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className={`font-bold ${selectedCustomerId === customer.id ? 'text-blue-700' : 'text-slate-800'}`}>{customer.name}</span>
                <span className="text-xs text-slate-400 font-mono">{customer.meterNumber}</span>
              </div>
            </div>
            {selectedCustomerId === customer.id && !insight && !isScanning && (
              <span className="text-[10px] font-bold text-blue-600 uppercase">Focused</span>
            )}
          </button>
        ))}
      </div>

      {selectedCustomerId && !insight && !isScanning && (
        <div className="flex gap-2">
          <button 
            onClick={handleRunScan}
            className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-transform active:scale-95 animate-in fade-in slide-in-from-bottom duration-300"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Analyze Patterns
          </button>
          <button 
            onClick={openCamera}
            className="bg-blue-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-transform active:scale-95 animate-in fade-in slide-in-from-bottom duration-300"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Scan Meter
          </button>
        </div>
      )}

      {isScanning && (
        <div className="bg-blue-50 border border-blue-100 p-8 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 animate-pulse">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <svg className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-blue-800">Gemini Processing...</h4>
            <p className="text-blue-600 text-xs">Analyzing historical m³ flow deviations</p>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="p-4 flex justify-between items-center text-white">
            <h3 className="font-bold">Scan Meter</h3>
            <button onClick={closeCamera} className="p-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 relative overflow-hidden bg-slate-900">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Guide Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-24 border-2 border-dashed border-white/50 rounded-xl flex items-center justify-center">
                <span className="text-white/30 text-[10px] uppercase font-bold tracking-widest">Align Meter Display</span>
              </div>
            </div>
          </div>
          <div className="p-8 flex flex-col items-center gap-4 bg-slate-900">
            {isOcrProcessing ? (
              <div className="flex items-center gap-3 text-blue-400">
                <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span className="font-bold text-sm uppercase">Reading Image...</span>
              </div>
            ) : (
              <button 
                onClick={captureAndOcr}
                className="w-16 h-16 bg-white rounded-full border-4 border-slate-300 active:scale-90 transition-transform flex items-center justify-center"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-full"></div>
              </button>
            )}
            <p className="text-slate-500 text-[10px] text-center max-w-[200px]">Hold steady and ensure the reading is well-lit for OCR extraction.</p>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {insight && selectedCustomer && (
        <div className={`p-6 rounded-3xl border shadow-lg animate-in zoom-in-95 duration-500 ${getSeverityConfig(insight.alertLevel).bg} ${getSeverityConfig(insight.alertLevel).border}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${getSeverityConfig(insight.alertLevel).badge} ${getSeverityConfig(insight.alertLevel).text}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {insight.alertLevel === 'low' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  )}
                </svg>
              </div>
              <h4 className={`font-black uppercase tracking-widest text-xs ${getSeverityConfig(insight.alertLevel).text}`}>
                {getSeverityConfig(insight.alertLevel).label}
              </h4>
            </div>
            <button 
              onClick={() => setInsight(null)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            <p className="text-slate-800 leading-relaxed font-medium">
              {insight.analysis}
            </p>
            
            <div className="bg-white/40 p-3 rounded-2xl flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Latest Flow</span>
                <span className="text-sm font-bold text-slate-800">{selectedCustomer.readings[selectedCustomer.readings.length - 1]?.consumption || 0} m³</span>
              </div>
              <div className="h-8 w-px bg-slate-200"></div>
              <div className="flex flex-col text-right">
                <span className="text-[10px] text-slate-500 font-bold uppercase">AI Confidence</span>
                <span className="text-sm font-bold text-blue-600">94%</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200/50 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
            <span>Powered by Gemini 3</span>
            <span>Ref: {Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
          </div>
        </div>
      )}

      {/* Consumption Trend Section */}
      {selectedCustomer && selectedCustomer.readings.length > 0 && (
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Flow Trend (Last 5)</h3>
            <span className="text-[10px] font-bold text-blue-500">m³ per period</span>
          </div>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="date" fontSize={9} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                <YAxis fontSize={9} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                />
                <Bar dataKey="consumption" radius={[4, 4, 4, 4]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#2563eb' : '#cbd5e1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Scan History Section */}
      {selectedCustomer && (
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Scan History</h3>
            <span className="text-[10px] font-bold text-slate-400">{selectedCustomer.scans?.length || 0} logs</span>
          </div>

          {selectedCustomer.scans && selectedCustomer.scans.length > 0 ? (
            <div className="space-y-3">
              {selectedCustomer.scans.map((scan) => {
                const config = getSeverityConfig(scan.alertLevel);
                return (
                  <div key={scan.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${scan.alertLevel === 'high' ? 'bg-red-500' : scan.alertLevel === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{formatDate(scan.date)}</span>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${config.badge} ${config.text}`}>
                        {scan.alertLevel} Risk
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed italic border-l-2 border-slate-100 pl-3">
                      "{scan.analysis}"
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">No previous scans recorded for this meter.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Insights;
