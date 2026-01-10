
import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "h-12" }) => {
  return (
    <div className={`flex items-center gap-3 ${className} group select-none`}>
      {/* Redesigned Icon: The Radiance Sparkle */}
      <div className="relative flex items-center justify-center w-10 h-10">
        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full group-hover:bg-blue-500/40 transition-all duration-700"></div>
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full relative z-10" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main Star Sparkle */}
          <path 
            d="M50 0L54 46L100 50L54 54L50 100L46 54L0 50L46 46L50 0Z" 
            fill="url(#logoGradient)" 
            className="animate-pulse"
          />
          <defs>
            <linearGradient id="logoGradient" x1="0" y1="0" x2="100" y2="100">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="50%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Typography: Full Company Name */}
      <div className="flex flex-col -space-y-1">
        <div className="flex items-baseline">
          <span className="font-display text-2xl font-medium tracking-tight text-slate-300">Car</span>
          <span className="font-display text-2xl font-bold tracking-tighter text-white">Detailing</span>
          <span className="font-display text-2xl font-bold tracking-tight text-blue-500 ml-0.5">.PL</span>
        </div>
        
        {/* Subtitle & Reflection Line */}
        <div className="flex items-center gap-2">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-blue-500/50 to-transparent"></div>
          <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-slate-500 whitespace-nowrap">
            Premium Auto Spa
          </span>
          <div className="h-[1px] w-4 bg-blue-500/20"></div>
        </div>
      </div>
    </div>
  );
};

export default Logo;
