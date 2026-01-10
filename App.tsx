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

const STORAGE_KEYS = {
  SERVICES: 'cdpl_services_v1',
  MEDIA: 'cdpl_media_v4',
  HOMEPAGE: 'cdpl_homepage_v1',
  USERS: 'cdpl_users_v1',
  APPOINTMENTS: 'cdpl_appointments_v2'
};

const DEFAULT_USERS: WorkshopUser[] = [
  { 
    id: 'initial_admin', 
    username: 'admin_1', 
    password: 'password123', 
    role: 'ADMIN', 
    createdAt: Date.now() 
  }
];

const DEFAULT_HOMEPAGE: HomepageContent = {
  heroTitle: 'The Art of Automotive Perfection',
  heroSubtitle: 'Exclusive detailing and protection for luxury and performance vehicles in Poland. Experience CarDetailing.PL quality.',
  heroImageUrl: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=2000',
  servicesTitle: 'Signature Services',
  servicesSubtitle: 'Our meticulous process ensures every square inch of your vehicle is treated with the highest level of care using world-class products and PL standards.',
  featuredServices: [
    { 
      title: 'Full Valet', 
      desc: 'Our comprehensive signature treatment. Combines deep interior sanitization with a thorough exterior decontamination.',
      imageUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&q=80&w=800'
    },
    { 
      title: 'Paint Polish', 
      desc: 'Single-stage machine enhancement to remove light swirl marks and restore deep gloss to your paintwork.',
      imageUrl: 'https://images.unsplash.com/photo-1620939511593-299312d1cef4?auto=format&fit=crop&q=80&w=800'
    },
    { 
      title: 'Interior Clean', 
      desc: 'Deep steam cleaning and conditioning of all surfaces to restore that showroom smell and aesthetic.',
      imageUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=800'
    }
  ],
  stats: [
    { label: 'PL Vehicles Protected', val: '4,200+' },
    { label: 'Ceramic Applications', val: '1,850+' },
    { label: 'Poznań Workshop Hours', val: '25,000+' },
    { label: 'Verified Reviews', val: '4.9/5' }
  ]
};

const INITIAL_SERVICES: WorkshopService[] = [
  { 
    name: 'Exterior Clean', 
    price: 'From 200 PLN', 
    desc: 'Professional multi-stage hand wash using the two-bucket method.',
    category: 'Essential Care',
    details: ['PH-neutral snow foam pre-wash', 'Iron and tar decontamination', 'Safe hand dry', 'Tire dressing']
  },
  { 
    name: 'Interior Clean', 
    price: 'From 250 PLN', 
    desc: 'Deep vacuuming and steam cleaning of all hard surfaces.',
    category: 'Essential Care',
    details: ['Deep extraction of carpets', 'Dashboard sanitized', 'Interior glass polished', 'Odor neutralization']
  },
  { 
    name: 'Full Valet', 
    price: 'From 700 PLN', 
    desc: 'Our comprehensive signature treatment for total vehicle rejuvenation.',
    category: 'Premium Restoration',
    details: ['Clay bar treatment', 'High-grade Carnauba wax', 'Exhaust tips polished', 'Leather ceramic coating']
  },
  { 
    name: 'Paint Polish', 
    price: 'From 1,200 PLN', 
    desc: 'Machine enhancement to restore deep gloss and remove surface imperfections.',
    category: 'Premium Restoration',
    details: ['Single-stage DA polishing', 'Light swirl removal', 'Surface degreasing', 'Paint depth measurement']
  },
  { 
    name: 'Engine Bay Detail', 
    price: '400 PLN', 
    desc: 'Safe cleaning and dressing of the engine compartment.',
    category: 'Premium Restoration',
    details: ['Steam cleaning of components', 'Electrical protection', 'Plastic & rubber dressing', 'Aluminum polishing']
  }
];

