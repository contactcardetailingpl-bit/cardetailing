import React, { useState, useRef, useEffect, useMemo } from 'react';
import { WorkshopMedia, WorkshopService, HomepageContent, WorkshopUser, Appointment } from '../types';

interface AdminProps {
  services: WorkshopService[];
  mediaItems: WorkshopMedia[];
  homepageContent: HomepageContent;
  users: WorkshopUser[];
  appointments: Appointment[];
  onUpdateServices: (services: WorkshopService[]) => void;
  onAddMedia: (item: WorkshopMedia) => void;
  onUpdateMedia: (item: WorkshopMedia) => void;
  onDeleteMedia: (id: string) => void;
  onUpdateHomepage: (content: HomepageContent) => void;
  onUpdateUsers: (users: WorkshopUser[]) => void;
  onUpdateAppointments: (appts: Appointment[]) => void;
  onDeleteAppointment: (id: string) => void;
}

const STORAGE_AUTH_KEY = 'cdpl_admin_auth_v1';

const Admin: React.FC<AdminProps> = ({ 
  services, 
  mediaItems, 
  homepageContent,
  users,
  appointments,
  onUpdateServices, 
  onAddMedia, 
  onUpdateMedia, 
  onDeleteMedia,
  onUpdateHomepage,
  onUpdateUsers,
  onUpdateAppointments,
  onDeleteAppointment
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<WorkshopUser | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<'calendar' | 'services' | 'media' | 'homepage' | 'security'>('calendar');
  
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showManualForm, setShowManualForm] = useState(false);

  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualCar, setManualCar] = useState('');
  const [manualSlot, setManualSlot] = useState<string>('morning');
  const [manualNotes, setManualNotes] = useState('');

  const [newMediaTitle, setNewMediaTitle] = useState('');
  const [newMediaCat, setNewMediaCat] = useState<'Process' | 'Exterior' | 'Interior'>('Process');
  const [editingMedia, setEditingMedia] = useState<WorkshopMedia | null>(null);
  const mediaFileRef = useRef<HTMLInputElement>(null);
  const editMediaFileRef = useRef<HTMLInputElement>(null);

  const [showAddService, setShowAddService] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceCat, setNewServiceCat] = useState('');
  const [newStripeId, setNewStripeId] = useState('');
  const [newStripeUrl, setNewStripeUrl] = useState('');

  const [newUsername, setNewUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'ADMIN' | 'STAFF'>('STAFF');

  useEffect(() => {
    const savedAuth = localStorage.getItem(STORAGE_AUTH_KEY);
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        const foundUser = users.find(u => u.id === authData.id && u.username === authData.username);
        if (foundUser) {
          setIsAuthenticated(true);
          setCurrentUser(foundUser);
        }
      } catch (e) {}
    }
  }, [users]);

  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    const days = [];
    for (let i = 0; i < offset; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i).toISOString().split('T')[0]);
    }
    return days;
  }, [calendarDate]);

  const appointmentsOnDay = useMemo(() => {
    return appointments.filter(a => a.scheduledDate === selectedCalendarDay)
      .sort((a, b) => {
        const slots = { 'morning': 0, 'afternoon': 1, 'evening': 2 };
        return (slots[a.scheduledSlot as keyof typeof slots] || 0) - (slots[b.scheduledSlot as keyof typeof slots] || 0);
      });
  }, [appointments, selectedCalendarDay]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = users.find(u => u.username === username && u.password === password);
    if (foundUser) {
      setIsAuthenticated(true);
      setCurrentUser(foundUser);
      localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(foundUser));
    } else setLoginError('Invalid credentials.');
  };

  const handleManualEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const newAppt: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      name: manualName, email: manualEmail, car: manualCar, notes: manualNotes,
      services: ['Manual Entry'], aiSummary: 'Manual entry.',
      status: 'CONFIRMED', scheduledDate: selectedCalendarDay, scheduledSlot: manualSlot, timestamp: Date.now()
    };
    onUpdateAppointments([...appointments, newAppt]);
    setShowManualForm(false);
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateServices([...services, { name: newServiceName, price: newServicePrice, desc: newServiceDesc, category: newServiceCat, details: [], isVisible: true, stripeProductId: newStripeId, stripeUrl: newStripeUrl }]);
    setShowAddService(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#020408]">
        <div className="max-w-md w-full p-10 bg-slate-900 border border-white/5 rounded-[2.5rem] shadow-2xl">
          <h2 className="text-3xl font-display font-bold uppercase tracking-tight text-white mb-8 text-center">System Access</h2>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-white" placeholder="Username" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-white" placeholder="Password" />
            {loginError && <p className="text-rose-500 text-xs text-center">{loginError}</p>}
            <button className="w-full py-5 bg-blue-600 text-white font-bold uppercase tracking-widest rounded-xl">Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col px-6 py-20 max-w-7xl mx-auto w-full animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-8">
        <h2 className="text-5xl font-display font-bold uppercase tracking-tight text-white">Workshop CMS</h2>
        <div className="flex flex-wrap gap-4">
            <button onClick={() => setActiveTab('calendar')} className={`px-5 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest ${activeTab === 'calendar' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-slate-500'}`}>Calendar</button>
            <button onClick={() => setActiveTab('services')} className={`px-5 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest ${activeTab === 'services' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-slate-500'}`}>Services</button>
            <button onClick={() => setIsAuthenticated(false)} className="px-5 py-2.5 bg-rose-900/20 text-rose-500 text-[9px] font-bold uppercase tracking-widest rounded-xl">Logout</button>
        </div>
      </div>

      {activeTab === 'calendar' && (
        <div className="max-w-6xl mx-auto w-full space-y-12">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-8 bg-slate-900/40 border border-white/5 p-8 rounded-[3rem] space-y-10">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="text-3xl font-display font-bold text-white uppercase tracking-tight">{calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                    <div className="flex gap-4">
                       <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">←</button>
                       <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">→</button>
                       <button onClick={() => setShowManualForm(!showManualForm)} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest">+ Entry</button>
                    </div>
                 </div>
                 <div className="grid grid-cols-7 gap-3">
                    {calendarDays.map((day, idx) => (
                      day ? (
                        <button key={day} onClick={() => setSelectedCalendarDay(day)} className={`aspect-square rounded-2xl border flex items-center justify-center ${selectedCalendarDay === day ? 'bg-blue-600 border-blue-500 text-white' : appointments.some(a => a.scheduledDate === day) ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-black/40 border-white/5 text-slate-500'}`}>
                           <span className="text-lg font-bold">{day.split('-')[2]}</span>
                        </button>
                      ) : <div key={idx} />
                    ))}
                 </div>
              </div>
              <div className="lg:col-span-4 bg-slate-900/40 border border-white/5 p-8 rounded-[3rem]">
                 <h4 className="text-xl font-display font-bold text-white uppercase mb-8">{selectedCalendarDay} Manifest</h4>
                 <div className="space-y-4">
                    {appointmentsOnDay.length === 0 ? <p className="text-slate-600 italic text-xs">No bookings.</p> : appointmentsOnDay.map(a => (
                      <div key={a.id} className="bg-black/40 border border-white/5 p-4 rounded-xl">
                        <p className="text-white font-bold text-sm">{a.car}</p>
                        <p className="text-blue-500 text-[10px] uppercase font-bold">{a.name} ({a.scheduledSlot})</p>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="max-w-6xl mx-auto w-full space-y-12">
           <section className="bg-slate-900/40 border border-white/5 p-10 rounded-[3rem] space-y-12">
              <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-display font-bold text-white uppercase">Service Registry</h3>
                 <button onClick={() => setShowAddService(!showAddService)} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest">+ New Service</button>
              </div>

              {/* Stripe Redirect Documentation */}
              <div className="p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl space-y-4">
                 <h4 className="text-emerald-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                   <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                   Webhook & Success Redirect Setup
                 </h4>
                 <p className="text-slate-400 text-xs">
                   To automatically redirect users back to your confirmation page after payment:
                 </p>
                 <ol className="text-slate-500 text-[10px] space-y-3 font-bold uppercase tracking-widest">
                   <li>1. Go to your <span className="text-white">Stripe Dashboard</span> &gt; Payment Links.</li>
                   <li>2. Edit your link and go to the <span className="text-white">"After Payment"</span> tab.</li>
                   <li>3. Select <span className="text-emerald-500">"Don't show confirmation page"</span>.</li>
                   <li>4. Enter your Redirect URL: <span className="text-white font-mono lowercase">https://yourdomain.pl/?success=true</span></li>
                 </ol>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {services.map((s, idx) => (
                    <div key={idx} className="bg-black/40 border border-white/5 p-8 rounded-3xl space-y-4">
                       <h4 className="text-white font-bold text-lg">{s.name}</h4>
                       <div className="space-y-2">
                          <label className="text-[8px] font-bold text-slate-500 uppercase">Stripe Product ID</label>
                          <input className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white font-mono" value={s.stripeProductId || ''} readOnly />
                          <label className="text-[8px] font-bold text-slate-500 uppercase">Payment Link</label>
                          <input className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white truncate" value={s.stripeUrl || ''} readOnly />
                       </div>
                    </div>
                 ))}
              </div>
           </section>
        </div>
      )}
    </div>
  );
};

export default Admin;