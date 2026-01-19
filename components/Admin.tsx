
import React, { useState, useEffect, useMemo } from 'react';
import { WorkshopMedia, WorkshopService, HomepageContent, WorkshopUser, Appointment, MembershipSignup } from '../types';

interface AdminProps {
  services: WorkshopService[];
  mediaItems: WorkshopMedia[];
  homepageContent: HomepageContent;
  users: WorkshopUser[];
  appointments: Appointment[];
  membershipSignups: MembershipSignup[];
  onUpdateServices: (services: WorkshopService[]) => void;
  onAddMedia: (item: WorkshopMedia) => void;
  onUpdateMedia: (item: WorkshopMedia) => void;
  onDeleteMedia: (id: string) => void;
  onUpdateHomepage: (content: HomepageContent) => void;
  onUpdateUsers: (users: WorkshopUser[]) => void;
  onUpdateAppointments: (appts: Appointment[]) => void;
  onDeleteAppointment: (id: string) => void;
  onDeleteMembership: (id: string) => void;
}

const STORAGE_AUTH_KEY = 'cdpl_admin_auth_v1';

const HOURLY_SLOTS = Array.from({ length: 12 }, (_, i) => {
  const hour = 9 + i;
  return `${hour.toString().padStart(2, '0')}:00`;
});

