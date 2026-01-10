
import React, { useState } from 'react';
import { generateVideoVeo } from '../services/geminiService';

const VideoSection: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);

  // Fix: As per guidelines, assume successful key selection after openSelectKey and proceed.
  const checkAndOpenKey = async () => {
    // @ts-ignore
    const has = await window.aistudio.hasSelectedApiKey();
    if (!has) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
    }
    setHasKey(true);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    // Verify key for Veo
    // @ts-ignore
    const has = await window.aistudio.hasSelectedApiKey();
    if (!has) {
        // Fix: Call checkAndOpenKey and continue without early return.
        await checkAndOpenKey();
    }

    setIsGenerating(true);
    setProgressMsg('Warming up the engine...');
    try {
      const url = await generateVideoVeo(prompt, setProgressMsg);
      setVideoUrl(url);
    } catch (error: any) {
      console.error(error);
      // Fix: Reset key selection if entity not found error occurs.
      if (error.message?.includes("Requested entity was not found.")) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
      } else {
        alert("Video generation failed. Please try again later.");
      }
    } finally {
      setIsGenerating(false);
      setProgressMsg('');
    }
  };

  return (
    <div className="flex-1 flex flex-col px-6 py-12 max-w-5xl mx-auto w-full">
      <div className="flex flex-col items-center text-center gap-6 mb-12">
        <h2 className="text-4xl font-display font-bold">Video Studio</h2>
        <p className="text-slate-400 max-w-xl">
          Create cinematic 1080p landscapes or 720p 9:16 clips using Veo 3.1. 
          Your creative vision, brought to motion.
        </p>
        
        {/* Fix: Added mandatory link to billing documentation as per guidelines */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/80 flex flex-col gap-2 items-center">
            <div className="flex items-center gap-3">
              <span className="text-lg">💡</span>
              <span>Veo requires a billing-enabled project. You will be prompted to select your API key.</span>
            </div>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-amber-400 hover:text-amber-300 underline font-bold"
            >
              Billing Documentation
            </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12">
        <div className="aspect-video w-full rounded-[2rem] bg-slate-900 border border-white/5 overflow-hidden relative flex items-center justify-center shadow-2xl">
          {isGenerating ? (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl z-20 flex flex-col items-center justify-center p-8 gap-8 animate-in fade-in duration-500">
               <div className="relative">
                  <div className="w-24 h-24 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-xl">🎬</div>
               </div>
               <div className="text-center space-y-2">
                 <p className="text-rose-400 font-bold text-lg animate-pulse">{progressMsg}</p>
                 <p className="text-slate-500 text-sm italic">"Great art takes time..."</p>
               </div>
            </div>
          ) : null}

          {videoUrl ? (
            <video 
              src={videoUrl} 
              controls 
              autoPlay 
              loop 
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-4 text-slate-700">
              <div className="w-24 h-24 rounded-3xl border-2 border-dashed border-slate-800 flex items-center justify-center text-4xl">
                🎥
              </div>
              <p className="font-medium">Enter a prompt below to direct your first scene</p>
            </div>
          )}
        </div>

        <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-4 items-stretch max-w-3xl mx-auto w-full">
          <input 
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A drone shot of a misty emerald forest with a winding river..."
            className="flex-1 bg-slate-900/50 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 ring-rose-500/50 outline-none transition-all"
          />
          <button 
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            className="px-10 py-4 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-2xl font-bold shadow-xl shadow-rose-500/10 transition-all disabled:opacity-50"
          >
            {isGenerating ? 'Directing...' : 'Generate Video'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VideoSection;
