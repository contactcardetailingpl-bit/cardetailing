import React, { useState, useRef, useEffect } from 'react';
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
  const [activeTab, setActiveTab] = useState<'appointments' | 'services' | 'media' | 'homepage' | 'security'>('appointments');
  
  // Media states
  const [newMediaTitle, setNewMediaTitle] = useState('');
  const [newMediaCat, setNewMediaCat] = useState<'Process' | 'Exterior' | 'Interior'>('Process');
  const [editingMedia, setEditingMedia] = useState<WorkshopMedia | null>(null);
  const mediaFileRef = useRef<HTMLInputElement>(null);
  const editMediaFileRef = useRef<HTMLInputElement>(null);

  // New Service local state
  const [showAddService, setShowAddService] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceCat, setNewServiceCat] = useState('');
  const [newStripeId, setNewStripeId] = useState('');
  const [newStripeUrl, setNewStripeUrl] = useState('');

  // New User local state
  const [newUsername, setNewUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'ADMIN' | 'STAFF'>('STAFF');

  // Check for persistent session on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem(STORAGE_AUTH_KEY);
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        const foundUser = users.find(u => u.id === authData.id && u.username === authData.username);
        if (foundUser) {
          setIsAuthenticated(true);
          setCurrentUser(foundUser);
        } else {
          localStorage.removeItem(STORAGE_AUTH_KEY);
        }
      } catch (e) {
        localStorage.removeItem(STORAGE_AUTH_KEY);
      }
    }
  }, [users]);

  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = users.find(u => u.username === username && u.password === password);
    if (foundUser) {
      setIsAuthenticated(true);
      setCurrentUser(foundUser);
      setLoginError('');
      localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(foundUser));
    } else {
      setLoginError('Invalid Terminal ID or Security Cipher.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_AUTH_KEY);
  };

  const handleUpdateApptStatus = (id: string, status: Appointment['status']) => {
    const updated = appointments.map(a => a.id === id ? { ...a, status } : a);
    onUpdateAppointments(updated);
  };

  const handleAddMediaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = mediaFileRef.current?.files?.[0];
    if (!file) {
      alert("Please select a photo or video from your device.");
      return;
    }

    try {
      const base64 = await toBase64(file);
      const item: WorkshopMedia = {
        id: Math.random().toString(36).substr(2, 9),
        url: base64,
        title: newMediaTitle || 'Studio Session',
        description: 'Uploaded from Device',
        category: newMediaCat,
        type: file.type.startsWith('video') ? 'video' : 'image',
        timestamp: Date.now()
      };
      onAddMedia(item);
      setNewMediaTitle('');
      if (mediaFileRef.current) mediaFileRef.current.value = '';
    } catch (err) {
      alert("Failed to process file.");
    }
  };

  const handleEditMediaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMedia) return;

    const file = editMediaFileRef.current?.files?.[0];
    let finalUrl = editingMedia.url;
    let finalType = editingMedia.type;

    if (file) {
      try {
        finalUrl = await toBase64(file);
        finalType = file.type.startsWith('video') ? 'video' : 'image';
      } catch (err) {
        alert("Failed to process new file.");
        return;
      }
    }

    onUpdateMedia({
      ...editingMedia,
      url: finalUrl,
      type: finalType
    });
    setEditingMedia(null);
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    const newService: WorkshopService = {
      name: newServiceName,
      price: newServicePrice,
      desc: newServiceDesc,
      category: newServiceCat,
      details: [],
      isVisible: true,
      stripeProductId: newStripeId,
      stripeUrl: newStripeUrl
    };
    onUpdateServices([...services, newService]);
    setNewServiceName('');
    setNewServicePrice('');
    setNewServiceDesc('');
    setNewServiceCat('');
    setNewStripeId('');
    setNewStripeUrl('');
    setShowAddService(false);
  };

  const toggleServiceVisibility = (idx: number) => {
    const updated = [...services];
    const currentVisibility = updated[idx].isVisible === undefined ? true : updated[idx].isVisible;
    updated[idx].isVisible = !currentVisibility;
    onUpdateServices(updated);
  };

  const handleUpdateServiceDetail = (idx: number, detailIdx: number, value: string) => {
    const updated = [...services];
    updated[idx].details[detailIdx] = value;
    onUpdateServices(updated);
  };

  const handleAddServiceDetail = (idx: number) => {
    const updated = [...services];
    updated[idx].details.push("New Specification");
    onUpdateServices(updated);
  };

  const handleRemoveServiceDetail = (idx: number, detailIdx: number) => {
    const updated = [...services];
    updated[idx].details.splice(detailIdx, 1);
    onUpdateServices(updated);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (users.find(u => u.username === newUsername)) {
      alert("Username already exists.");
      return;
    }
    const newUser: WorkshopUser = {
      id: Math.random().toString(36).substr(2, 9),
      username: newUsername,
      password: newUserPassword,
      role: newUserRole,
      createdAt: Date.now()
    };
    onUpdateUsers([...users, newUser]);
    setNewUsername('');
    setNewUserPassword('');
  };

  const handleHomepageImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'heroImageUrl' | 'featuredImage', index?: number) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await toBase64(file);
        if (field === 'heroImageUrl') {
          onUpdateHomepage({ ...homepageContent, heroImageUrl: base64 });
        } else if (field === 'featuredImage' && typeof index === 'number') {
          const updatedFeatured = [...homepageContent.featuredServices];
          updatedFeatured[index].imageUrl = base64;
          onUpdateHomepage({ ...homepageContent, featuredServices: updatedFeatured });
        }
      } catch (err) {
        alert("Image upload failed.");
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#020408]">
        <div className="max-w-md w-full p-10 bg-slate-900 border border-white/5 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-transparent"></div>
          <div className="text-center mb-10">
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.4em] mb-4 block">Secure Interface</span>
            <h2 className="text-3xl font-display font-bold uppercase tracking-tight text-white">System Access</h2>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Terminal ID</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-white font-mono text-sm focus:ring-1 ring-blue-500 outline-none" placeholder="USER_ID" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Security Cipher</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-white font-mono text-sm focus:ring-1 ring-blue-500 outline-none" placeholder="********" />
            </div>
            {loginError && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-widest text-center">{loginError}</p>}
            <button className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-[0.3em] rounded-xl transition-all shadow-xl shadow-blue-500/20 active:scale-95">Initiate Uplink</button>
          </form>
          <div className="mt-8 text-center"><p className="text-[8px] text-slate-700 uppercase tracking-widest">Default Access: admin_1 / password123</p></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col px-6 py-20 max-w-7xl mx-auto w-full animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <span className="text-emerald-500 font-bold text-[10px] uppercase tracking-[0.4em] block">System Administrator Root</span>
             <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-bold text-emerald-400 uppercase tracking-widest">Active Session: {currentUser?.username}</span>
          </div>
          <h2 className="text-5xl font-display font-bold uppercase tracking-tight text-white">Workshop CMS</h2>
        </div>
        <div className="flex flex-wrap gap-4 justify-center md:justify-end">
            <button onClick={() => setActiveTab('appointments')} className={`px-5 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'appointments' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-slate-500 hover:text-white border border-white/10'}`}>Queue</button>
            <button onClick={() => setActiveTab('media')} className={`px-5 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === 'media' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-slate-500 hover:text-white border border-white/10'}`}>Portfolio</button>
            <button onClick={() => setActiveTab('services')} className={`px-5 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === 'services' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-slate-500 hover:text-white border border-white/10'}`}>Services</button>
            <button onClick={() => setActiveTab('homepage')} className={`px-5 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === 'homepage' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-slate-500 hover:text-white border border-white/10'}`}>Content</button>
            <button onClick={() => setActiveTab('security')} className={`px-5 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === 'security' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-slate-500 hover:text-white border border-white/10'}`}>Security</button>
            <button onClick={handleLogout} className="px-5 py-2.5 bg-rose-900/20 border border-rose-500/20 text-[9px] font-bold uppercase tracking-widest text-rose-500 rounded-xl hover:bg-rose-600 hover:text-white transition-all">Logout</button>
        </div>
      </div>

      {activeTab === 'appointments' && (
        <div className="max-w-6xl mx-auto w-full space-y-12 animate-in fade-in slide-in-from-bottom-2">
           <section className="bg-slate-900/40 border border-white/5 p-10 rounded-[3rem]">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-xl">📅</div>
                    <div>
                       <h3 className="text-2xl font-display font-bold text-white uppercase tracking-tight">Client Queue</h3>
                       <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{appointments.length} Total Bookings Registry</p>
                    </div>
                 </div>
              </div>

              {appointments.length === 0 ? (
                <div className="py-24 text-center space-y-6">
                   <div className="w-20 h-20 rounded-full bg-white/5 border border-dashed border-white/10 mx-auto flex items-center justify-center text-2xl">☕</div>
                   <div><p className="text-slate-400 font-bold uppercase tracking-widest text-xs">The workshop queue is empty</p></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                   {appointments.map(appt => (
                      <div key={appt.id} className="bg-black/40 border border-white/5 rounded-3xl p-8 hover:border-blue-500/30 transition-all group overflow-hidden relative">
                         <div className={`absolute left-0 top-0 bottom-0 w-1 ${appt.status === 'PENDING' ? 'bg-amber-500' : appt.status === 'CONFIRMED' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            <div className="lg:col-span-4 space-y-4">
                               <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-xl">🚗</div>
                                  <div>
                                     <h4 className="text-white font-bold text-lg leading-tight uppercase tracking-tight">{appt.car}</h4>
                                     <p className="text-blue-500 text-[10px] font-bold uppercase tracking-[0.2em]">{appt.name}</p>
                                  </div>
                               </div>
                               <div className="space-y-2 pt-2 text-[10px] text-slate-500 font-mono">
                                  <div>📅 {new Date(appt.timestamp).toLocaleString()}</div>
                                  <div>📧 {appt.email}</div>
                               </div>
                            </div>
                            <div className="lg:col-span-5 bg-white/5 border border-white/5 p-6 rounded-2xl relative">
                               <div className="flex items-center gap-2 mb-3"><span className="w-2 h-2 rounded-full bg-blue-500"></span><span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">AI Strategy</span></div>
                               <p className="text-slate-400 text-xs italic leading-relaxed">"{appt.aiSummary}"</p>
                            </div>
                            <div className="lg:col-span-3 flex flex-col gap-3">
                               <div className="space-y-1 mb-2">
                                  <label className="text-[8px] font-bold text-slate-600 uppercase tracking-widest px-1">Update Status</label>
                                  <select 
                                    value={appt.status} 
                                    onChange={(e) => handleUpdateApptStatus(appt.id, e.target.value as any)} 
                                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[10px] font-bold uppercase text-white outline-none focus:border-blue-500"
                                  >
                                     <option value="PENDING">Pending</option>
                                     <option value="CONFIRMED">Confirm</option>
                                     <option value="COMPLETED">Completed</option>
                                  </select>
                               </div>
                               <button onClick={() => onDeleteAppointment(appt.id)} className="text-[9px] font-bold text-rose-500 uppercase tracking-widest hover:text-white transition-colors text-right px-2">Delete Entry</button>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
              )}
           </section>
        </div>
      )}

      {activeTab === 'media' && (
        <div className="max-w-6xl mx-auto w-full space-y-12 animate-in fade-in slide-in-from-bottom-2">
           <section className="bg-slate-900/40 border border-white/5 p-10 rounded-[3rem] space-y-12">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-xl">🖼️</div>
                 <div>
                    <h3 className="text-2xl font-display font-bold text-white uppercase tracking-tight">Portfolio Manager</h3>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Upload or edit studio media assets</p>
                 </div>
              </div>

              {!editingMedia ? (
                <form onSubmit={handleAddMediaSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-black/40 p-8 rounded-3xl border border-white/5">
                  <div className="md:col-span-2 space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Device File</label>
                      <input ref={mediaFileRef} type="file" accept="image/*,video/*" className="w-full bg-[#05070a] border border-white/10 rounded-xl px-5 py-2.5 text-white text-xs file:bg-blue-600 file:border-none file:text-white file:text-[9px] file:uppercase file:font-bold file:px-3 file:py-1 file:rounded-full file:mr-4 file:cursor-pointer" />
                  </div>
                  <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Gallery Title</label>
                      <input required type="text" value={newMediaTitle} onChange={(e) => setNewMediaTitle(e.target.value)} className="w-full bg-[#05070a] border border-white/10 rounded-xl px-5 py-3 text-white text-xs" placeholder="Showcase Title" />
                  </div>
                  <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Category</label>
                      <select value={newMediaCat} onChange={(e) => setNewMediaCat(e.target.value as any)} className="w-full bg-[#05070a] border border-white/10 rounded-xl px-5 py-3 text-white text-xs uppercase font-bold">
                        <option>Process</option>
                        <option>Exterior</option>
                        <option>Interior</option>
                      </select>
                  </div>
                  <div className="md:col-span-4 flex justify-end">
                      <button type="submit" className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20">Uplink from Device</button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleEditMediaSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-blue-900/10 p-8 rounded-3xl border border-blue-500/30 animate-in zoom-in-95">
                  <div className="md:col-span-4 flex justify-between items-center mb-2">
                    <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Editing Asset Cipher: {editingMedia.id}</h4>
                    <button type="button" onClick={() => setEditingMedia(null)} className="text-[9px] font-bold text-slate-500 uppercase">Cancel Edit</button>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Replace Media</label>
                      <input ref={editMediaFileRef} type="file" accept="image/*,video/*" className="w-full bg-[#05070a] border border-white/10 rounded-xl px-5 py-2.5 text-white text-xs file:bg-blue-600 file:border-none file:text-white file:text-[9px] file:uppercase file:font-bold file:px-3 file:py-1 file:rounded-full file:mr-4 file:cursor-pointer" />
                  </div>
                  <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Asset Title</label>
                      <input required type="text" value={editingMedia.title} onChange={(e) => setEditingMedia({...editingMedia, title: e.target.value})} className="w-full bg-[#05070a] border border-white/10 rounded-xl px-5 py-3 text-white text-xs" />
                  </div>
                  <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Category</label>
                      <select value={editingMedia.category} onChange={(e) => setEditingMedia({...editingMedia, category: e.target.value as any})} className="w-full bg-[#05070a] border border-white/10 rounded-xl px-5 py-3 text-white text-xs uppercase font-bold">
                        <option>Process</option>
                        <option>Exterior</option>
                        <option>Interior</option>
                      </select>
                  </div>
                  <div className="md:col-span-4 space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Internal Description</label>
                      <textarea value={editingMedia.description} onChange={(e) => setEditingMedia({...editingMedia, description: e.target.value})} className="w-full bg-[#05070a] border border-white/10 rounded-xl px-5 py-3 text-white text-xs h-20 resize-none" />
                  </div>
                  <div className="md:col-span-4 flex justify-end">
                      <button type="submit" className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">Authorize Updates</button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                 {mediaItems.map(item => (
                    <div key={item.id} className="relative aspect-square rounded-2xl overflow-hidden border border-white/5 group">
                       {item.type === 'video' ? (
                          <video src={item.url} className="w-full h-full object-cover" />
                       ) : (
                          <img src={item.url} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500" alt="" />
                       )}
                       <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center gap-2">
                          <p className="text-[8px] font-bold text-white uppercase tracking-widest line-clamp-1">{item.title}</p>
                          <div className="flex flex-col w-full gap-1.5">
                            <button onClick={() => setEditingMedia(item)} className="w-full py-1 bg-blue-600 text-[7px] font-bold text-white uppercase tracking-widest rounded-full">Edit Asset</button>
                            <button onClick={() => onDeleteMedia(item.id)} className="w-full py-1 bg-rose-600 text-[7px] font-bold text-white uppercase tracking-widest rounded-full">Remove</button>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </section>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="max-w-4xl mx-auto w-full space-y-12 animate-in fade-in slide-in-from-bottom-2">
           <section className="bg-slate-900/40 border border-white/5 p-12 rounded-[3rem] space-y-10">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-xl">🔐</div>
                 <div>
                    <h3 className="text-2xl font-display font-bold text-white uppercase tracking-tight">Security Terminal</h3>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Manage staff access</p>
                 </div>
              </div>

              <form onSubmit={handleAddUser} className="bg-black/40 border border-white/5 p-8 rounded-[2rem] space-y-6">
                 <h4 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Register New User</h4>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Username</label>
                        <input required type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="w-full bg-[#05070a] border border-white/10 rounded-xl px-5 py-3 text-white text-xs" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Security Cipher</label>
                        <input required type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} className="w-full bg-[#05070a] border border-white/10 rounded-xl px-5 py-3 text-white text-xs" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Access Level</label>
                        <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as any)} className="w-full bg-[#05070a] border border-white/10 rounded-xl px-5 py-3 text-white text-xs font-bold">
                           <option value="STAFF">STAFF</option>
                           <option value="ADMIN">ADMIN</option>
                        </select>
                    </div>
                 </div>
                 <div className="flex justify-end">
                    <button type="submit" className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">Authorize User</button>
                 </div>
              </form>

              <div className="space-y-4 pt-4 border-t border-white/5">
                 <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Authorized Accounts</h4>
                 {users.map(u => (
                    <div key={u.id} className="bg-black/40 border border-white/5 p-6 rounded-2xl flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-lg">👤</div>
                          <div>
                             <p className="text-white font-bold text-sm tracking-tight">{u.username}</p>
                             <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{u.role} Account</p>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </section>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="max-w-6xl mx-auto w-full animate-in slide-in-from-bottom-2 space-y-12">
           <section className="bg-slate-900/40 border border-white/5 p-10 rounded-[3rem] space-y-12">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-xl">🛠️</div>
                    <div>
                       <h3 className="text-2xl font-display font-bold text-white uppercase tracking-tight">Service Registry</h3>
                       <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Manage studio treatments and Stripe integration</p>
                    </div>
                 </div>
                 <button onClick={() => setShowAddService(!showAddService)} className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest">
                    {showAddService ? 'Cancel Entry' : '+ Create New Service'}
                 </button>
              </div>

              {showAddService && (
                <form onSubmit={handleAddService} className="bg-black/40 border border-blue-500/20 p-8 rounded-3xl space-y-6 animate-in zoom-in-95">
                    <h4 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">New Service Template</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Service Name</label>
                            <input required type="text" value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} className="w-full bg-[#05070a] border border-white/10 rounded-xl px-5 py-3 text-white text-xs" placeholder="e.g. Stage 2 Paint Correction" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Price Point</label>
                            <input required type="text" value={newServicePrice} onChange={(e) => setNewServicePrice(e.target.value)} className="w-full bg-[#05070a] border border-white/10 rounded-xl px-5 py-3 text-white text-xs" placeholder="e.g. From 1,800 PLN" />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Description</label>
                            <textarea required value={newServiceDesc} onChange={(e) => setNewServiceDesc(e.target.value)} className="w-full bg-[#05070a] border border-white/10 rounded-xl px-5 py-3 text-white text-xs h-24 resize-none" placeholder="Details of the treatment..." />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Category</label>
                            <input required type="text" value={newServiceCat} onChange={(e) => setNewServiceCat(e.target.value)} className="w-full bg-[#05070a] border border-white/10 rounded-xl px-5 py-3 text-white text-xs" placeholder="e.g. Restoration" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Stripe Product ID</label>
                            <input type="text" value={newStripeId} onChange={(e) => setNewStripeId(e.target.value)} className="w-full bg-[#05070a] border border-white/10 rounded-xl px-5 py-3 text-white text-xs" placeholder="prod_..." />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Stripe Payment Link</label>
                            <input type="text" value={newStripeUrl} onChange={(e) => setNewStripeUrl(e.target.value)} className="w-full bg-[#05070a] border border-white/10 rounded-xl px-5 py-3 text-white text-xs" placeholder="https://buy.stripe.com/..." />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" className="px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">Publish to Registry</button>
                    </div>
                </form>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {services.map((s, idx) => {
                    const isVisible = s.isVisible !== false;
                    return (
                      <div key={idx} className={`bg-black/40 border transition-all duration-500 p-8 rounded-3xl space-y-6 group relative ${!isVisible ? 'border-rose-500/20 bg-rose-500/5' : 'border-white/5'}`}>
                         <div className="absolute top-6 right-6 flex items-center gap-3 z-10">
                            <div className="flex flex-col items-end">
                               <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Public Visibility</label>
                               <button 
                                onClick={() => toggleServiceVisibility(idx)} 
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 ${!isVisible ? 'bg-rose-900/40 border-rose-500/50 text-rose-400' : 'bg-blue-600/20 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.2)]'}`}
                               >
                                  <span className={`w-1.5 h-1.5 rounded-full ${!isVisible ? 'bg-rose-500' : 'bg-blue-500 animate-pulse'}`}></span>
                                  <span className="text-[9px] font-bold uppercase tracking-widest">{isVisible ? 'Live' : 'Paused'}</span>
                               </button>
                            </div>
                         </div>
                         
                         <div className="space-y-4 pt-2">
                            <div className="space-y-1">
                              <label className="text-[8px] font-bold text-slate-600 uppercase tracking-widest ml-1">Service Title</label>
                              <div className="flex items-center gap-3">
                                 <input className={`flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg font-display font-bold outline-none focus:border-blue-500/50 transition-all ${!isVisible ? 'text-slate-500' : 'text-white'}`} value={s.name} onChange={(e) => {
                                    const updated = [...services];
                                    updated[idx].name = e.target.value;
                                    onUpdateServices(updated);
                                 }} />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                 <label className="text-[8px] font-bold text-slate-600 uppercase tracking-widest ml-1">Investment</label>
                                 <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-blue-500/50 transition-all font-mono" value={s.price} onChange={(e) => {
                                    const updated = [...services];
                                    updated[idx].price = e.target.value;
                                    onUpdateServices(updated);
                                 }} />
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[8px] font-bold text-slate-600 uppercase tracking-widest ml-1">Category</label>
                                 <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-blue-500/50 transition-all" value={s.category} onChange={(e) => {
                                    const updated = [...services];
                                    updated[idx].category = e.target.value;
                                    onUpdateServices(updated);
                                 }} />
                              </div>
                            </div>

                            {/* Stripe Integration Block */}
                            <div className="bg-blue-600/5 border border-blue-500/20 p-4 rounded-xl space-y-4">
                               <h5 className="text-[9px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-2">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M13.911 11.144l-.794 3.708h2.642L15.004 18l3.125-5.321h-2.12l.9-3.535h-3zm-10.911 0l-.794 3.708h2.642L4.093 18l3.125-5.321h-2.12l.9-3.535h-3zm5.455 0l-.794 3.708h2.642L9.549 18l3.125-5.321h-2.12l.9-3.535h-3z"/></svg>
                                  Stripe Integration
                               </h5>
                               <div className="space-y-3">
                                  <div className="space-y-1">
                                    <label className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">Product ID (prod_...)</label>
                                    <input className="w-full bg-black border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-white outline-none font-mono" value={s.stripeProductId || ''} onChange={(e) => {
                                       const updated = [...services];
                                       updated[idx].stripeProductId = e.target.value;
                                       onUpdateServices(updated);
                                    }} />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">Payment Link URL</label>
                                    <input className="w-full bg-black border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-white outline-none" value={s.stripeUrl || ''} onChange={(e) => {
                                       const updated = [...services];
                                       updated[idx].stripeUrl = e.target.value;
                                       onUpdateServices(updated);
                                    }} />
                                  </div>
                               </div>
                            </div>

                            <div className="pt-2 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <p className="text-[8px] font-bold text-slate-700 uppercase tracking-widest">Entry Cipher: {idx}</p>
                               <button onClick={() => onUpdateServices(services.filter((_, i) => i !== idx))} className="text-[9px] font-bold text-rose-500 hover:text-rose-400 uppercase tracking-widest">Delete Program</button>
                            </div>
                         </div>
                      </div>
                    );
                 })}
              </div>
           </section>
        </div>
      )}

      {activeTab === 'homepage' && (
        <div className="max-w-4xl mx-auto w-full animate-in slide-in-from-bottom-2 space-y-12">
           <section className="bg-slate-900/40 border border-white/5 p-12 rounded-[3rem] space-y-12">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-xl">🏠</div>
                 <div>
                    <h3 className="text-2xl font-display font-bold text-white uppercase tracking-tight">Landing Page Terminal</h3>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Titles, stats and featured assets</p>
                 </div>
              </div>
              
              <div className="space-y-8 bg-black/40 p-8 rounded-[2rem] border border-white/5">
                 <h4 className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.3em] mb-4">Hero Interface</h4>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Primary Hero Title</label>
                    <input className="w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-white text-sm" value={homepageContent.heroTitle} onChange={(e) => onUpdateHomepage({...homepageContent, heroTitle: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Secondary Hero Subtitle</label>
                    <textarea className="w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-white text-sm h-32 resize-none" value={homepageContent.heroSubtitle} onChange={(e) => onUpdateHomepage({...homepageContent, heroSubtitle: e.target.value})} />
                 </div>
                 <div className="space-y-4 pt-4">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Main Cinematic Visual</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                       <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-inner">
                          <img src={homepageContent.heroImageUrl} className="w-full h-full object-cover" alt="Hero Preview" />
                       </div>
                       <div className="space-y-4">
                          <input type="file" accept="image/*" onChange={(e) => handleHomepageImageUpload(e, 'heroImageUrl')} className="w-full text-xs text-slate-500 file:bg-blue-600 file:border-none file:text-white file:text-[9px] file:uppercase file:font-bold file:px-4 file:py-2 file:rounded-xl file:mr-4 file:cursor-pointer" />
                       </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-8 bg-black/40 p-8 rounded-[2rem] border border-white/5">
                <h4 className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.3em] mb-4">Market Stats</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {homepageContent.stats.map((stat, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex-1 space-y-1">
                        <label className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Label</label>
                        <input className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-white text-xs" value={stat.label} onChange={(e) => {
                          const updatedStats = [...homepageContent.stats];
                          updatedStats[i].label = e.target.value;
                          onUpdateHomepage({...homepageContent, stats: updatedStats});
                        }} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Value</label>
                        <input className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-white text-xs" value={stat.val} onChange={(e) => {
                          const updatedStats = [...homepageContent.stats];
                          updatedStats[i].val = e.target.value;
                          onUpdateHomepage({...homepageContent, stats: updatedStats});
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
           </section>
        </div>
      )}

      <div className="text-center mt-20">
         <p className="text-[10px] font-bold text-slate-800 uppercase tracking-[0.5em]">Studio CMS Root Access v4.1 | Stripe Dynamic Routing</p>
      </div>
    </div>
  );
};

export default Admin;