
import React, { useState, useMemo, useEffect } from 'react';
import { summarizeInquiry } from '../services/geminiService';
import { Appointment, WorkshopService, MembershipSignup } from '../types';

declare global {
  interface Window {
    Stripe?: any;
    emailjs?: any;
  }
}

/** 
 * Studio Configuration
 */
const EMAILJS_PUBLIC_KEY = 'LHrgkITA0L-J7QOE0'; 
const EMAILJS_SERVICE_ID = 'service_d2nl42u';   
const EMAILJS_TEMPLATE_CUSTOMER_ID = 'template_ttzwbm7'; 
const EMAILJS_TEMPLATE_STUDIO_ID = 'template_uxhva1n'; 
const STUDIO_OFFICIAL_EMAIL = 'contactcardetailing.pl@gmail.com';

const TIME_SLOTS = Array.from({ length: 12 }, (_, i) => {
  const startHour = 9 + i;
  const startStr = `${startHour.toString().padStart(2, '0')}:00`;
  const endStr = `${(startHour + 1).toString().padStart(2, '0')}:00`;
  const isLateNight = startHour >= 18;
  return {
    id: startStr,
    label: `${startStr} - ${endStr}`,
    time: `${startStr} - ${endStr}`,
    icon: startHour < 12 ? '🌅' : startHour < 18 ? '☀️' : '🌙',
    surcharge: isLateNight ? 50 : 0
  };
});

interface BookingProps {
  selectedServices: string[];
  serviceRegistry: WorkshopService[];
  appointments: Appointment[]; 
  onToggleService: (name: string) => void;
  onAddAppointment: (appt: Appointment) => void;
  member?: MembershipSignup | null;
}

type BookingStep = 'details' | 'schedule' | 'payment';