const INITIAL_MEDIA: WorkshopMedia[] = [
  {
    id: '1',
    url: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&q=80&w=1200',
    category: 'Process',
    title: 'Decontamination Wash',
    description: 'A multi-stage hand wash to safely remove road grime without inducing swirl marks. Performed in our Poznań facility.',
    type: 'image',
    timestamp: Date.now()
  }
];

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>(ViewMode.HOME);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isTourActive, setIsTourActive] = useState(false);

  const [workshopMedia, setWorkshopMedia] = useState<WorkshopMedia[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MEDIA);
    return saved ? JSON.parse(saved) : INITIAL_MEDIA;
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  const toggleService = (serviceName: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceName) 
        ? prev.filter(s => s !== serviceName) 
        : [...prev, serviceName]
    );
  };

  const handleUpdateServices = (newServices: WorkshopService[]) => {
    setWorkshopServices(newServices);
  };

  const handleAddMedia = (item: WorkshopMedia) => {
    setWorkshopMedia(prev => [item, ...prev]);
  };

  const handleUpdateMedia = (updatedItem: WorkshopMedia) => {
    setWorkshopMedia(prev => prev.map(m => m.id === updatedItem.id ? updatedItem : m));
  };

  const handleDeleteMedia = (id: string) => {
    setWorkshopMedia(prev => prev.filter(m => m.id !== id));
  };

  const handleAddAppointment = (appt: Appointment) => {
    setAppointments(prev => [appt, ...prev]);
    // FIX: Clear the selected services after the booking is confirmed
    setSelectedServices([]);
  };

  const handleUpdateAppointments = (newAppts: Appointment[]) => {
    setAppointments(newAppts);
  };

  const handleDeleteAppointment = useCallback((id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
  }, []);

  const handleUpdateUsers = (newUsers: WorkshopUser[]) => {
    setWorkshopUsers(newUsers);
  };

  const renderContent = () => {
    switch (view) {
      case ViewMode.HOME:
        return <Home content={homepageContent} onNavigate={setView} onStartTour={() => setIsTourActive(true)} />;
      case ViewMode.SERVICES:
        return <Services selectedServices={selectedServices} onToggleService={toggleService} onNavigate={setView} customServices={workshopServices} />;
      case ViewMode.GALLERY:
        return <Gallery customMedia={workshopMedia} />;
      case ViewMode.ADVISOR:
        return <AIAdvisor />;
      case ViewMode.VISUALIZER:
        return <Visualizer />;
      case ViewMode.CONTACT:
        return <Contact />;
      case ViewMode.BOOKING:
        return <Booking 
          selectedServices={selectedServices} 
          onToggleService={toggleService} 
          onAddAppointment={handleAddAppointment} 
          serviceRegistry={workshopServices}
        />;
      case ViewMode.ADMIN:
        return <Admin 
          services={workshopServices} 
          mediaItems={workshopMedia} 
          homepageContent={homepageContent}
          users={workshopUsers}
          appointments={appointments}
          onUpdateServices={handleUpdateServices} 
          onAddMedia={handleAddMedia}
          onUpdateMedia={handleUpdateMedia}
          onDeleteMedia={handleDeleteMedia}
          onUpdateHomepage={setHomepageContent}
          onUpdateUsers={handleUpdateUsers}
          onUpdateAppointments={handleUpdateAppointments}
          onDeleteAppointment={handleDeleteAppointment}
        />;
      default:
        return <Home content={homepageContent} onNavigate={setView} onStartTour={() => setIsTourActive(true)} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#05070a] text-slate-50 selection:bg-blue-500/30">
      <Navigation currentView={view} onViewChange={setView} selectionCount={selectedServices.length} />
      <main className="flex-1 flex flex-col pt-16">{renderContent()}</main>
      {isTourActive && <Tour onClose={() => setIsTourActive(false)} onStepChange={setView} onNavigate={(v) => { setView(v); setIsTourActive(false); }} />}
      <footer className="py-20 border-t border-white/5 bg-[#030508]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 items-start">
          <div className="flex flex-col gap-6">
            <Logo className="h-10" />
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
              Meticulous automotive restoration and high-end protection services for luxury vehicles in Poznań, Poland. Established 2012.
            </p>
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
              <a href="tel:+447495561482" className="flex items-center gap-3 group">
                <span className="text-sm opacity-50 group-hover:opacity-100 transition-opacity">📞</span>
                <p className="text-slate-400 text-xs hover:text-blue-400 transition-colors">+44 7495 561482</p>
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-blue-500">Follow Us</h4>
            <div className="flex flex-col gap-3">
              {[
                { name: 'Instagram', handle: 'car_detailing.pl', url: 'https://www.instagram.com/car_detailing.pl?igsh=MWl4MmQ2amhwaGQxZg%3D%3D&utm_source=qr', icon: '📸' },
                { name: 'TikTok', handle: '@cardetailing.pl', url: 'https://www.tiktok.com/@cardetailing.pl?_r=1&_t=ZN-92uhuTa2OyU', icon: '🎵' },
                { name: 'Facebook', handle: 'CarDetailing.PL', url: 'https://www.facebook.com/profile.php?id=61586543450859', icon: '👥' },
                { name: 'YouTube', handle: '@cardetailingpl', url: 'https://youtube.com/@cardetailingpl?si=uxYw9Yfr-ZJ4A2YN', icon: '🎥' }
              ].map((social) => (
                <a key={social.name} href={social.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                  <span className="text-sm opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all">{social.icon}</span>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-white transition-colors uppercase tracking-widest">{social.name}</span>
                    <span className="text-[8px] text-slate-600 uppercase tracking-tighter">{social.handle}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-blue-500">Navigation</h4>
            <div className="grid grid-cols-1 gap-3 text-xs text-slate-500">
              <button onClick={() => setView(ViewMode.SERVICES)} className="text-left hover:text-blue-400 transition-colors uppercase tracking-widest font-bold text-[10px]">Services</button>
              <button onClick={() => setView(ViewMode.GALLERY)} className="text-left hover:text-blue-400 transition-colors uppercase tracking-widest font-bold text-[10px]">Gallery</button>
              <button onClick={() => setView(ViewMode.ADVISOR)} className="text-left hover:text-blue-400 transition-colors uppercase tracking-widest font-bold text-[10px]">AI Advisor</button>
              <button onClick={() => setView(ViewMode.CONTACT)} className="text-left hover:text-blue-400 transition-colors uppercase tracking-widest font-bold text-[10px]">Contact</button>
              <button onClick={() => setView(ViewMode.BOOKING)} className="text-left text-slate-300 hover:text-blue-400 transition-colors uppercase tracking-[0.2em] font-bold text-[10px] mt-2 border-l-2 border-blue-500 pl-3">Book Appointment</button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[9px] font-bold uppercase tracking-[0.4em] text-slate-700">
          <span className="flex items-center gap-1">© 2024 CarDetailing.PL • Polish Studio Standards • <a href="https://www.google.com/maps/place/Pozna%C5%84,+Poland/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors ml-1">Poznań, Poland</a></span>
          <div className="flex gap-8">
            <a href="#" className="hover:text-blue-500 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;