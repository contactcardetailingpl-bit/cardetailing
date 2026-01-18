import React, { useState, useMemo, useEffect } from 'react';
import { summarizeInquiry } from '../services/geminiService';
import { Appointment, WorkshopService } from '../types';

declare global {
  interface Window {
    Stripe?: any;
    emailjs?: any;
  }
}

// --- STRIPE CONFIGURATION ---
const STRIPE_CHECKOUT_URL = 'https://buy.stripe.com/test_fZu00k5qQ8uIgUT8KQ5wI00';
const STRIPE_PRODUCT_ID = 'prod_TlGXhyW2wBYm5I';

// --- EMAILJS CONFIGURATION ---
const EMAILJS_SERVICE_ID = 'service_d2nl42u'; 
const EMAILJS_PUBLIC_KEY = 'LHrgkITA0L-J7QOE0';
const EMAILJS_STUDIO_TEMPLATE_ID = 'template_uxhva1n'; 
const EMAILJS_CUSTOMER_TEMPLATE_ID = 'template_ttzwbm7';

const STUDIO_EMAIL = 'contactcardetailing.pl@gmail.com';

const TIME_SLOTS = [
  { id: 'morning', label: 'Morning Slot', time: '09:00 - 12:00', icon: '🌅' },
  { id: 'afternoon', label: 'Afternoon Slot', time: '13:00 - 16:00', icon: '☀️' },
  { id: 'evening', label: 'Evening Premium', time: '17:00 - 20:00', icon: '🌙', surcharge: 50 }
];

interface BookingProps {
  selectedServices: string[];
  serviceRegistry: WorkshopService[];
  onToggleService: (name: string) => void;
  onAddAppointment: (appt: Appointment) => void;
}

type BookingStep = 'details' | 'schedule' | 'payment';

