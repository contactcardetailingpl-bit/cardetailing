import React, { useState, useMemo, useEffect } from 'react';
import { summarizeInquiry } from '../services/geminiService';
import { Appointment, WorkshopService } from '../types';

declare global {
  interface Window {
    Stripe?: any;
    emailjs?: any;
  }
}

// --- EMAILJS CONFIGURATION ---
const EMAILJS_SERVICE_ID = 'service_d2nl42u'; 
const EMAILJS_PUBLIC_KEY = 'LHrgkITA0L-J7QOE0';
const EMAILJS_STUDIO_TEMPLATE_ID = 'template_uxhva1n'; 
const EMAILJS_CUSTOMER_TEMPLATE_ID = 'template_ttzwbm7';

// The email address where you (the studio) want to receive booking notifications
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
  const [isSending, setIsSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [summary, setSummary] = useState<string>("Initializing restoration protocol...");
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [car, setCar] = useState('');
  const [notes, setNotes] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  
  const [selectedDate, setSelectedDate] = useState<string>(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('morning');

  useEffect(() => {
    // Attempt to initialize EmailJS immediately if available
    if (window.emailjs && EMAILJS_PUBLIC_KEY) {
      window.emailjs.init(EMAILJS_PUBLIC_KEY);
    }
  }, []);

  const priceCalculation = useMemo(() => {
    const parsePrice = (priceStr: string) => parseInt(priceStr.replace(/[^0-9]/g, '')) || 0;
    const items = serviceRegistry
      .filter(s => selectedServices.includes(s.name))
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
        days.push({ full: d.toISOString().split('T')[0], day: d.toLocaleDateString('en-US', { weekday: 'short' }), date: d.getDate() });
    }
    return days;
  }, []);

  const handleFinalSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isSending) return;

    const targetEmail = email.trim();
    if (!targetEmail) {
      alert("Contact email is required for confirmation.");
      return;
    }

    setIsSending(true);
    setStatusMsg('Authorizing Security Deposit...');
    
    try {
      const selectedSlotInfo = TIME_SLOTS.find(t => t.id === selectedTimeSlot);
      
      const sharedContext = {
        from_name: name,
        customer_name: name,
        vehicle: car,
        services_list: selectedServices.join(', '),
        booking_date: selectedDate,
        time_slot: selectedSlotInfo?.label || 'Not Selected',
        total_price: `${totalPrice} PLN`,
        deposit_paid: `${depositAmount} PLN`,
        balance_due: `${remainingBalance} PLN`,
        studio_notes: notes || 'No additional notes provided.'
      };

      // Payload for YOU (Studio)
      // Including every possible email key to satisfy whatever is in your template dashboard
      const studioPayload = {
        ...sharedContext,
        to_email: STUDIO_EMAIL,
        email_to: STUDIO_EMAIL,
        recipient: STUDIO_EMAIL,
        email: STUDIO_EMAIL,
        user_email: STUDIO_EMAIL,
        reply_to: targetEmail,
        customer_email: targetEmail
      };

      // Payload for CLIENT
      // Including every possible email key to satisfy whatever is in your template dashboard
      const customerPayload = {
        ...sharedContext,
        to_email: targetEmail,
        email_to: targetEmail,
        recipient: targetEmail,
        email: targetEmail,
        user_email: targetEmail,
        reply_to: STUDIO_EMAIL
      };

      if (!window.emailjs) throw new Error("EmailJS SDK not found. Check internet connection.");

      // 1. Notify Studio (YOU)
      setStatusMsg('Dispatching Studio Protocol...');
      await window.emailjs.send(
        EMAILJS_SERVICE_ID, 
        EMAILJS_STUDIO_TEMPLATE_ID, 
        studioPayload, 
        EMAILJS_PUBLIC_KEY
      );
      
      // 2. Notify Customer (CLIENT)
      // We wrap this in a separate try/catch so that even if the client's email fails, the process continues
      setStatusMsg('Sending Client Confirmation...');
      if (EMAILJS_CUSTOMER_TEMPLATE_ID) {
        try {
          await window.emailjs.send(
            EMAILJS_SERVICE_ID, 
            EMAILJS_CUSTOMER_TEMPLATE_ID, 
            customerPayload, 
            EMAILJS_PUBLIC_KEY
          );
        } catch (custErr) {
          console.warn("Client email failed, but studio notification was successful.", custErr);
        }
      }

      // AI Summary Generation
      setStatusMsg('Generating Detailing Strategy...');
      let aiSummary = "Restore paint depth, apply ceramic protection, and sanitize interior cabin.";
      try {
        const conversationText = `Client: ${name}, Vehicle: ${car}, Services: ${selectedServices.join(', ')}`;
        aiSummary = await summarizeInquiry(conversationText);
      } catch (aiErr) {
        console.warn("AI Summarization failed, using default.", aiErr);
      }
      setSummary(aiSummary);

      onAddAppointment({
        id: Math.random().toString(36).substr(2, 9),
        name, email: targetEmail, car, notes,
        services: [...selectedServices],
        aiSummary,
        status: 'PENDING',
        timestamp: Date.now()
      });

      setStatusMsg('Success.');
      setSubmitted(true);
    } catch (error: any) {
      console.error("Critical Booking Error:", error);
      let displayError = error?.text || error?.message || "Unknown communication error.";
      alert(`Submission Failed!\n\nReason: ${displayError}\n\nPlease check your EmailJS Template "To Email" settings.`);
    } finally {
      setIsSending(false);
      setStatusMsg('');
    }
  };

  const handleCardInput = (val: string) => {
    const cleaned = val.replace(/\s/g, '').replace(/[^0-9]/g, '').slice(0, 16);
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    setCardNumber(formatted);
  };

  if (submitted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-500 max-w-2xl mx-auto">
        <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-4xl mb-8 shadow-2xl shadow-blue-500/40 animate-bounce">✓</div>
        <h2 className="text-4xl font-display font-bold mb-4 uppercase tracking-tight text-white">Booking Confirmed</h2>
        <div className="flex flex-col gap-4 mb-8 w-full">
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-4 rounded-2xl flex items-center gap-4 text-left">
                <span className="text-2xl">📧</span>
                <div>
                    <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest">Protocols Dispatched</p>
                    <p className="text-slate-400 text-[10px]">Confirmation protocol and receipt sent to {email}.</p>
                </div>
            </div>
        </div>
        <div className="w-full bg-slate-900/80 border border-blue-500/20 rounded-3xl p-8 mb-10 text-left">
           <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-4">
              <span className="text-blue-500 font-bold text-[10px] uppercase tracking-widest">Restoration Strategy</span>
           </div>
           <div className="text-slate-300 text-sm whitespace-pre-wrap italic leading-relaxed">{summary}</div>
        </div>
        <button onClick={() => window.location.reload()} className="px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase tracking-widest text-[10px]">Return to Studio</button>
      </div>
    );
  }

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
        <div className="lg:col-span-5 space-y-8 animate-in slide-in-from-left-4 duration-700 lg:sticky lg:top-32">
           <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 space-y-8 shadow-2xl">
              <div className="flex items-center justify-between pb-6 border-b border-white/5">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-lg">📋</div>
                    <h4 className="text-xl font-display font-bold text-white uppercase tracking-tight">Booking Manifest</h4>
                 </div>
              </div>
              <div className="space-y-4">
                 <label className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] block mb-2">Selected Programs</label>
                 {selectedServices.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-white/10 text-center">
                        <p className="text-xs text-slate-600 italic">No services selected.</p>
                    </div>
                 ) : (
                    <div className="space-y-2">
                       {selectedServices.map((service, i) => (
                          <div key={i} className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5 group">
                             <span className="text-xs font-bold text-slate-300 uppercase tracking-tight">{service}</span>
                             <button onClick={() => onToggleService(service)} className="text-slate-600 hover:text-rose-500 text-xs">✕</button>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
              <div className="pt-6">
                 <div className="bg-blue-600/10 p-5 rounded-2xl border border-blue-500/20 text-center">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Current Total Estimate</p>
                    <p className="text-2xl font-display font-bold text-white">{totalPrice} PLN</p>
                 </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-7 relative flex flex-col bg-slate-900/30 p-8 md:p-12 rounded-[2.5rem] border border-white/5 shadow-2xl min-h-[600px]">
          {isSending && (
            <div className="absolute inset-0 z-50 bg-[#05070a]/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center rounded-[2.5rem] border border-blue-500/20">
               <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-8"></div>
               <p className="text-slate-500 text-[10px] uppercase tracking-widest animate-pulse">{statusMsg}</p>
            </div>
          )}

          {step === 'details' && (
              <div className="space-y-12 animate-in slide-in-from-right-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Client Name</label>
                          <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-white text-sm outline-none" placeholder="John Doe" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Contact Email</label>
                          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-white text-sm outline-none" placeholder="john@email.com" />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Vehicle Specification</label>
                          <input required type="text" value={car} onChange={(e) => setCar(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-white text-sm outline-none" placeholder="e.g. 2024 Porsche Taycan" />
                      </div>
                  </div>
                  <div className="flex justify-end pt-4">
                      <button onClick={() => setStep('schedule')} disabled={!name || !email || !car} className="px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase tracking-widest text-[11px] disabled:opacity-50 transition-all">Next: Select Schedule →</button>
                  </div>
              </div>
          )}

          {step === 'schedule' && (
              <div className="space-y-12 animate-in slide-in-from-right-4 duration-500">
                  <div className="space-y-6">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Select Date</label>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                          {calendarDays.map((day) => (
                              <button key={day.full} onClick={() => setSelectedDate(day.full)} className={`flex flex-col items-center py-4 rounded-xl border transition-all ${selectedDate === day.full ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-black/40 border-white/5 text-slate-500 hover:border-white/20'}`}>
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
                      <button onClick={() => setStep('payment')} className="px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase tracking-widest text-[11px] transition-all">Next: Secure Payment →</button>
                  </div>
              </div>
          )}

          {step === 'payment' && (
              <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                  <div className="bg-blue-600/5 border border-blue-500/20 p-8 rounded-3xl">
                      <div className="flex flex-col gap-6">
                          <div className="flex justify-between items-end border-b border-white/5 pb-4">
                              <h3 className="text-xl font-display font-bold text-white uppercase tracking-tight">Price Breakdown</h3>
                              <span className="text-[9px] font-mono text-blue-400 uppercase tracking-widest">#BK-{Math.floor(Math.random() * 9000 + 1000)}</span>
                          </div>
                          <div className="space-y-3">
                              {lineItems.map((item, idx) => (
                                  <div key={idx} className="flex justify-between text-sm">
                                      <span className="text-slate-400">{item.name}</span>
                                      <span className="text-white font-mono">{item.price} PLN</span>
                                  </div>
                              ))}
                              {surcharge > 0 && (
                                  <div className="flex justify-between text-sm text-blue-400 font-bold">
                                      <span>{surchargeLabel} Surcharge</span>
                                      <span className="font-mono">+{surcharge} PLN</span>
                                  </div>
                              )}
                          </div>
                          <div className="border-t border-dashed border-white/10 pt-4 flex justify-between items-center">
                              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Total Studio Investment</span>
                              <span className="text-2xl font-display font-bold text-white">{totalPrice} PLN</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl text-center">
                                  <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Due Now (Deposit)</p>
                                  <p className="text-3xl font-display font-bold text-white font-mono">{depositAmount} <span className="text-sm">PLN</span></p>
                              </div>
                              <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-2xl text-center">
                                  <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-1">Due on Completion</p>
                                  <p className="text-3xl font-display font-bold text-white font-mono">{remainingBalance} <span className="text-sm">PLN</span></p>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="bg-black/40 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                      <div className="space-y-2">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Card Number</label>
                          <input type="text" value={cardNumber} onChange={(e) => handleCardInput(e.target.value)} placeholder="0000 0000 0000 0000" className="w-full bg-[#05070a] border border-white/10 rounded-xl px-5 py-4 text-white font-mono text-sm tracking-widest outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Expiry</label>
                              <input type="text" placeholder="MM/YY" className="w-full bg-[#05070a] border border-white/10 rounded-xl px-5 py-4 text-white font-mono text-sm outline-none" />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-600">CVV</label>
                              <input type="text" placeholder="•••" className="w-full bg-[#05070a] border border-white/10 rounded-xl px-5 py-4 text-white font-mono text-sm outline-none" />
                          </div>
                      </div>
                  </div>
                  <div className="flex justify-between pt-4 items-center">
                      <button onClick={() => setStep('schedule')} className="px-8 py-5 bg-white/5 text-slate-400 rounded-xl font-bold uppercase tracking-widest text-[11px] hover:bg-white/10 transition-all">Back</button>
                      <button onClick={handleFinalSubmit} disabled={isSending || !cardNumber} className="px-16 py-6 rounded-2xl font-bold uppercase tracking-widest text-[12px] bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xl transition-all disabled:opacity-50">
                        {isSending ? "Authorizing..." : `Authorize ${depositAmount} PLN Deposit`}
                      </button>
                  </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Booking;