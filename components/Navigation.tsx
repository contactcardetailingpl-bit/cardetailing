
import React, { useState, useEffect, useRef } from 'react';
import { ViewMode, MembershipSignup } from '../types';
import Logo from './Logo';

interface NavigationProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  selectionCount: number;
  member?: MembershipSignup | null;
  onMemberLogin: (email: string) => boolean;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange, selectionCount, member, onMemberLogin }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { id: ViewMode.HOME, label: 'Home', icon: '🏠' },
    { id: ViewMode.SERVICES, label: 'Services', icon: '🛠️' },
    { id: ViewMode.MEMBERSHIP, label: 'Membership', icon: '💎' },
    { id: ViewMode.GALLERY, label: 'Gallery', icon: '🖼️' },
    { id: ViewMode.ADVISOR, label: 'AI Advisor', icon: '🤖' },
    { id: ViewMode.VISUALIZER, label: 'Visualizer', icon: '🚗' },
    { id: ViewMode.CONTACT, label: 'Contact Us', icon: '📞' },
    { id: ViewMode.BOOKING, label: 'Book Appointment', icon: '📅' },
  ];

  const adminItem = { id: ViewMode.ADMIN, label: 'Staff Portal', icon: '🔐' };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigate = (view: ViewMode) => {
    onViewChange(view);
    setIsOpen(false);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onMemberLogin(loginEmail);
    if (success) {
      setShowLoginModal(false);
      setLoginEmail('');
      setLoginError('');
      setIsOpen(false);
    } else {
      setLoginError('Membership not found with this email.');
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-[#05070a]/80 backdrop-blur-xl border-b border-white/5 h-20 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        
        <div 
          className="flex items-center h-full cursor-pointer group"
          onClick={() => handleNavigate(ViewMode.HOME)}
        >
          <Logo className="h-10 group-hover:scale-105 transition-transform duration-500" />
        </div>

        <div className="flex items-center gap-6">
          {member ? (
            <button 
              onClick={() => handleNavigate(ViewMode.MEMBER_PORTAL)}
              className="hidden md:flex items-center gap-3 px-6 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 transition-all hover:bg-blue-500/20"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest">Hi, {member.name.split(' ')[0]}</span>
              <span className="text-lg">👤</span>
            </button>
          ) : (
            <button 
              onClick={() => setShowLoginModal(true)}
              className="hidden md:block text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
            >
              Member Login
            </button>
          )}

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`flex items-center gap-3 px-5 py-2.5 rounded-full border transition-all duration-300 ${
                isOpen 
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/30 hover:bg-white/10'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] pl-1">
                {isOpen ? 'Close' : 'Menu'}
              </span>
              <div className="flex flex-col gap-1 w-4">
                <span className={`h-0.5 w-full bg-current transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                <span className={`h-0.5 w-full bg-current transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`}></span>
                <span className={`h-0.5 w-full bg-current transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
              </div>
              {selectionCount > 0 && !isOpen && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white shadow-lg animate-bounce">
                  {selectionCount}
                </span>
              )}
            </button>

            {isOpen && (
              <div className="absolute right-0 mt-4 w-72 bg-[#080a0f]/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-top-4 fade-in duration-300">
                <div className="p-4 border-b border-white/5 bg-white/5">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] px-4">Studio Concierge</p>
                </div>
                
                <div className="p-2 space-y-1">
                  {member && (
                    <button
                      onClick={() => handleNavigate(ViewMode.MEMBER_PORTAL)}
                      className="w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-200 bg-blue-600/10 text-blue-400 mb-2"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-lg">👤</span>
                        <span className="text-xs font-bold uppercase tracking-widest">My Member Portal</span>
                      </div>
                    </button>
                  )}

                  {navItems.map((item) => {
                    const isActive = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavigate(item.id)}
                        className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-200 group ${
                          isActive 
                          ? 'bg-blue-600/10 text-blue-400' 
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-lg opacity-70 group-hover:scale-110 transition-transform">{item.icon}</span>
                          <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
                        </div>
                        {item.id === ViewMode.BOOKING && selectionCount > 0 && (
                          <span className="bg-blue-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
                            {selectionCount}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  <div className="h-[1px] bg-white/5 mx-4 my-2"></div>

                  <button
                    onClick={() => handleNavigate(adminItem.id)}
                    className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-200 group ${
                      currentView === adminItem.id 
                      ? 'bg-amber-500/10 text-amber-400' 
                      : 'text-slate-50 hover:bg-amber-500/5 hover:text-amber-400'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-lg opacity-70 group-hover:scale-110 transition-transform">{adminItem.icon}</span>
                      <span className="text-xs font-bold uppercase tracking-widest">{adminItem.label}</span>
                    </div>
                  </button>
                </div>

                <div className="p-6 bg-white/5 flex flex-col gap-4">
                  <div className="flex justify-between items-center text-[8px] font-bold text-slate-600 uppercase tracking-widest">
                    <span>Poznań Studio</span>
                    <span className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                      Online
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showLoginModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#05070a]/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-white/10 max-w-sm w-full rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-6 right-6 text-slate-500 hover:text-white"
            >
              ✕
            </button>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">💎</div>
              <h3 className="text-2xl font-display font-bold text-white uppercase tracking-tight">Studio Login</h3>
              <p className="text-slate-500 text-xs mt-2 uppercase tracking-widest">Exclusively for Program Members</p>
            </div>
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Email Address</label>
                <input 
                  type="email" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  className="w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              {loginError && <p className="text-rose-500 text-[10px] font-bold uppercase text-center">{loginError}</p>}
              <button className="w-full py-5 bg-blue-600 text-white font-bold uppercase tracking-widest rounded-xl hover:bg-blue-500 shadow-xl shadow-blue-500/20">
                Enter Portal
              </button>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
