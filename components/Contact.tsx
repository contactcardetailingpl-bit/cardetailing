import React from 'react';

const Contact: React.FC = () => {
  const socialLinks = [
    { 
      name: 'Instagram', 
      handle: 'car_detailing.pl', 
      url: 'https://www.instagram.com/car_detailing.pl?igsh=MWl4MmQ2amhwaGQxZg%3D%3D&utm_source=qr', 
      icon: '📸', 
      color: 'hover:text-pink-500' 
    },
    { 
      name: 'Facebook', 
      handle: 'CarDetailing.PL', 
      url: 'https://www.facebook.com/profile.php?id=61586543450859', 
      icon: '👥', 
      color: 'hover:text-blue-500' 
    },
    { 
      name: 'TikTok', 
      handle: '@cardetailing.pl', 
      url: 'https://www.tiktok.com/@cardetailing.pl?_r=1&_t=ZN-92uhuTa2OyU', 
      icon: '🎵', 
      color: 'hover:text-slate-100' 
    },
    { 
      name: 'YouTube', 
      handle: '@cardetailingpl', 
      url: 'https://youtube.com/@cardetailingpl?si=uxYw9Yfr-ZJ4A2YN', 
      icon: '🎥', 
      color: 'hover:text-red-500' 
    }
  ];

  return (
    <div className="flex-1 flex flex-col px-6 py-20 max-w-7xl mx-auto w-full animate-in fade-in duration-1000">
      <div className="text-center mb-24">
        <span className="text-blue-500 font-bold text-xs uppercase tracking-[0.4em] mb-4 block">Connect With Us</span>
        <h2 className="text-6xl font-display font-bold uppercase tracking-tight text-white mb-6">Contact the Studio</h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          Whether you're looking for a mirror finish or ceramic protection, our Poznań-based team is ready to assist.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
        {/* Email Card */}
        <div className="bg-slate-900/50 border border-white/5 p-12 rounded-[3rem] flex flex-col items-center text-center group hover:border-blue-500/30 transition-all duration-500">
          <div className="w-16 h-16 rounded-3xl bg-blue-600/10 flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform">📧</div>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-4">Direct Inquiry</h3>
          <a href="mailto:contactcardetailing.pl@gmail.com" className="text-xl font-display font-bold text-white hover:text-blue-400 transition-colors break-all">
            contactcardetailing.pl@gmail.com
          </a>
          <p className="text-slate-500 text-xs mt-4">We aim to respond within 4 workshop hours.</p>
        </div>

        {/* Phone Card */}
        <div className="bg-slate-900/50 border border-white/5 p-12 rounded-[3rem] flex flex-col items-center text-center group hover:border-blue-500/30 transition-all duration-500">
          <div className="w-16 h-16 rounded-3xl bg-blue-600/10 flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform">📞</div>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-4">Studio Hotline</h3>
          <a href="tel:+447495561482" className="text-2xl font-display font-bold text-white hover:text-blue-400 transition-colors">
            +44 7495 561482
          </a>
          <p className="text-slate-500 text-xs mt-4">Available Mon-Sat: 09:00 - 18:00</p>
        </div>

        {/* Location Card */}
        <div className="bg-slate-900/50 border border-white/5 p-12 rounded-[3rem] flex flex-col items-center text-center group hover:border-blue-500/30 transition-all duration-500">
          <div className="w-16 h-16 rounded-3xl bg-blue-600/10 flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform">📍</div>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-4">Poznań Workshop</h3>
          <address className="not-italic text-xl font-display font-bold text-white">
            Poznań, Poland<br/>
            Greater Poland Region
          </address>
          <p className="text-slate-500 text-xs mt-4 italic">By Appointment Only</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full">
        <div className="bg-[#080a0f] border border-white/5 p-12 rounded-[3rem] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-transparent"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-12 relative z-10">
            <div className="text-center md:text-left">
              <h3 className="text-3xl font-display font-bold text-white uppercase tracking-tight mb-2">Digital Presence</h3>
              <p className="text-slate-500 text-sm">Follow our latest transformations across the web.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              {socialLinks.map((social) => (
                <a 
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex flex-col items-center gap-3 transition-all ${social.color} group`}
                >
                  <span className="text-3xl group-hover:scale-125 transition-transform duration-300">{social.icon}</span>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{social.name}</span>
                    <span className="text-[9px] text-slate-600 mt-0.5">{social.handle}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-32 text-center opacity-40">
        <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-slate-600">Established 2012 • Excellence in Detail</p>
      </div>
    </div>
  );
};

export default Contact;