const Booking: React.FC<BookingProps> = ({ selectedServices, serviceRegistry, onToggleService, onAddAppointment }) => {
  const [step, setStep] = useState<BookingStep>('details');
  const [submitted, setSubmitted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [summary, setSummary] = useState<string>("Initializing restoration protocol...");
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [car, setCar] = useState('');
  const [notes, setNotes] = useState('');
  
  const [selectedDate, setSelectedDate] = useState<string>(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('morning');

  useEffect(() => {
    if (window.emailjs && EMAILJS_PUBLIC_KEY) {
      window.emailjs.init(EMAILJS_PUBLIC_KEY);
    }
  }, []);

  const priceCalculation = useMemo(() => {
    const parsePrice = (priceStr: string) => parseInt(priceStr.replace(/[^0-9]/g, '')) || 0;
    const items = serviceRegistry
      .filter(s => selectedServices.includes(s.name) && s.isVisible !== false)
      .map(s => ({ name: s.name, price: parsePrice(s.price) }));
    
    const subtotalValue = items.reduce((acc, s) => acc + s.price, 0);
    const selectedSlot = TIME_SLOTS.find(t => t.id === selectedTimeSlot);
    const surchargeValue = selectedSlot?.surcharge || 0;
    
    const total = subtotalValue + surchargeValue;
    const deposit = Math.round(total * 0.20);
    const remaining = total - deposit;

    return { 
      lineItems: items,
      surcharge: surchargeValue,
      surchargeLabel: selectedSlot?.label,
      totalPrice: total, 
      depositAmount: deposit, 
      remainingBalance: remaining 
    };
  }, [selectedServices, serviceRegistry, selectedTimeSlot]);

  const { lineItems, surcharge, surchargeLabel, totalPrice, depositAmount, remainingBalance } = priceCalculation;

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 1; i <= 14; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        days.push({ 
          full: d.toISOString().split('T')[0], 
          day: d.toLocaleDateString('en-US', { weekday: 'short' }), 
          date: d.getDate() 
        });
    }
    return days;
  }, []);

  const handleStripeCheckout = async () => {
    setIsProcessing(true);
    setStatusMsg('Synchronizing Studio Database...');

    // We execute the email protocols but don't let a failure block the Stripe redirect
    try {
      // 1. Send Email Protocols and handle AI summary in parallel
      await handleEmailProtocols();
    } catch (err) {
      console.warn("Email protocol failed (likely configuration issue), proceeding to payment anyway:", err);
    }

    // 2. Final Redirection to your Stripe Product Link
    setStatusMsg('Finalizing Secure Redirection...');
    setTimeout(() => {
      window.location.href = STRIPE_CHECKOUT_URL;
    }, 1000);
  };

  const handleEmailProtocols = async () => {
    const targetEmail = email.trim();
    const selectedSlotInfo = TIME_SLOTS.find(t => t.id === selectedTimeSlot);
    
    const sharedContext = {
      from_name: name,
      customer_name: name,
      vehicle: car,
      services_list: lineItems.map(li => li.name).join(', '),
      booking_date: selectedDate,
      time_slot: selectedSlotInfo?.label || 'Not Selected',
      total_price: `${totalPrice} PLN`,
      deposit_paid: `${depositAmount} PLN`,
      balance_due: `${remainingBalance} PLN`,
      studio_notes: notes || 'No additional notes provided.',
      stripe_product_id: STRIPE_PRODUCT_ID
    };

    const studioPayload = { ...sharedContext, to_email: STUDIO_EMAIL };
    const customerPayload = { ...sharedContext, to_email: targetEmail };

    // Try EmailJS dispatch
    if (window.emailjs) {
      try {
        await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_STUDIO_TEMPLATE_ID, studioPayload);
        if (EMAILJS_CUSTOMER_TEMPLATE_ID) {
          await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_CUSTOMER_TEMPLATE_ID, customerPayload);
        }
      } catch (e) {
        console.error("EmailJS Service Error:", e);
      }
    }

    // Generate AI Summary for local state/registry
    let aiSummary = "Professional restoration planned for " + car;
    try {
      const conversationText = `Client: ${name}, Vehicle: ${car}, Services: ${lineItems.map(li => li.name).join(', ')}`;
      aiSummary = await summarizeInquiry(conversationText);
    } catch (e) {
      console.warn("AI Summarization failed:", e);
    }
    setSummary(aiSummary);

    // Register appointment in local storage/app state
    onAddAppointment({
      id: Math.random().toString(36).substr(2, 9),
      name, email: targetEmail, car, notes,
      services: lineItems.map(li => li.name),
      aiSummary,
      status: 'PENDING',
      timestamp: Date.now()
    });
  };

  return (
    <div className="flex-1 flex flex-col px-6 py-20 max-w-7xl mx-auto w-full">
      <div className="text-center mb-16">
        <h2 className="text-5xl font-display font-bold mb-4 uppercase tracking-tight text-white">Studio Booking</h2>
        <div className="flex items-center justify-center gap-4 mt-8">
            <div className={`h-1.5 w-12 rounded-full ${step === 'details' ? 'bg-blue-500' : 'bg-slate-800'}`}></div>
            <div className={`h-1.5 w-12 rounded-full ${step === 'schedule' ? 'bg-blue-500' : 'bg-slate-800'}`}></div>
            <div className={`h-1.5 w-12 rounded-full ${step === 'payment' ? 'bg-blue-500' : 'bg-slate-800'}`}></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-5 space-y-8 animate-in slide-in-from-left-4 lg:sticky lg:top-32">
           <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
              <div className="flex items-center justify-between pb-6 border-b border-white/5 mb-6">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-lg">📋</div>
                    <h4 className="text-xl font-display font-bold text-white uppercase tracking-tight">Booking Manifest</h4>
                 </div>
              </div>
              <div className="space-y-4">
                 {lineItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                       <span className="text-xs font-bold text-slate-300 uppercase tracking-tight">{item.name}</span>
                       <span className="text-xs font-mono text-slate-500">{item.price} PLN</span>
                    </div>
                 ))}
                 {surcharge > 0 && (
                    <div className="flex items-center justify-between bg-blue-500/5 p-4 rounded-xl border border-blue-500/10">
                       <span className="text-xs font-bold text-blue-400 uppercase tracking-tight">{surchargeLabel}</span>
                       <span className="text-xs font-mono text-blue-400">+{surcharge} PLN</span>
                    </div>
                 )}
              </div>
              <div className="pt-8 mt-6 border-t border-white/5">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Investment</span>
                    <span className="text-2xl font-display font-bold text-white">{totalPrice} PLN</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Deposit Due (20%)</span>
                    <span className="text-xl font-display font-bold text-emerald-400">{depositAmount} PLN</span>
                 </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-7 relative flex flex-col bg-slate-900/30 p-8 md:p-12 rounded-[2.5rem] border border-white/5 shadow-2xl min-h-[500px]">
          {isProcessing && (
            <div className="absolute inset-0 z-50 bg-[#05070a]/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center rounded-[2.5rem] border border-blue-500/20">
               <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-8"></div>
               <p className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.3em] animate-pulse">{statusMsg}</p>
            </div>
          )}

          {step === 'details' && (
              <div className="space-y-12 animate-in slide-in-from-right-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Client Name</label>
                          <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-white text-sm outline-none focus:border-blue-500" placeholder="John Doe" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Contact Email</label>
                          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-white text-sm outline-none focus:border-blue-500" placeholder="john@email.com" />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Vehicle Specification</label>
                          <input required type="text" value={car} onChange={(e) => setCar(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-white text-sm outline-none focus:border-blue-500" placeholder="e.g. 2024 Porsche Taycan" />
                      </div>
                  </div>
                  <div className="flex justify-end pt-4">
                      <button onClick={() => setStep('schedule')} disabled={!name || !email || !car} className="px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase tracking-widest text-[11px] disabled:opacity-50 transition-all">Next: Select Schedule →</button>
                  </div>
              </div>
          )}

          {step === 'schedule' && (
              <div className="space-y-12 animate-in slide-in-from-right-4">
                  <div className="space-y-6">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Select Date</label>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                          {calendarDays.map((day) => (
                              <button key={day.full} onClick={() => setSelectedDate(day.full)} className={`flex flex-col items-center py-4 rounded-xl border transition-all ${selectedDate === day.full ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-black/40 border-white/5 text-slate-500 hover:border-white/20'}`}>
                                  <span className="text-[8px] uppercase tracking-widest font-bold mb-1">{day.day}</span>
                                  <span className="text-lg font-display font-bold">{day.date}</span>
                              </button>
                          ))}
                      </div>
                  </div>
                  <div className="space-y-6">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Preferred Time Slot</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {TIME_SLOTS.map((slot) => (
                              <button key={slot.id} onClick={() => setSelectedTimeSlot(slot.id)} className={`flex items-center gap-4 p-5 rounded-2xl border transition-all ${selectedTimeSlot === slot.id ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-black/40 border-white/5 text-slate-400 hover:border-white/20'}`}>
                                  <span className="text-2xl">{slot.icon}</span>
                                  <div className="text-left">
                                      <p className="text-[10px] font-bold uppercase tracking-widest">{slot.label}</p>
                                      <p className="text-[9px] font-mono opacity-60">{slot.time}</p>
                                  </div>
                              </button>
                          ))}
                      </div>
                  </div>
                  <div className="flex justify-between pt-4">
                      <button onClick={() => setStep('details')} className="px-8 py-5 bg-white/5 text-slate-400 rounded-xl font-bold uppercase tracking-widest text-[11px] hover:bg-white/10 transition-all">Back</button>
                      <button onClick={() => setStep('payment')} className="px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase tracking-widest text-[11px] transition-all">Next: Review & Pay →</button>
                  </div>
              </div>
          )}

          {step === 'payment' && (
              <div className="space-y-10 animate-in slide-in-from-right-4">
                  <div className="text-center py-6">
                      <div className="inline-block p-4 rounded-full bg-blue-600/10 mb-6">
                        <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-display font-bold text-white uppercase tracking-tight mb-4">Secure Deposit Auth</h3>
                      <p className="text-slate-400 text-sm max-w-sm mx-auto mb-8">
                        Ready to finalize reservation for your <span className="text-white font-bold">{car}</span>. A deposit of {depositAmount} PLN is required.
                      </p>
                  </div>

                  <div className="bg-black/40 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                        <span className="text-slate-500">Stripe Product Link</span>
                        <span className="text-blue-500 font-mono text-[9px]">Authorized</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                        <span className="text-slate-500">Booking Date</span>
                        <span className="text-white">{selectedDate}</span>
                      </div>
                      <div className="h-[1px] w-full bg-white/5"></div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">Payment Due Now</span>
                        <span className="text-2xl font-display font-bold text-white">{depositAmount} PLN</span>
                      </div>
                  </div>

                  <div className="flex flex-col gap-6 pt-4">
                      <button 
                        onClick={handleStripeCheckout} 
                        className="w-full py-6 rounded-2xl font-bold uppercase tracking-[0.3em] text-[12px] bg-blue-600 hover:bg-blue-500 text-white shadow-2xl shadow-blue-500/20 transition-all flex items-center justify-center gap-4 group"
                      >
                        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                        </svg>
                        Proceed to Secure Stripe Payment
                      </button>
                      <button onClick={() => setStep('schedule')} className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Go back to scheduler</button>
                  </div>

                  <div className="flex items-center justify-center gap-4 pt-8 opacity-40">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-6 filter brightness-0 invert" />
                    <div className="h-4 w-[1px] bg-white/20"></div>
                    <span className="text-[9px] font-bold uppercase tracking-widest">Secured by Stripe Cloud</span>
                  </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Booking;
