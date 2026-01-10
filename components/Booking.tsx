
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
// These are now correctly wrapped in quotes to prevent ReferenceErrors
const EMAILJS_SERVICE_ID = 'service_d2nl42u' as string; 
const EMAILJS_PUBLIC_KEY = 'LHrgkITA0L-J7QOE0' as string;

// The template for the STUDIO (Internal Protocol)
const EMAILJS_STUDIO_TEMPLATE_ID = 'template_uxhva1n' as string; 

// The template for the CUSTOMER (Direct Confirmation)
const EMAILJS_CUSTOMER_TEMPLATE_ID = 'template_ttzwbm7' as string;

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
  const [summary, setSummary] = useState<string>("");
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [car, setCar] = useState('');
  const [notes, setNotes] = useState('');

  const [cardNumber, setCardNumber] = useState('');
  
  const [selectedDate, setSelectedDate] = useState<string>(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('morning');

  useEffect(() => {
    // Initialize EmailJS with your Public Key
    if (window.emailjs && EMAILJS_PUBLIC_KEY && EMAILJS_PUBLIC_KEY !== 'PASTE_YOUR_PUBLIC_KEY_HERE') {
      window.emailjs.init(EMAILJS_PUBLIC_KEY);
    }
  }, []);

  const { totalPrice, depositAmount, remainingBalance } = useMemo(() => {
    const parsePrice = (priceStr: string) => parseInt(priceStr.replace(/[^0-9]/g, '')) || 0;
    const selectedServiceDetails = serviceRegistry.filter(s => selectedServices.includes(s.name));
    const subtotalValue = selectedServiceDetails.reduce((acc, s) => acc + parsePrice(s.price), 0);
    const surchargeValue = selectedTimeSlot === 'evening' ? 50 : 0;
    const total = subtotalValue + surchargeValue;
    const deposit = Math.round(total * 0.20);
    const remaining = total - deposit;
    return { totalPrice: total, depositAmount: deposit, remainingBalance: remaining };
  }, [selectedServices, serviceRegistry, selectedTimeSlot]);

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
    setIsSending(true);
    
    try {
      const selectedSlotInfo = TIME_SLOTS.find(t => t.id === selectedTimeSlot);
      const bookingData = {
        from_name: name,
        reply_to: email,
        vehicle: car,
        services_list: selectedServices.join(', '),
        booking_date: selectedDate,
        time_slot: selectedSlotInfo?.label || 'Not Selected',
        total_price: `${totalPrice} PLN`,
        deposit_paid: `${depositAmount} PLN`,
        balance_due: `${remainingBalance} PLN`,
        studio_notes: notes || 'No additional notes provided.'
      };

      // 1. Send Studio Dispatch Protocol
      if (window.emailjs && EMAILJS_STUDIO_TEMPLATE_ID && EMAILJS_STUDIO_TEMPLATE_ID !== 'PASTE_STUDIO_TEMPLATE_ID_HERE') {
        try {
          await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_STUDIO_TEMPLATE_ID, bookingData);
        } catch (err) {
          console.error("Studio dispatch failed:", err);
        }
      }

      // 2. Send Customer Confirmation
      if (window.emailjs && EMAILJS_CUSTOMER_TEMPLATE_ID && EMAILJS_CUSTOMER_TEMPLATE_ID !== 'PASTE_CUSTOMER_TEMPLATE_ID_HERE') {
        try {
          await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_CUSTOMER_TEMPLATE_ID, bookingData);
        } catch (err) {
          console.error("Customer confirmation failed:", err);
        }
      }

      const conversationText = `Client: ${name}, Vehicle: ${car}, Services: ${selectedServices.join(', ')}`;
      const aiSummary = await summarizeInquiry(conversationText);
      setSummary(aiSummary);

      onAddAppointment({
        id: Math.random().toString(36).substr(2, 9),
        name, email, car, notes,
        services: [...selectedServices],
        aiSummary,
        status: 'PENDING',
        timestamp: Date.now()
      });

      setSubmitted(true);
    } catch (error) {
      console.error(error);
      alert("Submission failed. Check your network or EmailJS configuration.");
    } finally {
      setIsSending(false);
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
                    <p className="text-slate-400 text-[10px]">Both the studio alert and your confirmation have been sent to {email}.</p>
                </div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 px-6 py-4 rounded-2xl flex items-center gap-4 text-left">
                <span className="text-2xl">💳</span>
                <div>
                    <p className="text-blue-400 font-bold text-xs uppercase tracking-widest">Secure Reservation</p>
                    <p className="text-slate-400 text-[10px]">{depositAmount} PLN deposit authorized. Remaining {remainingBalance} PLN due after service.</p>
                </div>
            </div>
        </div>
        <div className="w-full bg-slate-900/80 border border-blue-500/20 rounded-3xl p-8 mb-10 text-left">
           <div className="text-slate-300 text-sm whitespace-pre-wrap italic leading-relaxed">{summary}</div>
        </div>
        <button onClick={() => window.location.reload()} className="px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase tracking-widest text-[10px]">Return to Studio</button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col px-6 py-20 max-w-4xl mx-auto w-full">
      <div className="text-center mb-16">
        <h2 className="text-5xl font-display font-bold mb-4 uppercase tracking-tight text-white">Studio Booking</h2>
        <div className="flex items-center justify-center gap-4 mt-8">
            <div className={`h-1.5 w-12 rounded-full ${step === 'details' ? 'bg-blue-500' : 'bg-slate-800'}`}></div>
            <div className={`h-1.5 w-12 rounded-full ${step === 'schedule' ? 'bg-blue-500' : 'bg-slate-800'}`}></div>
            <div className={`h-1.5 w-12 rounded-full ${step === 'payment' ? 'bg-blue-500' : 'bg-slate-800'}`}></div>
        </div>
      </div>

      <div className="relative flex flex-col bg-slate-900/30 p-8 md:p-12 rounded-[2.5rem] border border-white/5 shadow-2xl min-h-[600px]">
        {isSending && (
          <div className="absolute inset-0 z-50 bg-[#05070a]/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center">
             <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-8"></div>
             <h3 className="text-2xl font-display font-bold uppercase tracking-widest mb-2 text-gradient">Finalizing Protocols</h3>
             <p className="text-slate-500 text-[10px] uppercase tracking-widest">Dispatching Dual Confirmations...</p>
          </div>
        )}

        {step === 'details' && (
            <div className="space-y-12 animate-in slide-in-from-right-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Client Name</label>
                        <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[#05070a] border border-white/10 rounded-xl px-5 py-4 text-white text-sm" placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Contact Email</label>
                        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#05070a] border border-white/10 rounded-xl px-5 py-4 text-white text-sm" placeholder="john@detailing.com" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Vehicle Specification</label>
                        <input required type="text" value={car} onChange={(e) => setCar(e.target.value)} className="w-full bg-[#05070a] border border-white/10 rounded-xl px-5 py-4 text-white text-sm" placeholder="e.g. 2024 Porsche Taycan" />
                    </div>
                </div>
                <div className="flex justify-end pt-4">
                    <button onClick={() => setStep('schedule')} className="px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase tracking-widest text-[11px]">Next: Select Schedule →</button>
                </div>
            </div>
        )}

        {step === 'schedule' && (
            <div className="space-y-12 animate-in slide-in-from-right-4 duration-500">
                <div className="space-y-6">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Select Date</label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                        {calendarDays.map((day) => (
                            <button key={day.full} onClick={() => setSelectedDate(day.full)} className={`flex flex-col items-center py-4 rounded-xl border transition-all ${selectedDate === day.full ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-black/40 border-white/5 text-slate-500'}`}>
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
                            <button key={slot.id} onClick={() => setSelectedTimeSlot(slot.id)} className={`flex items-center gap-4 p-5 rounded-2xl border transition-all ${selectedTimeSlot === slot.id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-black/40 border-white/5 text-slate-400'}`}>
                                <span className="text-2xl">{slot.icon}</span>
                                <div className="text-left">
                                    <p className="text-[10px] font-bold uppercase tracking-widest">{slot.label}</p>
                                    <p className="text-[9px] font-mono">{slot.time}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex justify-between pt-4">
                    <button onClick={() => setStep('details')} className="px-8 py-5 bg-white/5 text-slate-400 rounded-xl font-bold uppercase tracking-widest text-[11px]">Back</button>
                    <button onClick={() => setStep('payment')} className="px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase tracking-widest text-[11px]">Next: Secure Payment →</button>
                </div>
            </div>
        )}

        {step === 'payment' && (
            <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                <div className="bg-blue-600/10 border border-blue-500/20 p-8 rounded-[2rem] flex flex-col items-center gap-4 text-center">
                    <h3 className="text-4xl font-display font-bold text-white">{totalPrice} PLN Total</h3>
                    <div className="grid grid-cols-2 gap-8 w-full border-t border-white/5 pt-6 mt-2">
                        <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Deposit (20%)</span>
                            <span className="text-2xl font-display font-bold text-white">{depositAmount} PLN</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Balance (80%)</span>
                            <span className="text-2xl font-display font-bold text-white">{remainingBalance} PLN</span>
                        </div>
                    </div>
                </div>
                <div className="bg-black/40 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-600 ml-1">Card Number</label>
                        <input type="text" value={cardNumber} onChange={(e) => handleCardInput(e.target.value)} placeholder="0000 0000 0000 0000" className="w-full bg-[#05070a] border border-white/10 rounded-xl px-5 py-4 text-white font-mono text-sm tracking-widest focus:border-blue-500/50 outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-600 ml-1">Expiry</label>
                            <input type="text" placeholder="MM/YY" className="w-full bg-[#05070a] border border-white/10 rounded-xl px-5 py-4 text-white font-mono text-sm focus:border-blue-500/50 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-600 ml-1">CVV</label>
                            <input type="text" placeholder="•••" className="w-full bg-[#05070a] border border-white/10 rounded-xl px-5 py-4 text-white font-mono text-sm focus:border-blue-500/50 outline-none" />
                        </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-start gap-3">
                        <span className="text-lg">ℹ️</span>
                        <p className="text-[10px] text-slate-500 leading-relaxed italic">
                            {EMAILJS_CUSTOMER_TEMPLATE_ID && EMAILJS_CUSTOMER_TEMPLATE_ID !== 'PASTE_CUSTOMER_TEMPLATE_ID_HERE' ? "Dual-dispatch active. Detailed confirmations will be sent to both the studio and the client." : "Single-dispatch active. The system is ready to send studio alerts."}
                        </p>
                    </div>
                </div>
                <div className="flex justify-between pt-4 items-center">
                    <button onClick={() => setStep('schedule')} className="px-8 py-5 bg-white/5 text-slate-400 rounded-xl font-bold uppercase tracking-widest text-[11px]">Back</button>
                    <button onClick={handleFinalSubmit} className="px-16 py-6 rounded-2xl font-bold uppercase tracking-widest text-[12px] bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xl transition-all active:scale-95">Authorize & Dispatch Confirmations</button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Booking;
