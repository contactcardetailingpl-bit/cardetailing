import React, { useState } from 'react';
import { WorkshopService, ViewMode } from '../types';

interface ServicesProps {
  selectedServices: string[];
  onToggleService: (name: string) => void;
  onNavigate?: (view: ViewMode) => void;
  customServices?: WorkshopService[];
}

const Services: React.FC<ServicesProps> = ({ selectedServices, onToggleService, onNavigate, customServices = [] }) => {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (name: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleCheckout = () => {
    if (onNavigate) {
      onNavigate(ViewMode.BOOKING);
    }
  };

  // Group services by category and filter by visibility
  const categories: Record<string, WorkshopService[]> = {};
  
  // Filter for only visible services
  const visibleServices = customServices.filter(s => s.isVisible !== false);

  visibleServices.forEach(s => {
    if (!categories[s.category]) categories[s.category] = [];
    categories[s.category].push(s);
  });

  return (
    <div className="flex-1 px-6 py-20 max-w-7xl mx-auto w-full animate-in fade-in duration-700 pb-32">
      <div className="text-center mb-24">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-6">
          Premium Automotive Spa
        </div>
        <h2 className="text-5xl font-display font-bold mb-6 uppercase tracking-tight">Professional Services</h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Tailored detailing solutions for enthusiasts who demand perfection. We use only the finest pH-neutral chemicals and precision tools.
        </p>
      </div>

      <div className="space-y-32">
        {Object.entries(categories).length === 0 ? (
          <div className="py-24 text-center">
             <p className="text-slate-500 italic uppercase tracking-widest text-xs">Our restoration catalog is currently being updated. Please check back shortly.</p>
          </div>
        ) : (
          Object.entries(categories).map(([title, items], idx) => (
            <div key={idx} className="flex flex-col gap-12">
              <div className="flex items-center justify-between border-l-4 border-blue-500 pl-6">
                  <h3 className="text-2xl font-display font-bold uppercase tracking-widest text-blue-500">
                  {title}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">{items.length} Programs Available</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {items.map((item, i) => {
                  const isExpanded = expandedItems[item.name];
                  const isSelected = selectedServices.includes(item.name);
                  return (
                    <div key={i} className={`group p-8 border rounded-2xl transition-all duration-300 flex flex-col gap-4 ${isSelected ? 'bg-blue-600/10 border-blue-500/50 shadow-2xl shadow-blue-500/10 scale-[1.02]' : 'bg-slate-900/50 border-white/5 hover:bg-slate-800/80'}`}>
                      <div className="flex justify-between items-start">
                        <h4 className={`text-xl font-bold font-display uppercase tracking-tight leading-tight max-w-[70%] ${isSelected ? 'text-blue-400' : ''}`}>{item.name}</h4>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-blue-500 bg-blue-500/10'}`}>
                          {isSelected ? 'SELECTED' : 'AVAILABLE'}
                        </span>
                      </div>
                      
                      <p className={`text-slate-400 text-sm leading-relaxed transition-all duration-300 ${isExpanded ? '' : 'line-clamp-2'}`}>
                        {item.desc}
                      </p>
                      
                      <div className="flex gap-4 items-center">
                          <button 
                          onClick={() => toggleExpand(item.name)}
                          className="text-left text-[10px] font-bold uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                          >
                          {isExpanded ? 'Hide Specs' : 'Full Specs'}
                          <svg 
                              className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                          >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                          </svg>
                          </button>
                      </div>

                      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                        <ul className="space-y-2 border-t border-white/5 pt-4">
                          {item.details.map((detail, dIdx) => (
                            <li key={dIdx} className="flex items-start gap-2 text-xs text-slate-500">
                              <span className="text-blue-500 mt-0.5">•</span>
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-auto pt-6 border-t border-white/5 flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-tighter text-slate-500 font-bold">Investment</span>
                          <span className="font-bold text-white tracking-tight text-lg">{item.price}</span>
                        </div>
                        <div className="flex gap-2">
                            <button 
                              onClick={() => onToggleService(item.name)}
                              className={`h-12 w-12 rounded-full border flex items-center justify-center transition-all ${
                              isSelected 
                              ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20 scale-110' 
                              : 'border-white/10 text-slate-500 group-hover:text-blue-500 group-hover:border-blue-500/50'
                              }`}
                          >
                              {isSelected ? (
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                              ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                              </svg>
                              )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {selectedServices.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-2xl z-[90] animate-in slide-in-from-bottom-8 duration-500">
          <div className="bg-[#080a0f]/80 backdrop-blur-2xl border border-blue-500/30 p-4 md:p-6 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-between gap-6">
            <div className="flex items-center gap-4 px-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-xl shadow-lg shadow-blue-500/20">
                🛒
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold font-display text-lg leading-none">
                  {selectedServices.length} {selectedServices.length === 1 ? 'Service' : 'Services'}
                </span>
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">Ready for restoration</span>
              </div>
            </div>

            <button 
              onClick={handleCheckout}
              className="px-8 md:px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold uppercase tracking-[0.2em] text-[11px] transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center gap-3"
            >
              Proceed to Booking
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
