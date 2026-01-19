
import React, { useState } from 'react';
import { ViewMode, MembershipSignup } from '../types';

interface MembershipProps {
  onNavigate: (view: ViewMode) => void;
}

interface Tier {
  name: string;
  price: string;
  period: string;
  color: string;
  icon: string;
  tagline: string;
  stripeUrl: string;
  popular?: boolean;
  benefits: string[];
}

const Membership: React.FC<MembershipProps> = ({ onNavigate }) => {
  const [step, setStep] = useState<'tiers' | 'info'>('tiers');
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const tiers: Tier[] = [
    {
      name: 'Silver Membership',
      price: '250 PLN',
      period: 'per month',
      color: 'from-slate-400 to-slate-600',
      icon: '🥈',
      tagline: 'Priority Maintenance',
      stripeUrl: 'https://buy.stripe.com/test_28EcN69H66mA6gfe5a5wI0a',
      benefits: [
        '2x Maintenance washes per month (exterior clean, quick interior wipe down and hoover)',
        'Priority Client Status',
        'Priority booking',
        'Same week availability',
        'Emergency slots'
      ]
    },
    {
      name: 'Gold Membership',
      price: '500 PLN',
      period: 'per month',
      color: 'from-amber-400 to-amber-600',
      icon: '🥇',
      popular: true,
      tagline: 'Interior Care Club',
      stripeUrl: 'https://buy.stripe.com/test_7sY28s06w7qE9srd165wI09',
      benefits: [
        '2x Maintenance washes per month (exterior clean, quick interior wipe down and hoover)',
        'Priority Client Status',
        'Priority booking',
        'Same week availability',
        'Emergency slots',
        '1 monthly deep interior clean',
        'Covers 2 cars in the household'
      ]
    },
    {
      name: 'Platinum Membership',
      price: '900 PLN',
      period: 'per month',
      color: 'from-blue-400 to-blue-700',
      icon: '💎',
      tagline: 'Ultimate Collection Care',
      stripeUrl: 'https://buy.stripe.com/test_3cI8wQdXm4es8onbX25wI08',
      benefits: [
        '2x Maintenance washes per month (exterior clean, quick interior wipe down and hoover)',
        'Priority Client Status',
        'Priority booking',
        'Same week availability',
        'Emergency slots',
        '1 monthly deep interior clean',
        'Covers up to 4 cars in the household',
        '20% discount on any other services'
      ]
    }
  ];

  const handleSelectTier = (tier: Tier) => {
    setSelectedTier(tier);
    setStep('info');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePaymentRedirect = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTier) {
      // Capture the lead information locally for the admin panel
      const newSignup: MembershipSignup = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        tier: selectedTier.name,
        price: selectedTier.price,
        timestamp: Date.now()
      };

      const existing = JSON.parse(localStorage.getItem('cdpl_memberships_v1') || '[]');
      localStorage.setItem('cdpl_memberships_v1', JSON.stringify([newSignup, ...existing]));

      // Redirect to Stripe
      window.location.href = selectedTier.stripeUrl;
    }
  };

  if (step === 'info' && selectedTier) {
    return (
      <div className="flex-1 flex flex-col px-6 py-20 max-w-4xl mx-auto w-full animate-in slide-in-from-bottom-8 duration-700">
        <button 
          onClick={() => setStep('tiers')}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 hover:text-white transition-colors mb-12 group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Programs
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Form Side */}
          <div className="lg:col-span-7 space-y-10">
            <div>
              <h2 className="text-4xl font-display font-bold text-white uppercase tracking-tight mb-2">Member <span className="text-blue-500">Registration</span></h2>
              <p className="text-slate-400 text-sm">Please provide your details to personalize your membership experience.</p>
            </div>

            <form onSubmit={handlePaymentRedirect} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Full Name</label>
                <input 
                  required 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl px-6 py-5 text-white outline-none focus:border-blue-500 transition-colors" 
                  placeholder="e.g. Robert Lewandowski" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Email Address</label>
                <input 
                  required 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl px-6 py-5 text-white outline-none focus:border-blue-500 transition-colors" 
                  placeholder="robert@studio.pl" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Phone Number</label>
                <input 
                  required 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl px-6 py-5 text-white outline-none focus:border-blue-500 transition-colors" 
                  placeholder="+48 123 456 789" 
                />
              </div>

              <div className="pt-6">
                <button 
                  type="submit"
                  className={`w-full py-6 rounded-2xl font-bold uppercase tracking-[0.3em] text-[12px] transition-all flex items-center justify-center gap-4 ${
                    selectedTier.popular 
                    ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-xl shadow-amber-500/30' 
                    : 'bg-blue-600 text-white hover:bg-blue-500 shadow-xl shadow-blue-600/30'
                  }`}
                >
                  Secure Enrollment & Pay
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17" />
                  </svg>
                </button>
                <p className="text-[9px] text-slate-600 uppercase tracking-widest text-center mt-6">
                  Finalizing this step will redirect you to our encrypted payment processor.
                </p>
              </div>
            </form>
          </div>

          {/* Summary Side */}
          <div className="lg:col-span-5">
            <div className={`relative p-1 bg-gradient-to-br ${selectedTier.color} rounded-[2.5rem] shadow-2xl`}>
              <div className="bg-[#05070a] rounded-[2.4rem] p-10 space-y-8">
                <div className="flex items-center justify-between">
                  <span className="text-5xl">{selectedTier.icon}</span>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Selected Program</span>
                    <h3 className="text-xl font-display font-bold text-white uppercase tracking-tight">{selectedTier.name}</h3>
                  </div>
                </div>

                <div className="h-[1px] w-full bg-white/5"></div>

                <ul className="space-y-4">
                  {selectedTier.benefits.slice(0, 4).map((b, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className={`w-1 h-1 rounded-full bg-gradient-to-r ${selectedTier.color} mt-1.5 flex-shrink-0`}></span>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-relaxed">{b}</p>
                    </li>
                  ))}
                  {selectedTier.benefits.length > 4 && (
                    <li className="text-[9px] text-slate-600 uppercase font-bold tracking-widest pl-4">
                      + {selectedTier.benefits.length - 4} Additional Exclusive Perks
                    </li>
                  )}
                </ul>

                <div className="pt-6 border-t border-white/5 flex justify-between items-baseline">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Monthly Commitment</span>
                  <span className="text-2xl font-display font-bold text-white">{selectedTier.price}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-center gap-4">
              <span className="text-xl">🛡️</span>
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest leading-relaxed">
                Your data is handled according to carDetailing.PL privacy protocols. No credit card information is stored on our servers.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col px-6 py-20 max-w-7xl mx-auto w-full animate-in fade-in duration-1000">
      <div className="text-center mb-24">
        <span className="text-blue-500 font-bold text-xs uppercase tracking-[0.4em] mb-4 block">Exclusive Studio Circle</span>
        <h2 className="text-6xl font-display font-bold uppercase tracking-tight text-white mb-6 leading-tight">
          Automotive <span className="text-blue-500">Continuity</span>
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg font-light italic">
          "Excellence isn't a single act, it's a habit. Maintain your vehicle's showroom glory with our elite membership programs."
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {tiers.map((tier, i) => (
          <div 
            key={i} 
            className={`relative flex flex-col bg-slate-900/40 border rounded-[2.5rem] p-10 transition-all duration-500 hover:-translate-y-2 group ${
              tier.popular ? 'border-amber-500/30 shadow-[0_20px_60px_-15px_rgba(245,158,11,0.15)]' : 'border-white/5 hover:border-white/10'
            }`}
          >
            {tier.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-[9px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-xl">
                Most Requested
              </div>
            )}

            <div className="flex flex-col gap-6 mb-10">
              <div className="flex items-center justify-between">
                <span className="text-4xl">{tier.icon}</span>
                <div className={`h-1 w-12 rounded-full bg-gradient-to-r ${tier.color}`}></div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">{tier.tagline}</span>
                <h3 className="text-2xl font-display font-bold text-white uppercase tracking-tight">{tier.name}</h3>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-display font-bold text-white">{tier.price}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{tier.period}</span>
                </div>
              </div>
            </div>

            <ul className="flex-1 space-y-5 mb-12">
              {tier.benefits.map((benefit, bIdx) => (
                <li key={bIdx} className="flex items-start gap-4 group/item">
                  <span className={`mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gradient-to-r ${tier.color} opacity-40 group-hover/item:opacity-100 transition-opacity`}></span>
                  <p className="text-slate-400 text-xs leading-relaxed group-hover/item:text-slate-200 transition-colors">{benefit}</p>
                </li>
              ))}
            </ul>

            <button 
              onClick={() => handleSelectTier(tier)}
              className={`w-full py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-3 ${
                tier.popular 
                ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-xl shadow-amber-500/20' 
                : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              Enroll in Program
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="mt-32 p-12 bg-slate-900/40 border border-white/5 rounded-[3rem] text-center max-w-4xl mx-auto relative overflow-hidden group">
        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
        <div className="relative z-10">
          <h3 className="text-2xl font-display font-bold text-white uppercase tracking-tight mb-4">Enterprise & Fleet Solutions</h3>
          <p className="text-slate-400 text-sm mb-8 max-w-lg mx-auto leading-relaxed">
            Managing a showroom or a luxury fleet in Poznań? We offer bespoke multi-vehicle protection contracts and on-site maintenance protocols.
          </p>
          <button 
            onClick={() => onNavigate(ViewMode.CONTACT)}
            className="text-blue-500 font-bold uppercase tracking-widest text-[10px] hover:text-blue-400 transition-colors border-b border-blue-500/20 pb-1"
          >
            Request Corporate Dossier →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Membership;
