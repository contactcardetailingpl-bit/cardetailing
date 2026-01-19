
import React, { useState, useMemo } from 'react';
import { MembershipSignup, Appointment, ViewMode } from '../types';

interface MemberPortalProps {
  member: MembershipSignup | null;
  onLogout: () => void;
  appointments: Appointment[];
  onAddAppointment: (a: Appointment) => void;
  onNavigate: (v: ViewMode) => void;
}

const TIME_SLOTS = Array.from({ length: 12 }, (_, i) => {
  const hour = 9 + i;
  return `${hour.toString().padStart(2, '0')}:00`;
});

const MemberPortal: React.FC<MemberPortalProps> = ({ member, onLogout, appointments, onAddAppointment, onNavigate }) => {
  const [step, setStep] = useState<'dash' | 'book'>('dash');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [carModel, setCarModel] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!member) return null;

  const isPlatinum = member.tier.includes('Platinum');
  const isGold = member.tier.includes('Gold');
  const isSilver = member.tier.includes('Silver');

  const entitledServices = useMemo(() => {
    const list = ['Maintenance Wash (Included)'];
    if (isGold || isPlatinum) list.push('Deep Interior Clean (Monthly Benefit)');
    return list;
  }, [isGold, isPlatinum]);

  const tierColor = isPlatinum ? 'blue' : isGold ? 'amber' : 'slate';

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

  const toggleServiceSelection = (service: string) => {
    setSelectedServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service) 
        : [...prev, service]
    );
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || selectedServices.length === 0 || !carModel) return;

    setIsProcessing(true);
    const apptId = Math.random().toString(36).substr(2, 9);
    
    const newAppt: Appointment = {
      id: apptId,
      name: member.name,
      email: member.email,
      car: carModel,
      notes: `[MEMBER BOOKING] Tier: ${member.tier}. Combined services requested.`,
      services: selectedServices,
      aiSummary: `Member Program Booking for ${member.name}. Combined included treatments.`,
      status: 'CONFIRMED',
      scheduledDate: selectedDate,
      scheduledSlot: selectedSlot,
      timestamp: Date.now(),
      isMemberBooking: true
    };

    // Simulate short processing
    setTimeout(() => {
      onAddAppointment(newAppt);
      setIsProcessing(false);
      setStep('dash');
      setSelectedServices([]);
      setSelectedSlot('');
      alert(`Priority Booking Confirmed! Your ${selectedServices.length} treatments are scheduled for ${selectedDate} at ${selectedSlot}.`);
    }, 1000);
  };

  const isSlotBooked = (date: string, slot: string) => {
    return appointments.some(a => a.scheduledDate === date && a.scheduledSlot === slot);
  };

  if (step === 'book') {
    return (
      <div className="flex-1 flex flex-col px-6 py-20 max-w-4xl mx-auto w-full animate-in slide-in-from-right-4 duration-500">
        <button 
          onClick={() => { setStep('dash'); setSelectedServices([]); }}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 hover:text-white transition-colors mb-12"
        >
          ← Back to Dashboard
        </button>

        <div className="bg-slate-900/40 border border-white/5 rounded-[3rem] p-10 md:p-16 relative overflow-hidden">
          {isProcessing && (
            <div className="absolute inset-0 z-50 bg-[#05070a]/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 animate-in fade-in">
               <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
               <p className="text-blue-500 font-bold uppercase tracking-widest text-[10px]">Processing Priority Request...</p>
            </div>
          )}

          <h2 className="text-3xl font-display font-bold text-white uppercase tracking-tight mb-4">Member <span className={`text-${tierColor}-500`}>Reservation</span></h2>
          <p className="text-slate-500 text-xs uppercase tracking-widest mb-10">Select one or multiple included benefits for your session.</p>
          
          <form onSubmit={handleBooking} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Program Entitlements</label>
                <div className="space-y-3">
                  {entitledServices.map(service => {
                    const isSelected = selectedServices.includes(service);
                    return (
                      <button
                        type="button"
                        key={service}
                        onClick={() => toggleServiceSelection(service)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
                          isSelected 
                            ? `bg-${tierColor}-500/10 border-${tierColor}-500/50 text-white` 
                            : 'bg-black border-white/10 text-slate-500 hover:border-white/30'
                        }`}
                      >
                        <span className="text-xs font-bold uppercase tracking-tight">{service}</span>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected ? `bg-${tierColor}-500 border-${tierColor}-500` : 'border-white/20'
                        }`}>
                          {isSelected && <span className="text-white text-[10px]">✓</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Vehicle in Studio</label>
                <input 
                  required
                  type="text"
                  value={carModel}
                  onChange={(e) => setCarModel(e.target.value)}
                  placeholder="e.g. BMW M8 Gran Coupe"
                  className="w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-white text-sm outline-none focus:border-blue-500 transition-colors"
                />
                <div className="mt-auto p-4 bg-white/5 border border-white/5 rounded-2xl">
                   <p className="text-[9px] text-slate-600 uppercase tracking-widest leading-relaxed">
                     Tip: You can select both maintenance and interior cleaning if they are available in your monthly tier.
                   </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Priority Calendar</label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                  {calendarDays.map((day) => (
                      <button 
                        type="button"
                        key={day.full} 
                        onClick={() => setSelectedDate(day.full)} 
                        className={`flex flex-col items-center py-4 rounded-xl border transition-all ${selectedDate === day.full ? `bg-${tierColor}-600 border-${tierColor}-500 text-white shadow-lg` : 'bg-black/40 border-white/5 text-slate-500 hover:border-white/20'}`}
                      >
                          <span className="text-[8px] uppercase tracking-widest font-bold mb-1">{day.day}</span>
                          <span className="text-lg font-display font-bold">{day.date}</span>
                      </button>
                  ))}
              </div>
            </div>

            <div className="space-y-6">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Available Slots</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {TIME_SLOTS.map(slot => {
                  const booked = isSlotBooked(selectedDate, slot);
                  return (
                    <button
                      type="button"
                      key={slot}
                      disabled={booked}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${booked ? 'bg-rose-500/5 border-rose-500/10 text-rose-500/30' : selectedSlot === slot ? `bg-${tierColor}-600 border-${tierColor}-500 text-white` : 'bg-black border-white/10 text-slate-500 hover:border-white/30'}`}
                    >
                      {booked ? 'FULL' : slot}
                    </button>
                  );
                })}
              </div>
            </div>

            <button 
              type="submit"
              disabled={selectedServices.length === 0 || !selectedSlot || !carModel}
              className={`w-full py-6 rounded-2xl font-bold uppercase tracking-[0.3em] text-[11px] transition-all bg-${tierColor}-600 text-white hover:bg-${tierColor}-500 shadow-xl disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              {selectedServices.length > 0 
                ? `Confirm Booking for ${selectedServices.length} ${selectedServices.length === 1 ? 'Service' : 'Services'}` 
                : 'Select Services to Continue'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col px-6 py-20 max-w-7xl mx-auto w-full animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-20">
        <div className="space-y-4">
          <span className={`px-4 py-1 rounded-full bg-${tierColor}-500/10 border border-${tierColor}-500/20 text-${tierColor}-500 font-bold text-[10px] uppercase tracking-widest`}>
            Official Member Portal
          </span>
          <h2 className="text-6xl font-display font-bold text-white uppercase tracking-tight">
            Hi, {member.name.split(' ')[0]}
          </h2>
          <p className="text-slate-500 max-w-lg leading-relaxed">
            Welcome back to the studio circle. Manage your premium continuity program and schedule your next rejuvenation session.
          </p>
        </div>

        <div className={`p-1 bg-gradient-to-br from-${tierColor}-400 to-${tierColor}-700 rounded-[2.5rem] w-full md:w-96 shadow-2xl`}>
          <div className="bg-[#05070a] rounded-[2.4rem] p-8 space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-4xl">{isPlatinum ? '💎' : isGold ? '🥇' : '🥈'}</span>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Status Level</span>
                <span className={`text-sm font-bold uppercase tracking-widest text-${tierColor}-500`}>{member.tier}</span>
              </div>
            </div>
            <div className="h-[1px] bg-white/5 w-full"></div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-bold uppercase tracking-widest">Enrolled Since</span>
              <span className="text-white font-mono">{new Date(member.timestamp).toLocaleDateString()}</span>
            </div>
            <button 
              onClick={onLogout}
              className="w-full py-3 bg-white/5 hover:bg-rose-500/10 hover:text-rose-500 text-slate-500 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
            >
              Secure Logout
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-8">
           <div className="bg-slate-900/40 border border-white/5 rounded-[3rem] p-12">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-display font-bold text-white uppercase tracking-tight">Program Actions</h3>
                <button 
                  onClick={() => setStep('book')}
                  className={`px-8 py-3 bg-${tierColor}-600 hover:bg-${tierColor}-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-xl`}
                >
                  Schedule Included Service
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 bg-black/40 border border-white/5 rounded-[2rem] space-y-4 group hover:border-blue-500/30 transition-all">
                  <div className="flex justify-between items-start">
                    <span className="text-2xl">🧼</span>
                    <span className="text-[8px] font-bold text-blue-500 uppercase tracking-widest border border-blue-500/20 px-2 py-0.5 rounded">Standard Benefit</span>
                  </div>
                  <h4 className="text-lg font-bold text-white uppercase">Maintenance Wash</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">2 sessions per month included in your current tier. Priority slots available.</p>
                  <button onClick={() => { setSelectedServices(['Maintenance Wash (Included)']); setStep('book'); }} className="text-[9px] font-bold uppercase tracking-widest text-blue-500 group-hover:underline">Reserve Slot →</button>
                </div>
                
                {(isGold || isPlatinum) && (
                  <div className="p-8 bg-black/40 border border-white/5 rounded-[2rem] space-y-4 group hover:border-amber-500/30 transition-all">
                    <div className="flex justify-between items-start">
                      <span className="text-2xl">🛋️</span>
                      <span className="text-[8px] font-bold text-amber-500 uppercase tracking-widest border border-amber-500/20 px-2 py-0.5 rounded">Premium Benefit</span>
                    </div>
                    <h4 className="text-lg font-bold text-white uppercase">Deep Interior</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">1 monthly intensive rejuvenation session for all interior surfaces.</p>
                    <button onClick={() => { setSelectedServices(['Deep Interior Clean (Monthly Benefit)']); setStep('book'); }} className="text-[9px] font-bold uppercase tracking-widest text-amber-500 group-hover:underline">Reserve Slot →</button>
                  </div>
                )}

                <div className="p-8 bg-black/40 border border-white/5 rounded-[2rem] space-y-4 group hover:border-emerald-500/30 transition-all md:col-span-2 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-2xl text-emerald-500">⚡</div>
                    <div>
                      <h4 className="text-lg font-bold text-white uppercase">Signature Studio Upgrades</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {isPlatinum 
                          ? 'Platinum Exclusive: Combine benefits or get 20% off any signature detailing treatment.' 
                          : 'Book any extra treatments outside your monthly benefits.'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onNavigate(ViewMode.SERVICES)}
                    className="text-[9px] font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 px-6 py-3 rounded-xl border border-white/10 transition-all"
                  >
                    Explore Studio →
                  </button>
                </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="bg-slate-900/40 border border-white/5 rounded-[3rem] p-10 h-full">
              <h3 className="text-xl font-display font-bold text-white uppercase tracking-tight mb-8">Upcoming Sessions</h3>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {appointments.filter(a => a.email.toLowerCase() === member.email.toLowerCase() && a.status !== 'COMPLETED').length === 0 ? (
                  <div className="py-12 text-center text-slate-600 space-y-4">
                    <span className="text-4xl block opacity-20">📭</span>
                    <p className="text-[10px] font-bold uppercase tracking-widest">No Active Bookings</p>
                  </div>
                ) : (
                  appointments.filter(a => a.email.toLowerCase() === member.email.toLowerCase() && a.status !== 'COMPLETED').map(appt => (
                    <div key={appt.id} className="bg-black/60 border border-white/5 p-6 rounded-2xl space-y-3">
                       <div className="flex justify-between items-start">
                          <span className={`text-[8px] font-bold uppercase tracking-[0.2em] ${appt.isMemberBooking ? `text-${tierColor}-500` : 'text-blue-500'}`}>
                            {appt.isMemberBooking ? 'Continuity Booking' : 'One-time Session'}
                          </span>
                          <span className="text-xs font-mono text-slate-600">#{appt.id.slice(0,4)}</span>
                       </div>
                       <h5 className="text-sm font-bold text-white uppercase tracking-tight">{appt.car}</h5>
                       <div className="flex flex-wrap gap-1 mb-2">
                         {appt.services.map((s, idx) => (
                           <span key={idx} className="text-[7px] px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400 uppercase font-bold tracking-widest">{s}</span>
                         ))}
                       </div>
                       <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 border-t border-white/5 pt-2">
                          <span>📅 {appt.scheduledDate}</span>
                          <span className="opacity-30">|</span>
                          <span>⏰ {appt.scheduledSlot}</span>
                       </div>
                    </div>
                  ))
                )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MemberPortal;
