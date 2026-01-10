
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

    if (!email) {
      alert("Contact email is required for confirmation.");
      return;
    }

    setIsSending(true);
    setStatusMsg('Authorizing Security Deposit...');
    
    try {
      const selectedSlotInfo = TIME_SLOTS.find(t => t.id === selectedTimeSlot);
      
      // Shared context for both emails
      const bookingContext = {
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

      // 1. DATA FOR THE STUDIO (You)
      const studioPayload = {
        ...bookingContext,
        to_email: STUDIO_EMAIL,    // This goes to your inbox
        recipient: STUDIO_EMAIL,
        reply_to: email,           // So you can reply to the customer's email
        customer_email: email,     // For your reference in the body
      };

      // 2. DATA FOR THE CLIENT (Customer)
      const customerPayload = {
        ...bookingContext,
        to_email: email,           // This MUST go to the customer's inbox
        recipient: email,
        reply_to: STUDIO_EMAIL,    // So they can reply to your studio
      };

      if (!window.emailjs) throw new Error("EmailJS SDK not loaded");

      // CALL 1: Notify Studio
      setStatusMsg('Dispatching Studio Protocol...');
      await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_STUDIO_TEMPLATE_ID, studioPayload);
      
      // CALL 2: Notify Customer
      setStatusMsg('Sending Client Confirmation...');
      if (EMAILJS_CUSTOMER_TEMPLATE_ID) {
        await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_CUSTOMER_TEMPLATE_ID, customerPayload);
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
        name, email, car, notes,
        services: [...selectedServices],
        aiSummary,
        status: 'PENDING',
        timestamp: Date.now()
      });

      setStatusMsg('Success.');
      setSubmitted(true);
    } catch (error: any) {
      console.error("Booking Dispatch Error:", error);
      let displayError = error?.text || error?.message || JSON.stringify(error);
      alert(`Submission Failed!\n\nReason: ${displayError}\n\nIMPORTANT: Please check your EmailJS dashboard. Ensure the 'To Email' field in your Customer Template is set to {{to_email}} and NOT your own email address.`);
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
        
        {/* Sidebar Manifest */}
        <div className="lg:col-span-5 space-y-8 animate-in slide-in-from-left-4 duration-700 lg:sticky lg:top-32">
           <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 space-y-8 shadow-2xl">
              <div className="flex items-center justify-between pb-6 border-b border-white/5">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-lg">📋</div>
                    <h4 className="text-xl font-display font-bold text-white uppercase tracking-tight">Booking Manifest</h4>
                 </div>
                 <div className="flex items-center gap-1.5 bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/20">
                    <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse"></span>
                    <span className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">Live Sync</span>
                 </div>
              </div>

              <div className="space-y-4">
                 <label className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] block mb-2">Selected Programs</label>
                 {selectedServices.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-white/10 text-center">
                        <p className="text-xs text-slate-600 italic">No services selected in registry.</p>
                    </div>
                 ) : (
                    <div className="space-y-2">
                       {selectedServices.map((service, i) => (
                          <div key={i} className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5 group">
                             <div className="flex items-center gap-3">
                                <span className="text-blue-500">•</span>
                                <span className="text-xs font-bold text-slate-300 uppercase tracking-tight">{service}</span>
                             </div>
                             <button onClick={() => onToggleService(service)} className="text-slate-600 hover:text-rose-500 text-xs transition-colors p-1">✕</button>
                          </div>
                       ))}
                    </div>
                 )}
              </div>

              {(name || car || selectedDate) && (
                <div className="space-y-4 pt-4 border-t border-white/5">
                   <label className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] block mb-2">Registration Summary</label>
                   <div className="grid grid-cols-1 gap-3">
                      {name && (
                        <div className="flex justify-between text-[10px] uppercase tracking-widest">
                           <span className="text-slate-600">Client:</span>
                           <span className="text-slate-400 font-bold">{name}</span>
                        </div>
                      )}
                      {car && (
                        <div className="flex justify-between text-[10px] uppercase tracking-widest">
                           <span className="text-slate-600">Vehicle:</span>
                           <span className="text-slate-400 font-bold">{car}</span>
                        </div>
                      )}
                      {step !== 'details' && (
                        <div className="flex justify-between text-[10px] uppercase tracking-widest text-blue-400">
                           <span className="text-slate-600">Schedule:</span>
                           <span className="font-bold">{new Date(selectedDate).toLocaleDateString('en-PL', { day: 'numeric', month: 'short' })} • {TIME_SLOTS.find(t => t.id === selectedTimeSlot)?.label}</span>
                        </div>
                      )}
                   </div>
                </div>
              )}

              <div className="pt-6">
                 <div className="bg-blue-600/10 p-5 rounded-2xl border border-blue-500/20 text-center">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Current Total Estimate</p>
                    <p className="text-2xl font-display font-bold text-white">{totalPrice} PLN</p>
                 </div>
              </div>
           </div>

           <div className="bg-black/20 border border-white/5 rounded-3xl p-6 italic">
              <p className="text-[10px] text-slate-500 leading-relaxed">
                 * Final inspection in our Poznań studio may adjust pricing based on actual paint condition. Deposit is fully refundable up to 48 hours before scheduled intake.
              </p>
           </div>
        </div>

        {/* Main Form Area */}
        <div className="lg:col-span-7 relative flex flex-col bg-slate-900/30 p-8 md:p-12 rounded-[2.5rem] border border-white/5 shadow-2xl min-h-[600px]">
          {isSending && (
            <div className="absolute inset-0 z-50 bg-[#05070a]/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center rounded-[2.5rem] border border-blue-500/20">
               <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-8"></div>
               <h3 className="text-2xl font-display font-bold uppercase tracking-widest mb-2 text-gradient">Processing Booking</h3>
               <p className="text-slate-500 text-[10px] uppercase tracking-widest animate-pulse">{statusMsg}</p>
            </div>
          )}

          {step === 'details' && (
              <div className="space-y-12 animate-in slide-in-from-right-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Client Name</label>
                          <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-white text-sm focus:border-blue-500/50 outline-none" placeholder="John Doe" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Contact Email</label>
                          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-white text-sm focus:border-blue-500/50 outline-none" placeholder="john@detailing.com" />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Vehicle Specification</label>
                          <input required type="text" value={car} onChange={(e) => setCar(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-white text-sm focus:border-blue-500/50 outline-none" placeholder="e.g. 2024 Porsche Taycan" />
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
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Select Date</label>
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
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Preferred Time Slot</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {TIME_SLOTS.map((slot) => (
                              <button key={slot.id} onClick={() => setSelectedTimeSlot(slot.id)} className={`flex items-center gap-4 p-5 rounded-2xl border transition-all ${selectedTimeSlot === slot.id ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-black/40 border-white/5 text-slate-400 hover:border-white/20'}`}>
                                  <span className="text-2xl">{slot.icon}</span>
                                  <div className="text-left">
                                      <p className="text-[10px] font-bold uppercase tracking-wid