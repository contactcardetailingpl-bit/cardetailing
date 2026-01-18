import React, { useState, useEffect } from 'react';
import { ViewMode, HomepageContent } from '../types';

interface HomeProps {
  content: HomepageContent;
  onNavigate: (view: ViewMode) => void;
  onStartTour?: () => void;
}

const reviews = [
  {
    name: "Marek Wiśniewski",
    car: "Porsche 911 (992) GT3",
    text: "The paint correction performed at CarDetailing.PL is truly world-class. They managed to remove micro-swirls I thought were permanent. The ceramic coating finish is like a mirror.",
    rating: 5,
    service: "Paint Correction & Ceramic"
  },
  {
    name: "Karolina Nowak",
    car: "Tesla Model S Plaid",
    text: "Exceptional attention to detail in the interior. As a daily driver, my car sees a lot of use, but after the full valet, it felt like it had just rolled off the delivery truck. Highly recommended.",
    rating: 5,
    service: "Full Valet"
  },
  {
    name: "Jakub Kowalski",
    car: "BMW M4 Competition",
    text: "The AI Advisor helped me choose the right leather protection for my Silverstone interior. The results of the conditioning treatment are fantastic—the leather is supple and smells factory-fresh.",
    rating: 5,
    service: "Interior Restoration"
  }
];

const Home: React.FC<HomeProps> = ({ content, onNavigate, onStartTour }) => {
  const [currentReview, setCurrentReview] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentReview((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col animate-in fade-in duration-1000">
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden px-6">
        <div className="absolute inset-0 z-0">
          <img 
            src={content.heroImageUrl} 
            alt="Luxury vehicle in studio" 
            className="w-full h-full object-cover opacity-60 grayscale-[0.2] transition-transform duration-[20000ms] scale-105"
            style={{ animation: 'slowZoom 20s linear infinite alternate' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#05070a]/60 via-[#05070a]/20 to-[#05070a]"></div>
        </div>

        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400 mb-8 backdrop-blur-sm">
            Mastery in Every Reflection | Poznań
          </div>
          <h1 className="text-6xl md:text-8xl font-display font-bold mb-8 tracking-tighter uppercase leading-none">
            {content.heroTitle.split(' ').map((word, i) => (
               <span key={i} className={i === content.heroTitle.split(' ').length - 1 ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-slate-100 to-blue-500' : ''}>
                 {word}{' '}
               </span>
            ))}
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-12 font-light leading-relaxed">
            {content.heroSubtitle}
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <button 
              onClick={() => onNavigate(ViewMode.SERVICES)}
              className="px-10 py-5 bg-blue-600 text-white rounded font-bold uppercase tracking-widest hover:bg-blue-500 transition-all shadow-2xl shadow-blue-500/20"
            >
              Book Appointment
            </button>
            <button 
              onClick={onStartTour}
              className="px-10 py-5 bg-white/5 text-white rounded font-bold uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10 backdrop-blur-md flex items-center gap-3"
            >
              Launch Studio Tour
            </button>
          </div>
        </div>
      </section>

      <section className="px-6 py-32 bg-[#080a0f]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-4xl font-display font-bold mb-4 uppercase tracking-tight text-white">{content.servicesTitle}</h2>
              <p className="text-slate-400">{content.servicesSubtitle}</p>
            </div>
            <button 
                onClick={() => onNavigate(ViewMode.SERVICES)} 
                className="text-blue-500 font-bold uppercase tracking-widest text-sm hover:underline transition-all"
            >
                View All Services →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {content.featuredServices.map((s, i) => (
              <div key={i} className="group relative overflow-hidden rounded-xl aspect-[4/5] bg-slate-900 border border-white/5">
                <img src={s.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 group-hover:scale-110 transition-all duration-700" alt={s.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-8">
                  <h3 className="text-2xl font-display font-bold mb-3 uppercase tracking-tight text-white">{s.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6 group-hover:text-white transition-colors">{s.desc}</p>
                  <button onClick={() => onNavigate(ViewMode.SERVICES)} className="text-xs font-bold uppercase tracking-widest text-blue-500 border-b border-blue-500/0 group-hover:border-blue-500/100 transition-all">Details</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-32 bg-[#05070a]">
        <div className="max-w-7xl mx-auto border-t border-white/5 pt-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {content.stats.map((stat, i) => (
              <div key={i}>
                <div className="text-4xl font-display font-bold text-white mb-2">{stat.val}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-32 bg-[#080a0f] border-t border-white/5 text-center">
        <div className="max-w-4xl mx-auto">
          <span className="text-blue-500 font-bold text-[10px] uppercase tracking-[0.4em] mb-12 block">Client Validation</span>
          <div className="animate-in fade-in duration-1000 min-h-[200px] flex flex-col justify-center">
            <p className="text-2xl text-slate-200 font-light leading-relaxed italic mb-12">
              "{reviews[currentReview].text}"
            </p>
            <h4 className="text-white font-display font-bold uppercase tracking-widest mb-1">{reviews[currentReview].name}</h4>
            <p className="text-blue-500 text-[10px] font-bold uppercase tracking-widest">{reviews[currentReview].car}</p>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes slowZoom {
          from { transform: scale(1.0); }
          to { transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
};

export default Home;