const Admin: React.FC<AdminProps> = ({ 
  services, 
  mediaItems, 
  homepageContent,
  users,
  appointments,
  membershipSignups,
  onUpdateServices, 
  onAddMedia, 
  onUpdateMedia, 
  onDeleteMedia,
  onUpdateHomepage,
  onUpdateUsers,
  onUpdateAppointments,
  onDeleteAppointment,
  onDeleteMembership
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<WorkshopUser | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<'calendar' | 'memberships' | 'services' | 'media' | 'homepage' | 'security'>('calendar');
  
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showManualForm, setShowManualForm] = useState(false);

  // Manual Appointment State
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualCar, setManualCar] = useState('');
  const [manualSlot, setManualSlot] = useState<string>(HOURLY_SLOTS[0]);
  const [manualNotes, setManualNotes] = useState('');

  // Media State
  const [newMediaTitle, setNewMediaTitle] = useState('');
  const [newMediaFile, setNewMediaFile] = useState<File | null>(null);
  const [newMediaDesc, setNewMediaDesc] = useState('');
  const [newMediaCat, setNewMediaCat] = useState<'Process' | 'Exterior' | 'Interior'>('Process');
  const [newMediaType, setNewMediaType] = useState<'image' | 'video'>('image');
  const [isUploading, setIsUploading] = useState(false);

  // Service State
  const [showAddService, setShowAddService] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceCat, setNewServiceCat] = useState('Premium Restoration');
  const [newStripeId, setNewStripeId] = useState('');
  const [newStripeUrl, setNewStripeUrl] = useState('');

  // Security State
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
      .sort((a, b) => a.scheduledSlot.localeCompare(b.scheduledSlot));
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
      services: ['Manual Entry'], aiSummary: 'Manual entry created in dashboard.',
      status: 'CONFIRMED', scheduledDate: selectedCalendarDay, scheduledSlot: manualSlot, timestamp: Date.now()
    };
    onUpdateAppointments([...appointments, newAppt]);
    setShowManualForm(false);
    setManualName(''); setManualCar(''); setManualEmail(''); setManualNotes('');
  };

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMediaFile) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const newItem: WorkshopMedia = {
        id: Math.random().toString(36).substr(2, 9),
        type: newMediaType,
        url: dataUrl,
        title: newMediaTitle,
        description: newMediaDesc,
        category: newMediaCat,
        timestamp: Date.now()
      };
      onAddMedia(newItem);
      setNewMediaTitle(''); 
      setNewMediaFile(null); 
      setNewMediaDesc('');
      setIsUploading(false);
    };
    reader.readAsDataURL(newMediaFile);
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateServices([...services, { 
      name: newServiceName, 
      price: newServicePrice, 
      desc: newServiceDesc, 
      category: newServiceCat, 
      details: ['Premium Polish Standard'], 
      isVisible: true, 
      stripeProductId: newStripeId, 
      stripeUrl: newStripeUrl 
    }]);
    setShowAddService(false);
    setNewServiceName(''); setNewServicePrice(''); setNewServiceDesc(''); setNewServiceCat(''); setNewStripeId(''); setNewStripeUrl('');
  };

  const updateService = (index: number, field: keyof WorkshopService, val: any) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: val };
    onUpdateServices(updated);
  };

  const deleteService = (index: number) => {
    onUpdateServices(services.filter((_, i) => i !== index));
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: WorkshopUser = {
      id: Math.random().toString(36).substr(2, 9),
      username: newUsername,
      password: newUserPassword,
      role: newUserRole,
      createdAt: Date.now()
    };
    onUpdateUsers([...users, newUser]);
    setNewUsername(''); setNewUserPassword('');
  };

  const updateHomepageField = (field: keyof HomepageContent, val: any) => {
    onUpdateHomepage({ ...homepageContent, [field]: val });
  };

  const updateStat = (index: number, field: 'label' | 'val', value: string) => {
    const newStats = [...homepageContent.stats];
    newStats[index] = { ...newStats[index], [field]: value };
    updateHomepageField('stats', newStats);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#020408]">
        <div className="max-w-md w-full p-10 bg-slate-900 border border-white/5 rounded-[2.5rem] shadow-2xl">
          <h2 className="text-3xl font-display font-bold uppercase tracking-tight text-white mb-8 text-center">System Access</h2>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-blue-500" placeholder="Username" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-blue-500" placeholder="Password" />
            {loginError && <p className="text-rose-500 text-xs text-center">{loginError}</p>}
            <button className="w-full py-5 bg-blue-600 text-white font-bold uppercase tracking-widest rounded-xl hover:bg-blue-500 transition-colors">Login to Studio</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col px-6 py-20 max-w-7xl mx-auto w-full animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-8 text-center md:text-left">
        <div>
          <h2 className="text-5xl font-display font-bold uppercase tracking-tight text-white">Workshop CMS</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Active User: <span className="text-blue-500">{currentUser?.username}</span></p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
            {(['calendar', 'memberships', 'services', 'media', 'homepage', 'security'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-slate-500 hover:text-white'}`}>
                {tab}
              </button>
            ))}
            <button onClick={() => { localStorage.removeItem(STORAGE_AUTH_KEY); setIsAuthenticated(false); }} className="px-5 py-2.5 bg-rose-900/20 text-rose-500 text-[9px] font-bold uppercase tracking-widest rounded-xl hover:bg-rose-900/40 transition-all">Logout</button>
        </div>
      </div>

      {activeTab === 'calendar' && (
        <div className="max-w-6xl mx-auto w-full space-y-12">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-8 bg-slate-900/40 border border-white/5 p-8 rounded-[3rem] space-y-10">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="text-3xl font-display font-bold text-white uppercase tracking-tight">{calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                    <div className="flex gap-4">
                       <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">←</button>
                       <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">→</button>
                       <button onClick={() => setShowManualForm(!showManualForm)} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-xl shadow-blue-500/20">+ Entry</button>
                    </div>
                 </div>
                 
                 {showManualForm && (
                   <form onSubmit={handleManualEntry} className="bg-black/40 p-8 rounded-3xl border border-blue-500/20 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-4">
                      <input value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="Client Name" className="bg-black border border-white/10 p-3 rounded-lg text-xs" required />
                      <input value={manualCar} onChange={(e) => setManualCar(e.target.value)} placeholder="Vehicle Model" className="bg-black border border-white/10 p-3 rounded-lg text-xs" required />
                      <input value={manualEmail} onChange={(e) => setManualEmail(e.target.value)} placeholder="Client Email" className="bg-black border border-white/10 p-3 rounded-lg text-xs" />
                      <select value={manualSlot} onChange={(e) => setManualSlot(e.target.value)} className="bg-black border border-white/10 p-3 rounded-lg text-xs">
                        {HOURLY_SLOTS.map(s => <option key={s} value={s}>{s} Slot</option>)}
                      </select>
                      <textarea value={manualNotes} onChange={(e) => setManualNotes(e.target.value)} placeholder="Notes..." className="bg-black border border-white/10 p-3 rounded-lg text-xs md:col-span-2" />
                      <button type="submit" className="bg-blue-600 text-white font-bold p-3 rounded-lg text-xs uppercase tracking-widest md:col-span-2">Add Appointment</button>
                   </form>
                 )}

                 <div className="grid grid-cols-7 gap-3">
                    {calendarDays.map((day, idx) => (
                      day ? (
                        <button key={day} onClick={() => setSelectedCalendarDay(day)} className={`aspect-square rounded-2xl border flex items-center justify-center transition-all ${selectedCalendarDay === day ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-500/20' : appointments.some(a => a.scheduledDate === day) ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-black/40 border-white/5 text-slate-500 hover:border-white/20'}`}>
                           <span className="text-lg font-bold">{day.split('-')[2]}</span>
                        </button>
                      ) : <div key={idx} />
                    ))}
                 </div>
              </div>
              
              <div className="lg:col-span-4 bg-slate-900/40 border border-white/5 p-8 rounded-[3rem]">
                 <h4 className="text-xl font-display font-bold text-white uppercase mb-8">{selectedCalendarDay} Manifest</h4>
                 <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {appointmentsOnDay.length === 0 ? <p className="text-slate-600 italic text-xs">No bookings for this date.</p> : appointmentsOnDay.map(a => (
                      <div key={a.id} className="bg-black/40 border border-white/5 p-5 rounded-2xl group">
                        <div className="flex justify-between items-start mb-2">
                           <p className="text-white font-bold text-sm uppercase tracking-tight">{a.car}</p>
                           <button onClick={() => onDeleteAppointment(a.id)} className="text-[10px] text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
                        </div>
                        <p className="text-blue-500 text-[10px] uppercase font-bold tracking-widest">{a.name} • {a.scheduledSlot}</p>
                        <p className="text-slate-600 text-[10px] mt-2 italic">{a.notes || 'No extra notes'}</p>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'memberships' && (
        <div className="max-w-6xl mx-auto w-full space-y-12">
           <section className="bg-slate-900/40 border border-white/5 p-10 rounded-[3rem] space-y-12">
              <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-display font-bold text-white uppercase">Membership Directory</h3>
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{membershipSignups.length} Registered Members</span>
              </div>

              <div className="space-y-4">
                 {membershipSignups.length === 0 ? (
                    <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl">
                       <p className="text-slate-500 italic text-xs">No membership registrations found.</p>
                    </div>
                 ) : (
                    membershipSignups.map(member => (
                       <div key={member.id} className="bg-black/40 border border-white/5 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-blue-500/30 transition-all">
                          <div className="flex items-center gap-6 w-full md:w-auto">
                             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl bg-white/5 border border-white/10 ${
                               member.tier.includes('Silver') ? 'text-slate-400' : 
                               member.tier.includes('Gold') ? 'text-amber-500' : 'text-blue-500'
                             }`}>
                                {member.tier.includes('Silver') ? '🥈' : member.tier.includes('Gold') ? '🥇' : '💎'}
                             </div>
                             <div>
                                <h4 className="text-lg font-display font-bold text-white uppercase tracking-tight leading-none mb-2">{member.name}</h4>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                   <span className="flex items-center gap-1">📧 {member.email}</span>
                                   <span className="flex items-center gap-1">📞 {member.phone}</span>
                                </div>
                             </div>
                          </div>
                          
                          <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                             <div className="text-right">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Enrolled Program</span>
                                <span className={`text-xs font-bold uppercase tracking-widest ${
                                   member.tier.includes('Silver') ? 'text-slate-400' : 
                                   member.tier.includes('Gold') ? 'text-amber-500' : 'text-blue-500'
                                }`}>{member.tier}</span>
                             </div>
                             <div className="text-right">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Signup Date</span>
                                <span className="text-xs font-mono text-slate-400">{new Date(member.timestamp).toLocaleDateString()}</span>
                             </div>
                             <button 
                                onClick={() => onDeleteMembership(member.id)}
                                className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 transition-all opacity-0 group-hover:opacity-100"
                             >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                             </button>
                          </div>
                       </div>
                    ))
                 )}
              </div>
           </section>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="max-w-6xl mx-auto w-full space-y-12">
           <section className="bg-slate-900/40 border border-white/5 p-10 rounded-[3rem] space-y-12">
              <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-display font-bold text-white uppercase">Service Management</h3>
                 <button onClick={() => setShowAddService(!showAddService)} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-blue-500/20">+ Add Service</button>
              </div>

              {showAddService && (
                <form onSubmit={handleAddService} className="bg-black/40 p-8 rounded-3xl border border-blue-500/20 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-4">
                  <input value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} placeholder="Service Name" className="bg-black border border-white/10 p-4 rounded-xl text-xs" required />
                  <input value={newServicePrice} onChange={(e) => setNewServicePrice(e.target.value)} placeholder="Price (e.g. 500 PLN)" className="bg-black border border-white/10 p-4 rounded-xl text-xs" required />
                  <input value={newServiceCat} onChange={(e) => setNewServiceCat(e.target.value)} placeholder="Category (e.g. Essential Care)" className="bg-black border border-white/10 p-4 rounded-xl text-xs" required />
                  <input value={newStripeId} onChange={(e) => setNewStripeId(e.target.value)} placeholder="Stripe Product ID" className="bg-black border border-white/10 p-4 rounded-xl text-xs" />
                  <input value={newStripeUrl} onChange={(e) => setNewStripeUrl(e.target.value)} placeholder="Checkout Payment Link" className="bg-black border border-white/10 p-4 rounded-xl text-xs md:col-span-2" />
                  <textarea value={newServiceDesc} onChange={(e) => setNewServiceDesc(e.target.value)} placeholder="Description..." className="bg-black border border-white/10 p-4 rounded-xl text-xs md:col-span-2" required />
                  <button type="submit" className="bg-blue-600 text-white font-bold p-4 rounded-xl text-xs uppercase tracking-widest md:col-span-2">Save Service</button>
                </form>
              )}

              <div className="space-y-6">
                 {services.map((s, idx) => (
                    <div key={idx} className="bg-black/40 border border-white/5 p-8 rounded-3xl space-y-6 animate-in fade-in">
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                             <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Name</label>
                             <input className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white" value={s.name} onChange={(e) => updateService(idx, 'name', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Price</label>
                             <input className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-blue-400 font-bold" value={s.price} onChange={(e) => updateService(idx, 'price', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Category</label>
                             <input className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white" value={s.category} onChange={(e) => updateService(idx, 'category', e.target.value)} />
                          </div>
                          <div className="space-y-2 md:col-span-3">
                             <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Description</label>
                             <textarea className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-300" value={s.desc} onChange={(e) => updateService(idx, 'desc', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Stripe Product ID</label>
                             <input className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs font-mono" value={s.stripeProductId || ''} onChange={(e) => updateService(idx, 'stripeProductId', e.target.value)} placeholder="prod_..." />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                             <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Checkout URL</label>
                             <input className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-blue-500 font-mono" value={s.stripeUrl || ''} onChange={(e) => updateService(idx, 'stripeUrl', e.target.value)} placeholder="https://buy.stripe.com/..." />
                          </div>
                       </div>
                       <div className="flex justify-end pt-4 border-t border-white/5">
                          <button onClick={() => deleteService(idx)} className="text-[9px] font-bold text-rose-500 uppercase tracking-widest hover:bg-rose-500/10 px-4 py-2 rounded-lg transition-all">Delete Service</button>
                       </div>
                    </div>
                 ))}
              </div>
           </section>
        </div>
      )}

      {activeTab === 'media' && (
        <div className="max-w-6xl mx-auto w-full space-y-12">
          <section className="bg-slate-900/40 border border-white/5 p-10 rounded-[3rem] space-y-12">
            <h3 className="text-2xl font-display font-bold text-white uppercase">Portfolio Asset Manager</h3>
            
            <form onSubmit={handleAddMedia} className="bg-black/40 p-8 rounded-3xl border border-white/5 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Asset Title</label>
                <input value={newMediaTitle} onChange={(e) => setNewMediaTitle(e.target.value)} className="w-full bg-black border border-white/10 p-3 rounded-lg text-xs" required />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Direct Upload (Camera Roll)</label>
                <input 
                  type="file" 
                  accept="image/*,video/*"
                  onChange={(e) => setNewMediaFile(e.target.files?.[0] || null)}
                  className="w-full bg-black border border-white/10 p-2.5 rounded-lg text-[10px] text-slate-400 file:bg-blue-600 file:border-none file:text-white file:text-[9px] file:font-bold file:px-3 file:py-1 file:rounded-md file:mr-4 file:cursor-pointer" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Asset Type</label>
                <select value={newMediaType} onChange={(e) => setNewMediaType(e.target.value as any)} className="w-full bg-black border border-white/10 p-3 rounded-lg text-xs">
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Asset Description</label>
                <input value={newMediaDesc} onChange={(e) => setNewMediaDesc(e.target.value)} className="w-full bg-black border border-white/10 p-3 rounded-lg text-xs" required />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Category</label>
                <select value={newMediaCat} onChange={(e) => setNewMediaCat(e.target.value as any)} className="w-full bg-black border border-white/10 p-3 rounded-lg text-xs">
                  <option value="Process">Process</option>
                  <option value="Exterior">Exterior</option>
                  <option value="Interior">Interior</option>
                </select>
              </div>
              <button 
                type="submit" 
                disabled={isUploading}
                className="md:col-span-3 bg-blue-600 text-white font-bold p-4 rounded-xl text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-colors disabled:opacity-50"
              >
                {isUploading ? 'Processing Asset...' : 'Upload to Gallery'}
              </button>
            </form>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {mediaItems.map(item => (
                <div key={item.id} className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/5 group">
                  <img src={item.url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all" alt={item.title} />
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black to-transparent">
                    <p className="text-white text-[10px] font-bold uppercase truncate">{item.title}</p>
                    <button onClick={() => onDeleteMedia(item.id)} className="text-[8px] text-rose-500 font-bold uppercase mt-1 hover:text-rose-400 transition-colors">Remove Asset</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeTab === 'homepage' && (
        <div className="max-w-6xl mx-auto w-full space-y-12">
          <section className="bg-slate-900/40 border border-white/5 p-10 rounded-[3rem] space-y-12">
            <h3 className="text-2xl font-display font-bold text-white uppercase tracking-tight">Homepage Interface Editor</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-6 bg-black/40 p-8 rounded-3xl border border-white/5">
                  <h4 className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.3em]">Hero Configuration</h4>
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Hero Title</label>
                    <input value={homepageContent.heroTitle} onChange={(e) => updateHomepageField('heroTitle', e.target.value)} className="w-full bg-black border border-white/10 p-4 rounded-xl text-xs text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Hero Subtitle</label>
                    <textarea value={homepageContent.heroSubtitle} onChange={(e) => updateHomepageField('heroSubtitle', e.target.value)} className="w-full bg-black border border-white/10 p-4 rounded-xl text-xs text-white h-24" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Hero Background Image URL</label>
                    <input value={homepageContent.heroImageUrl} onChange={(e) => updateHomepageField('heroImageUrl', e.target.value)} className="w-full bg-black border border-white/10 p-4 rounded-xl text-xs text-white" />
                  </div>
               </div>

               <div className="space-y-6 bg-black/40 p-8 rounded-3xl border border-white/5">
                  <h4 className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.3em]">Studio Statistics</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {homepageContent.stats.map((stat, i) => (
                      <div key={i} className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-xl">
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Label</label>
                          <input value={stat.label} onChange={(e) => updateStat(i, 'label', e.target.value)} className="w-full bg-black border border-white/10 p-2 rounded-lg text-[10px]" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Value</label>
                          <input value={stat.val} onChange={(e) => updateStat(i, 'val', e.target.value)} className="w-full bg-black border border-white/10 p-2 rounded-lg text-[10px]" />
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="max-w-6xl mx-auto w-full space-y-12">
          <section className="bg-slate-900/40 border border-white/5 p-10 rounded-[3rem] space-y-12">
            <h3 className="text-2xl font-display font-bold text-white uppercase tracking-tight">Staff Access Control</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               <div className="bg-black/40 p-8 rounded-3xl border border-white/5 space-y-8">
                  <h4 className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.3em]">Authorize New Member</h4>
                  <form onSubmit={handleAddUser} className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Username</label>
                        <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="w-full bg-black border border-white/10 p-4 rounded-xl text-xs" required />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Access Key (Password)</label>
                        <input type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} className="w-full bg-black border border-white/10 p-4 rounded-xl text-xs" required />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Permission Level</label>
                        <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as any)} className="w-full bg-black border border-white/10 p-4 rounded-xl text-xs">
                           <option value="STAFF">Staff (Standard Access)</option>
                           <option value="ADMIN">Administrator (Full System Access)</option>
                        </select>
                     </div>
                     <button type="submit" className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl text-[10px] uppercase tracking-widest">Issue Credentials</button>
                  </form>
               </div>

               <div className="bg-black/40 p-8 rounded-3xl border border-white/5 space-y-6">
                  <h4 className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.3em]">Active Credentials</h4>
                  <div className="space-y-3">
                    {users.map(u => (
                      <div key={u.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div>
                          <p className="text-white text-xs font-bold">{u.username}</p>
                          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1">{u.role} • Since {new Date(u.createdAt).toLocaleDateString()}</p>
                        </div>
                        {u.id !== currentUser?.id && (
                          <button 
                            onClick={() => onUpdateUsers(users.filter(usr => usr.id !== u.id))} 
                            className="text-[8px] text-rose-500 font-bold uppercase hover:bg-rose-500/10 p-2 rounded-lg transition-all"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Admin;