const Booking: React.FC<BookingProps> = ({ selectedServices, serviceRegistry, appointments, onToggleService, onAddAppointment, member }) => {
  const [step, setStep] = useState<BookingStep>('details');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  
  const [name, setName] = useState(member?.name || '');
  const [email, setEmail] = useState(member?.email || '');
  const [car, setCar] = useState('');
  const [notes, setNotes] = useState('');
  
  const [selectedDate, setSelectedDate] = useState<string>(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');

  useEffect(() => {
    if (window.emailjs && EMAILJS_PUBLIC_KEY) {
      window.emailjs.init(EMAILJS_PUBLIC_KEY);
    }
  }, []);

  useEffect(() => {
      setSelectedTimeSlot('');
  }, [selectedDate]);

  const priceCalculation = useMemo(() => {
    const parsePrice = (priceStr: string) => parseInt(priceStr.replace(/[^0-9]/g, '')) || 0;
    const matchedServices = serviceRegistry.filter(s => selectedServices.includes(s.name) && s.isVisible !== false);
    const items = matchedServices.map(s => ({ 
      name: s.name, 
      price: parsePrice(s.price),
      stripeUrl: s.stripeUrl
    }));
    
    const subtotalValue = items.reduce((acc, s) => acc + s.price, 0);
    const selectedSlot = TIME_SLOTS.find(t => t.id === selectedTimeSlot);
    const surchargeValue = selectedSlot?.surcharge || 0;

    // Platinum Discount Logic
    const isPlatinum = member?.tier.includes('Platinum');
    const discountAmount = isPlatinum ? Math.round(subtotalValue * 0.20) : 0;
    
    // Deposit is ALWAYS 20% of the ORIGINAL subtotal, regardless of discount
    const deposit = Math.round(subtotalValue * 0.20);
    
    // Total price reflects the discount and the surcharge
    const total = (subtotalValue - discountAmount) + surchargeValue;
    
    // Remaining balance to be paid at the studio
    const balance = total - deposit;
    
    const primaryCheckoutUrl = items.filter(i => i.stripeUrl).sort((a,b) => b.price - a.price)[0]?.stripeUrl || '';
    
    return { 
      lineItems: items, 
      surcharge: surchargeValue, 
      subtotal: subtotalValue,
      discount: discountAmount,
      totalPrice: total, 
      depositAmount: deposit, 
      remainingBalance: balance,
      primaryCheckoutUrl,
      isPlatinum
    };
  }, [selectedServices, serviceRegistry, selectedTimeSlot, member]);

  const { lineItems, surcharge, totalPrice, depositAmount, remainingBalance, primaryCheckoutUrl, discount, isPlatinum, subtotal } = priceCalculation;

  const sendConfirmationEmails = async (apptData: any) => {
    if (!window.emailjs) return false;

    const customerEmail = String(apptData.email || '').trim();
    if (!customerEmail) return false;

    const baseParams = {
      client_name: String(apptData.name),
      name: String(apptData.name),
      client_email: customerEmail,
      email: customerEmail,
      vehicle: String(apptData.car),
      car: String(apptData.car),
      date: String(apptData.date),
      time: String(apptData.slot),
      slot: String(apptData.slot),
      services: String(apptData.services.join(', ')),
      total_price: `${apptData.total} PLN`,
      deposit: `${apptData.amount} PLN`,
      notes: String(apptData.notes || 'No extra notes provided.')
    };

    try {
      await window.emailjs.send(
        EMAILJS_SERVICE_ID, 
        EMAILJS_TEMPLATE_CUSTOMER_ID, 
        { ...baseParams, to_email: customerEmail, reply_to: STUDIO_OFFICIAL_EMAIL },
        EMAILJS_PUBLIC_KEY
      );
      await window.emailjs.send(
        EMAILJS_SERVICE_ID, 
        EMAILJS_TEMPLATE_STUDIO_ID, 
        { ...baseParams, to_email: STUDIO_OFFICIAL_EMAIL, reply_to: customerEmail },
        EMAILJS_PUBLIC_KEY
      );
      return true;
    } catch (e: any) {
      console.error('Email Dispatch Error:', e);
      return false;
    }
  };

  const handleStripeCheckout = async () => {
    if (!primaryCheckoutUrl) {
      alert("Checkout link missing.");
      return;
    }

    setIsProcessing(true);
    setStatusMsg('Booking Your Slot...');

    const apptId = Math.random().toString(36).substr(2, 9);
    const selectedSlotInfo = TIME_SLOTS.find(t => t.id === selectedTimeSlot);
    
    const bookingSummary = {
        id: apptId,
        name: name, 
        email: email.trim(),
        car: car, 
        date: selectedDate, 
        slot: selectedSlotInfo?.label || 'Time TBD', 
        amount: depositAmount,
        total: totalPrice,
        services: lineItems.map(l => l.name),
        notes: notes
    };

    localStorage.setItem('cdpl_pending_appt_v1', apptId);
    localStorage.setItem('cdpl_last_booking_v1', JSON.stringify(bookingSummary));

    try {
      onAddAppointment({
        id: apptId,
        name, email: email.trim(), car, notes,
        services: lineItems.map(li => li.name),
        aiSummary: "Studio Booking: " + car,
        status: 'PENDING',
        scheduledDate: selectedDate,
        scheduledSlot: selectedTimeSlot,
        timestamp: Date.now(),
        isMemberBooking: !!member
      });

      setStatusMsg('Finalizing Emails...');
      await sendConfirmationEmails(bookingSummary);

      setStatusMsg('Redirecting to Stripe...');
      setTimeout(() => {
        window.location.href = primaryCheckoutUrl;
      }, 800);
    } catch (err: any) {
      setIsProcessing(false);
      alert("There was an issue processing the reservation.");
    }
  };

  const isSlotBooked = (slotId: string) => {
    return appointments.some(appt => 
        appt.scheduledDate === selectedDate && 
        appt.scheduledSlot === slotId &&
        appt.status !== 'COMPLETED'
    );
  };

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 1; i <= 14; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        days.push({ full: d.toISOString().split('T')[0], day: d.toLocaleDateString('en-US', { weekday: 'short' }), date: d.getDate() });
    }
    return days;
  }, []);

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
        <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-32">
           <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
              {isPlatinum && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[8px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl">
                  Platinum Member Rates
                </div>
              )}
              
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
                 
                 {isPlatinum && discount > 0 && (
                    <div className="flex items-center justify-between bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 animate-in slide-in-from-left-2">
                       <span className="text-xs font-bold text-blue-400 uppercase tracking-tight">Platinum Benefit (20%)</span>
                       <span className="text-xs font-mono text-blue-400">-{discount} PLN</span>
                    </div>
                 )}

                 {surcharge > 0 && (
                    <div className="flex items-center justify-between bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
                       <span className="text-xs font-bold text-amber-500 uppercase tracking-tight">Late Night Fee</span>
                       <span className="text-xs font-mono text-amber-500">+{surcharge} PLN</span>
                    </div>
                 )}
              </div>
              <div className="pt-8 mt-6 border-t border-white/5 space-y-4">
                 <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Investment</span>
                    </div>
                    <span className="text-2xl font-display font-bold text-white">{totalPrice} PLN</span>
                 </div>
                 
                 <div className="flex justify-between items-center p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Initial Deposit</span>
                      <span className="text-[7px] text-slate-500 uppercase tracking-widest">Standard 20% Reservation Fee</span>
                    </div>
                    <span className="text-xl font-display font-bold text-emerald-400">{depositAmount} PLN</span>
                 </div>

                 <div className="flex justify-between items-center px-4">
                    <div className="flex flex-col text-right w-full">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Due at Studio</span>
                      <span className="text-lg font-display font-bold text-slate-300">{remainingBalance} PLN</span>
                      {isPlatinum && (
                        <span className="text-[8px] font-bold text-blue-500 uppercase tracking-widest mt-1 italic">
                          * Your 20% discount is applied to this balance
                        </span>
                      )}
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-7 relative flex flex-col bg-slate-900/30 p-8 md:p-12 rounded-[2.5rem] border border-white/5 shadow-2xl min-h-[500px]">
          {isProcessing && (
            <div className="absolute inset-0 z-50 bg-[#05070a]/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center rounded-[2.5rem] border border-blue-500/20 animate-in fade-in duration-300">
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
                      <div className="md:col-span-2 space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Additional Notes</label>
                          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-white text-sm outline-none focus:border-blue-500 h-24" placeholder="Any special requests..." />
                      </div>
                  </div>
                  <div className="flex justify-end pt-4">
                      <button onClick={() => setStep('schedule')} disabled={!name || !email || !car} className="px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase tracking-widest text-[11px] disabled:opacity-50 transition-all">Next: Schedule →</button>
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
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Available Slots</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                          {TIME_SLOTS.map((slot) => {
                              const booked = isSlotBooked(slot.id);
                              return (
                                <button key={slot.id} disabled={booked} onClick={() => setSelectedTimeSlot(slot.id)} className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${booked ? 'bg-black/20 border-white/5 opacity-40 cursor-not-allowed' : selectedTimeSlot === slot.id ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-black/40 border-white/5 text-slate-400 hover:border-white/20'}`}>
                                    <span className="text-lg">{booked ? '🔒' : slot.icon}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-tight">{slot.id}</span>
                                </button>
                              );
                          })}
                      </div>
                  </div>
                  <div className="flex justify-between pt-4">
                      <button onClick={() => setStep('details')} className="px-8 py-5 bg-white/5 text-slate-400 rounded-xl font-bold uppercase tracking-widest text-[11px] hover:bg-white/10 transition-all">Back</button>
                      <button onClick={() => setStep('payment')} disabled={!selectedTimeSlot} className="px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase tracking-widest text-[11px] transition-all disabled:opacity-50">Next: Review →</button>
                  </div>
              </div>
          )}

          {step === 'payment' && (
              <div className="space-y-10 animate-in slide-in-from-right-4">
                  <div className="text-center py-6">
                      <h3 className="text-2xl font-display font-bold text-white uppercase tracking-tight mb-4">Confirm Selection</h3>
                      <p className="text-slate-400 text-sm max-w-sm mx-auto mb-8">
                        Ready to finalize reservation for your <span className="text-white font-bold">{car}</span>.
                      </p>
                  </div>

                  <div className="bg-black/40 p-8 rounded-[2.5rem] border border-white/5 space-y-6 relative overflow-hidden">
                      {isPlatinum && (
                         <div className="absolute inset-0 bg-blue-500/5 pointer-events-none"></div>
                      )}
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                        <span className="text-slate-500">Date & Time</span>
                        <span className="text-white">{selectedDate} @ {selectedTimeSlot}</span>
                      </div>
                      <div className="h-[1px] w-full bg-white/5"></div>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">Deposit Authorized</span>
                          {isPlatinum && <span className="text-[8px] font-bold text-blue-500 uppercase tracking-[0.2em] mt-1">Standard 20% Reservation</span>}
                        </div>
                        <span className="text-2xl font-display font-bold text-white">{depositAmount} PLN</span>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Balance Due later</span>
                        <span className="text-lg font-display font-bold text-slate-300">{remainingBalance} PLN</span>
                      </div>
                  </div>

                  <div className="flex flex-col gap-6 pt-4">
                      <button onClick={handleStripeCheckout} className="w-full py-6 rounded-2xl font-bold uppercase tracking-[0.3em] text-[12px] bg-blue-600 hover:bg-blue-500 text-white shadow-2xl shadow-blue-500/20 transition-all flex items-center justify-center gap-4 group">
                        Secure Booking & Pay Deposit
                      </button>
                      <button onClick={() => setStep('schedule')} className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors text-center">Back</button>
                  </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Booking;
