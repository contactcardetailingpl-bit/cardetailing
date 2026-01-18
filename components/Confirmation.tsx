import React, { useEffect, useState } from 'react';
import { ViewMode } from '../types';
// Fix: Added missing import for Logo component
import Logo from './Logo';

interface ConfirmationProps {
  onNavigate: (view: ViewMode) => void;
}

const Confirmation: React.FC<ConfirmationProps> = ({ onNavigate }) => {
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('cdpl_last_booking_v1');
    if (saved) {
      setBookingDetails(JSON.parse(saved));
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 animate-in fade-in zoom-in-95 duration-700">
      <div className="max-w-3xl w-full bg-slate-900/50 border border-emerald-500/20 rounded-[3rem] p-12 text-center relative overflow-hidden shadow-2xl backdrop-blur-xl">
        {/* Animated Background Pulse */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full"></div>
        
        {/* Verified Icon */}
        <div className="relative mb-10 inline-block">
          <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <svg className="w-12 h-12 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="absolute -inset-2 border border-emerald-500/20 rounded-full animate-ping opacity-20"></div>
        </div>

        <h2 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight text-white mb-4">Reservation Confirmed</h2>
        <p className="text-slate-400 text-lg mb-12 max-w-lg mx-auto leading-relaxed">
          Your studio slot in Poznań has been secured. Our team is now preparing the restoration environment for your vehicle.
        </p>

        {bookingDetails && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 text-left">
            <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Vehicle Manifest</span>
              <p className="text-white font-bold">{bookingDetails.car}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {bookingDetails.services.map((s: string, i: number) => (
                  <span key={i} className="text-[8px] px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold uppercase">{s}</span>
                ))}
              </div>
            </div>
            <div className="bg-black/40 p-6 rounded-2xl border border-white/5 flex flex-col justify-center">
              <div className="mb-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Appointment Slot</span>
                <p className="text-white font-bold">{bookingDetails.date} • {bookingDetails.slot}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest block mb-1">Deposit Authorized</span>
                <p className="text-xl font-display font-bold text-emerald-400">{bookingDetails.amount} PLN</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex items-center justify-center gap-8 py-6 border-t border-white/5">
            <div className="flex flex-col items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Studio Sync</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Payment Verified</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-700"></div>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Entry Prep</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button 
              onClick={() => onNavigate(ViewMode.HOME)}
              className="px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase tracking-widest text-[11px] transition-all shadow-xl shadow-blue-500/20"
            >
              Return to Homepage
            </button>
            <button 
              onClick={() => onNavigate(ViewMode.SERVICES)}
              className="px-10 py-5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold uppercase tracking-widest text-[11px] border border-white/10 transition-all"
            >
              Explore Services
            </button>
          </div>
        </div>
      </div>

      <div className="mt-12 flex items-center gap-3 opacity-30">
         <Logo className="h-6" />
         <div className="h-4 w-[1px] bg-white/20"></div>
         <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Official Confirmation Registry</span>
      </div>
    </div>
  );
};

export default Confirmation;