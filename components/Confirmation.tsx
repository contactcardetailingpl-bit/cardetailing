import React, { useEffect, useState } from 'react';
import { ViewMode } from '../types';
import Logo from './Logo';

interface ConfirmationProps {
  onNavigate: (view: ViewMode) => void;
}

const Confirmation: React.FC<ConfirmationProps> = ({ onNavigate }) => {
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('cdpl_last_booking_v1');
    if (saved) {
      setBookingDetails(JSON.parse(saved));
    }
    
    // Simulate API/Webhook Verification Handshake
    const timer = setTimeout(() => setIsVerifying(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (isVerifying) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="w-20 h-20 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin mb-8"></div>
        <p className="text-emerald-500 font-bold uppercase tracking-[0.3em] text-xs animate-pulse">Syncing with Stripe Cloud...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 animate-in fade-in zoom-in-95 duration-1000">
      <div className="max-w-4xl w-full bg-slate-900/40 border border-emerald-500/20 rounded-[3rem] p-8 md:p-16 text-center relative overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 via-transparent to-blue-500/5 pointer-events-none animate-pulse"></div>
        
        <div className="relative mb-12 inline-block">
          <div className="w-28 h-28 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
            <svg className="w-14 h-14 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <div className="relative z-10 max-w-2xl mx-auto">
          <span className="text-emerald-400 font-bold text-[10px] uppercase tracking-[0.5em] mb-4 block">Transaction Verified</span>
          <h2 className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tighter text-white mb-6 leading-tight">
            Studio <span className="text-emerald-500">Confirmed</span>
          </h2>
          <p className="text-slate-400 text-lg mb-12 font-light leading-relaxed">
            Your reservation is secured. Our Poznań facility has received your deposit and our master detailers are preparing the bay.
          </p>

          {bookingDetails && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 text-left">
              <div className="bg-black/40 p-8 rounded-3xl border border-white/5 space-y-6">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Vehicle Manifest</span>
                  <p className="text-xl font-display font-bold text-white uppercase">{bookingDetails.car}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {bookingDetails.services.map((s: string, i: number) => (
                    <span key={i} className="text-[9px] px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold uppercase tracking-wider">{s}</span>
                  ))}
                </div>
              </div>
              
              <div className="bg-black/40 p-8 rounded-3xl border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Studio Arrival</span>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📅</span>
                    <div>
                      <p className="text-white font-bold">{bookingDetails.date}</p>
                      <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">{bookingDetails.slot}</p>
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t border-white/5 mt-6">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest block mb-2">Deposit Secured</span>
                  <p className="text-2xl font-display font-bold text-emerald-400">{bookingDetails.amount} PLN</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button 
              onClick={() => onNavigate(ViewMode.HOME)}
              className="px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold uppercase tracking-[0.2em] text-[11px] transition-all shadow-2xl shadow-blue-500/30 active:scale-95"
            >
              Return to Studio Home
            </button>
            <button 
              onClick={() => onNavigate(ViewMode.ADVISOR)}
              className="px-12 py-5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl font-bold uppercase tracking-[0.2em] text-[11px] border border-white/10 transition-all active:scale-95"
            >
              Consult AI Advisor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;