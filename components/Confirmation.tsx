import React, { useEffect, useState } from 'react';
import { ViewMode } from '../types';
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
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 animate-in fade-in zoom-in-95 duration-1000">
      <div className="max-w-4xl w-full bg-slate-900/40 border border-emerald-500/20 rounded-[3rem] p-8 md:p-16 text-center relative overflow-hidden shadow-2xl backdrop-blur-xl">
        {/* Shimmering Border Effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 via-transparent to-blue-500/5 pointer-events-none animate-pulse"></div>
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-blue-500/10 blur-[120px] rounded-full"></div>
        
        {/* Verified Icon & Branding */}
        <div className="relative mb-12 inline-block">
          <div className="w-28 h-28 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
            <svg className="w-14 h-14 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="absolute -inset-4 border-2 border-emerald-500/20 rounded-full animate-ping opacity-10"></div>
          <div className="absolute -inset-8 border border-emerald-500/10 rounded-full animate-ping delay-300 opacity-5"></div>
        </div>

        <div className="relative z-10 max-w-2xl mx-auto">
          <span className="text-emerald-400 font-bold text-[10px] uppercase tracking-[0.5em] mb-4 block">Authorization Successful</span>
          <h2 className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tighter text-white mb-6 leading-tight">
            Restoration <span className="text-emerald-500">Secured</span>
          </h2>
          <p className="text-slate-400 text-lg mb-12 font-light leading-relaxed">
            Your studio reservation in Poznań is officially confirmed. Our master detailers are now preparing the environment for your vehicle.
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
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest block mb-2">Deposit Authorized</span>
                  <p className="text-2xl font-display font-bold text-emerald-400">{bookingDetails.amount} PLN</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-10">
            <div className="p-8 bg-blue-600/5 border border-blue-500/20 rounded-3xl text-left relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                  <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
               </div>
               <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em] mb-4 block">Preparation Protocol</span>
               <ul className="space-y-4">
                  {[
                    "An itemized invoice and strategy guide has been sent to your email.",
                    "Please arrive 10 minutes before your slot for a visual inspection.",
                    "Our Poznań studio is temperature-controlled for optimal coating application.",
                    "You will receive a real-time status link once the restoration begins."
                  ].map((item, i) => (
                    <li key={i} className="flex gap-4 text-xs text-slate-300 leading-relaxed">
                      <span className="text-emerald-500 font-bold">0{i+1}</span>
                      {item}
                    </li>
                  ))}
               </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button 
                onClick={() => onNavigate(ViewMode.HOME)}
                className="px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold uppercase tracking-[0.2em] text-[11px] transition-all shadow-2xl shadow-blue-500/30 active:scale-95"
              >
                Return to Studio Home
              </button>
              <button 
                onClick={() => onNavigate(ViewMode.GALLERY)}
                className="px-12 py-5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl font-bold uppercase tracking-[0.2em] text-[11px] border border-white/10 transition-all active:scale-95"
              >
                View Latest Portfolio
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 flex flex-col items-center gap-6">
         <Logo className="h-8 opacity-50" />
         <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-[0.5em] text-slate-700">
            <span>Poznań Studio standards</span>
            <div className="h-1 w-1 rounded-full bg-slate-800"></div>
            <span>Verified Secure Transaction</span>
         </div>
      </div>
    </div>
  );
};

export default Confirmation;