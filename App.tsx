import React, { useState, useEffect, useCallback } from 'react';
import { ViewMode, WorkshopMedia, WorkshopService, HomepageContent, WorkshopUser, Appointment } from './types';
import Navigation from './components/Navigation';
import Home from './components/Home';
import AIAdvisor from './components/AIAdvisor';
import Visualizer from './components/Visualizer';
import Services from './components/Services';
import Booking from './components/Booking';
import Gallery from './components/Gallery';
import Admin from './components/Admin';
import Contact from './components/Contact';
import Logo from './components/Logo';
import Tour from './components/Tour';
import Confirmation from './components/Confirmation';

const STORAGE_KEYS = {
  SERVICES: 'cdpl_services_v1',
  MEDIA: 'cdpl_media_v4',
  HOMEPAGE: 'cdpl_homepage_v1',
  USERS: 'cdpl_users_v1',
  APPOINTMENTS: 'cdpl_appointments_v2',
  LAST_BOOKING: 'cdpl_last_booking_v1'
};

const DEFAULT_USERS: WorkshopUser[] = [
  { id: 'initial_admin', username: 'admin_1', password: 'password123', role: 'ADMIN', createdAt: Date.now() }
];

const DEFAULT_HOMEPAGE: HomepageContent = {
  heroTitle: 'The Art of Automotive Perfection',
  heroSubtitle: 'Exclusive detailing and protection for luxury and performance vehicles in Poland. Experience CarDetailing.PL quality.',
  heroImageUrl: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=2000',
  servicesTitle: 'Signature Services',
  servicesSubtitle: 'Our meticulous process ensures every square inch of your vehicle is treated with the highest level of care using world-class products and PL standards.',
  featuredServices: [
    { title: 'Full Valet', desc: 'Our comprehensive signature treatment. Combines deep interior sanitization with a thorough exterior decontamination.', imageUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&q=80&w=800' },
    { title: 'Paint Polish', desc: 'Single-stage machine enhancement to remove light swirl marks and restore deep gloss to your paintwork.', imageUrl: 'https://images.unsplash.com/photo-1620939511593-299312d1cef4?auto=format&fit=crop&q=80&w=800' },
    { title: 'Interior Clean', desc: 'Deep steam cleaning and conditioning of all surfaces to restore that showroom smell and aesthetic.', imageUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=800' }
  ],
  stats: [
    { label: 'PL Vehicles Protected', val: '4,200+' },
    { label: 'Ceramic Applications', val: '1,850+' },
    { label: 'Poznań Workshop Hours', val: '25,000+' },
    { label: 'Verified Reviews', val: '4.9/5' }
  ]
};

// Updated with newly provided Stripe URLs and Product IDs
const INITIAL_SERVICES: WorkshopService[] = [
  { 
    name: 'Exterior Clean', 
    price: '360 PLN', 
    desc: 'Professional multi-stage hand wash using the two-bucket method.', 
    category: 'Essential Care', 
    details: ['PH-neutral snow foam pre-wash', 'Iron and tar decontamination', 'Safe hand dry', 'Tire dressing'], 
    isVisible: true, 
    stripeProductId: 'prod_TogpWdlrjvTRzg', 
    stripeUrl: 'https://buy.stripe.com/test_eVq00k6uU7qEeML3qw5wI07' 
  },
  { 
    name: 'Interior Clean', 
    price: '400 PLN', 
    desc: 'Deep vacuuming and steam cleaning of all hard surfaces.', 
    category: 'Essential Care', 
    details: ['Deep extraction of carpets', 'Dashboard sanitized', 'Interior glass polished', 'Odor neutralization'], 
    isVisible: true, 
    stripeProductId: 'prod_Togqp9UkaNachx', 
    stripeUrl: 'https://buy.stripe.com/test_3cI3cw4mM4esdIH3qw5wI06' 
  },
  { 
    name: 'Full Valet', 
    price: '850 PLN', 
    desc: 'Our comprehensive signature treatment for total vehicle rejuvenation.', 
    category: 'Premium Restoration', 
    details: ['Clay bar treatment', 'High-grade Carnauba wax', 'Exhaust tips polished', 'Leather ceramic coating'], 
    isVisible: true, 
    stripeProductId: 'prod_TogruchfF4tNg1', 
    stripeUrl: 'https://buy.stripe.com/test_8x26oIf1q26k6gf3qw5wI05' 
  },
  { 
    name: 'Paint Polish', 
    price: 'From 1,200 PLN', 
    desc: 'Machine enhancement to restore deep gloss and remove surface imperfections.', 
    category: 'Premium Restoration', 
    details: ['Single-stage DA polishing', 'Light swirl removal', 'Surface degreasing', 'Paint depth measurement'], 
    isVisible: true, 
    stripeProductId: '', 
    stripeUrl: '' 
  },
  { 
    name: 'Engine Bay Detail', 
    price: '450 PLN', 
    desc: 'Safe cleaning and dressing of the engine compartment.', 
    category: 'Premium Restoration', 
    details: ['Steam cleaning of components', 'Electrical protection', 'Plastic & rubber dressing', 'Aluminum polishing'], 
    isVisible: true, 
    stripeProductId: 'prod_TogsIrVzLuR68y', 
    stripeUrl: 'https://buy.stripe.com/test_4gM8wQ9H68uI7kj7GM5wI04' 
  }
];

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>(ViewMode.HOME);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isTourActive, setIsTourActive] = useState(false);

  const [workshopMedia, setWorkshopMedia] = useState<WorkshopMedia[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MEDIA);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [workshopServices, setWorkshopServices] = useState<WorkshopService[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SERVICES);
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  const [homepageContent, setHomepageContent] = useState<HomepageContent>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HOMEPAGE);
    return saved ? JSON.parse(saved) : DEFAULT_HOMEPAGE;
  });

  const [workshopUsers, setWorkshopUsers] = useState<WorkshopUser[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    return saved ? JSON.parse(saved) : [];
  });

  // Stripe Success Auto-Verification
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      const pendingId = localStorage.getItem('cdpl_pending_appt_v1');
      if (pendingId) {
        setAppointments(prev => prev.map(a => a.id === pendingId ? { ...a, status: 'CONFIRMED' } : a));
        localStorage.removeItem('cdpl_pending_appt_v1');
      }
      setView(ViewMode.CONFIRMATION);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(workshopMedia));
  }, [workshopMedia]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(workshopServices));
  }, [workshopServices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HOMEPAGE, JSON.stringify(homepageContent));
  }, [homepageContent]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(workshopUsers));
  }, [workshopUsers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
  }, [appointments]);

  const toggleService = (serviceName: string) => {
    setSelectedServices(prev => prev.includes(serviceName) ? prev.filter(s => s !== serviceName) : [...prev, serviceName]);
  };

  const handleUpdateAppointments = (newAppts: Appointment[]) => setAppointments(newAppts);
  const handleDeleteAppointment = useCallback((id: string) => setAppointments(prev => prev.filter(a => a.id !== id)), []);

  const renderContent = () => {
    switch (view) {
      case ViewMode.HOME: return <Home content={homepageContent} onNavigate={setView} onStartTour={() => setIsTourActive(true)} />;
      case ViewMode.SERVICES: return <Services selectedServices={selectedServices} onToggleService={toggleService} onNavigate={setView} customServices={workshopServices} />;
      case ViewMode.GALLERY: return <Gallery customMedia={workshopMedia} />;
      case ViewMode.ADVISOR: return <AIAdvisor />;
      case ViewMode.VISUALIZER: return <Visualizer />;
      case ViewMode.CONTACT: return <Contact />;
      case ViewMode.BOOKING: return <Booking selectedServices={selectedServices} onToggleService={toggleService} onAddAppointment={(a) => setAppointments(prev => [a, ...prev])} serviceRegistry={workshopServices} />;
      case ViewMode.CONFIRMATION: return <Confirmation onNavigate={setView} />;
      case ViewMode.ADMIN: return <Admin services={workshopServices} mediaItems={workshopMedia} homepageContent={homepageContent} users={workshopUsers} appointments={appointments} onUpdateServices={setWorkshopServices} onAddMedia={(m) => setWorkshopMedia(prev => [m, ...prev])} onUpdateMedia={(m) => setWorkshopMedia(prev => prev.map(old => old.id === m.id ? m : old))} onDeleteMedia={(id) => setWorkshopMedia(prev => prev.filter(m => m.id !== id))} onUpdateHomepage={setHomepageContent} onUpdateUsers={setWorkshopUsers} onUpdateAppointments={handleUpdateAppointments} onDeleteAppointment={handleDeleteAppointment} />;
      default: return <Home content={homepageContent} onNavigate={setView} onStartTour={() => setIsTourActive(true)} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#05070a] text-slate-50 selection:bg-blue-500/30">
      <Navigation currentView={view} onViewChange={setView} selectionCount={selectedServices.length} />
      <main className="flex-1 flex flex-col pt-16">{renderContent()}</main>
      {isTourActive && <Tour onClose={() => setIsTourActive(false)} onNavigate={(v) => { setView(v); setIsTourActive(false); }} />}
      <footer className="py-20 border-t border-white/5 bg-[#030508]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 items-start">
          <div className="flex flex-col gap-6">
            <Logo className="h-10" />
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs">Meticulous automotive restoration and high-end protection services for luxury vehicles in Poznań, Poland. Established 2012.</p>
          </div>
          <div className="flex flex-col gap-6">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-blue-500">Workshop</h4>
            <div className="flex flex-col gap-3">
              <a href="https://www.google.com/maps/place/Pozna%C5%84,+Poland/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                <span className="text-sm opacity-50 group-hover:opacity-100 transition-opacity">📍</span>
                <p className="text-slate-400 text-xs hover:text-blue-400 transition-colors underline decoration-blue-500/20 underline-offset-4">Poznań, Poland (By Appt)</p>
              </a>
              <a href="mailto:contactcardetailing.pl@gmail.com" className="flex items-center gap-3 group">
                <span className="text-sm opacity-50 group-hover:opacity-100 transition-opacity">📧</span>
                <p className="text-slate-400 text-xs hover:text-blue-400 transition-colors">contactcardetailing.pl@gmail.com</p>
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-blue-500">Navigation</h4>
            <div className="grid grid-cols-1 gap-3 text-xs text-slate-500">
              <button onClick={() => setView(ViewMode.SERVICES)} className="text-left hover:text-blue-400 transition-colors uppercase tracking-widest font-bold text-[10px]">Services</button>
              <button onClick={() => setView(ViewMode.ADVISOR)} className="text-left hover:text-blue-400 transition-colors uppercase tracking-widest font-bold text-[10px]">AI Advisor</button>
              <button onClick={() => setView(ViewMode.BOOKING)} className="text-left text-slate-300 hover:text-blue-400 transition-colors uppercase tracking-[0.2em] font-bold text-[10px] mt-2 border-l-2 border-blue-500 pl-3">Book Appointment</button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[9px] font-bold uppercase tracking-[0.4em] text-slate-700">
          <span>© 2024 CarDetailing.PL • Polish Studio Standards • Poznań, Poland</span>
        </div>
      </footer>
    </div>
  );
};

export default App;