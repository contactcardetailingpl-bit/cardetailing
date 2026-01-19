import React, { useState, useEffect } from 'react';
import { generateVisualizerImage } from '../services/geminiService';
import { GeneratedAsset } from '../types';

const Visualizer: React.FC = () => {
  const [carModel, setCarModel] = useState('');
  const [finish, setFinish] = useState('Mirror-like Ceramic Coating');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpert, setIsExpert] = useState(false);
  const [isProUnlocked, setIsProUnlocked] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<GeneratedAsset | null>(null);

  useEffect(() => {
    const checkKeyStatus = async () => {
      // @ts-ignore
      if (typeof window.aistudio !== 'undefined' && await window.aistudio.hasSelectedApiKey()) {
        setIsProUnlocked(true);
      }
    };
    checkKeyStatus();
  }, []);

  const handleProSelect = async () => {
    // @ts-ignore
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (hasKey || isProUnlocked) {
      setIsExpert(true);
      setErrorMsg(null);
    } else {
      setShowUpgradeModal(true);
    }
  };

  const handleUnlockPro = async () => {
    // @ts-ignore
    await window.aistudio.openSelectKey();
    setIsProUnlocked(true);
    setShowUpgradeModal(false);
    setIsExpert(true);
    setErrorMsg(null);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carModel.trim() || isGenerating) return;

    setIsGenerating(true);
    setErrorMsg(null);
    
    try {
      const imageUrl = await generateVisualizerImage(carModel, finish, isExpert);
      const newAsset: GeneratedAsset = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'image',
        url: imageUrl,
        prompt: `Visualizing ${carModel} with ${finish}`,
        timestamp: Date.now()
      };
      setHistory(prev => [newAsset, ...prev]);
      setSelectedAsset(newAsset);
    } catch (error: any) {
      console.error(error);
      if (error.message === "PRO_KEY_REQUIRED") {
        setShowUpgradeModal(true);
      } else {
        setErrorMsg(error.message || "Visualization failed. Please try a different car model or switch to Pro mode.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col px-6 py-12 max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Controls */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div>
            <span className="text-blue-500 font-bold text-xs uppercase tracking-[0.3em] mb-2 block">Visual Engine</span>
            <h2 className="text-4xl font-display font-bold mb-4 uppercase tracking-tight">Finish Visualizer</h2>
            <p className="text-slate-400 text-sm">Preview the future of your vehicle. Select your model and desired finish to see a high-end studio render.</p>
          </div>

          <div className="flex justify-center">
            <div className="bg-slate-900 border border-white/10 p-1 rounded-xl flex items-center gap-1 shadow-2xl w-full">
              <button 
                onClick={() => { setIsExpert(false); setErrorMsg(null); }}
                className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${!isExpert ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-white'}`}
              >
                Standard (2.5)
              </button>
              <button 
                onClick={handleProSelect}
                className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isExpert ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-white'}`}
              >
                {!isProUnlocked && <span className="text-xs">🔒</span>}
                Expert (3 Pro)
              </button>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="space-y-6 bg-slate-900/50 p-8 rounded-2xl border border-white/5 shadow-2xl">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Vehicle Make & Model</label>
              <input 
                type="text"
                value={carModel}
                onChange={(e) => setCarModel(e.target.value)}
                className="w-full bg-[#05070a] border border-white/10 rounded-xl px-4 py-4 text-white focus:ring-1 ring-blue-500 outline-none transition-all text-sm"
                placeholder="e.g. Porsche 911 GT3 RS"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Protection Finish</label>
              <select 
                value={finish}
                onChange={(e) => setFinish(e.target.value)}
                className="w-full bg-[#05070a] border border-white/10 rounded-xl px-4 py-4 text-white focus:ring-1 ring-blue-500 outline-none transition-all text-sm appearance-none"
              >
                <option>Mirror-like Ceramic Coating</option>
                <option>Satin Matte Paint Protection</option>
                <option>High-Gloss Carnauba Wax</option>
                <option>Stealth Dark Chrome</option>
                <option>Deep Candy Metallic</option>
                <option>Pearl White Protection</option>
              </select>
            </div>

            {errorMsg && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[10px] text-rose-400 font-bold uppercase tracking-widest leading-relaxed">
                   ⚠️ {errorMsg}
                </div>
            )}

            <button 
              type="submit"
              disabled={isGenerating || !carModel.trim()}
              className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3 group"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Rendering...
                </>
              ) : (
                  <>
                    <span>Generate High-End Render</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
              )}
            </button>
          </form>

          {/* History Thumbnails */}
          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Render History</label>
            <div className="grid grid-cols-4 gap-3">
              {history.map((asset) => (
                <button 
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${selectedAsset?.id === asset.id ? 'border-blue-500' : 'border-transparent'}`}
                >
                  <img src={asset.url} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
              {Array.from({ length: Math.max(0, 4 - history.length) }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl bg-[#05070a] border border-white/5 border-dashed"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Display Area */}
        <div className="lg:col-span-8">
          <div className="aspect-video w-full rounded-[2.5rem] bg-[#030508] border border-white/5 overflow-hidden relative shadow-2xl flex items-center justify-center">
            {isGenerating ? (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-xl z-20 flex flex-col items-center justify-center text-center p-8 gap-6 animate-in fade-in">
                 <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                 <div className="space-y-2">
                    <p className="text-blue-400 font-bold uppercase tracking-[0.3em] text-xs">Simulating Detailing Environment...</p>
                    <p className="text-slate-500 text-[10px] font-medium tracking-widest uppercase">Expert engine engaged</p>
                 </div>
              </div>
            ) : null}

            {selectedAsset ? (
              <>
                <img 
                  src={selectedAsset.url} 
                  className="w-full h-full object-cover animate-in fade-in duration-1000"
                  alt="Visualized car"
                />
                <div className="absolute top-8 right-8 px-5 py-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-[0.3em] text-white shadow-2xl">
                  {isExpert ? '💎 Pro Vision Render' : '✨ Standard Studio View'}
                </div>
                <div className="absolute bottom-8 left-8 right-8 p-6 rounded-[2rem] bg-black/60 backdrop-blur-md border border-white/10">
                  <p className="text-sm text-slate-200 font-medium italic">"{selectedAsset.prompt}"</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-8 text-slate-700 p-12 text-center">
                <div className="w-32 h-32 rounded-full border-2 border-dashed border-slate-800 flex items-center justify-center text-6xl opacity-30">
                  🚗
                </div>
                <div className="max-w-md">
                   <h4 className="font-display font-bold uppercase tracking-[0.2em] text-sm mb-3 text-slate-500">Awaiting Specification</h4>
                   <p className="text-xs text-slate-800 leading-relaxed">Enter your car model and preferred finish on the left to generate a studio-quality visualization using advanced Gemini AI.</p>
                </div>
              </div>
            )}
          </div>
          <div className="mt-8 p-6 bg-blue-600/5 border border-blue-600/10 rounded-2xl text-[10px] text-blue-300/60 leading-relaxed italic uppercase tracking-widest text-center">
             * This render is generated by AI to demonstrate visual possibilities. Actual results vary based on vehicle condition and detailing packages.
          </div>
        </div>
      </div>

      {/* Upgrade Modal for Pro Visualizer */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#05070a]/90 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-slate-900 border border-white/10 max-w-md w-full rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
              <div className="relative z-10 flex flex-col items-center text-center">
                 <div className="w-20 h-20 bg-blue-600/20 rounded-[2rem] flex items-center justify-center mb-8 border border-blue-500/20">
                    <span className="text-4xl">🔮</span>
                 </div>
                 <h3 className="text-3xl font-display font-bold uppercase tracking-tight mb-4 text-white">Unlock Expert Vision</h3>
                 <p className="text-slate-400 text-sm mb-10 leading-relaxed">
                   Switch to **Gemini 3 Pro Image** for the highest fidelity automotive renders. This model excels at complex reflections and hyper-realistic studio lighting.
                 </p>
                 
                 <div className="space-y-4 w-full mb-10 text-left">
                    <div className="flex items-center gap-4 text-xs text-slate-300 bg-white/5 p-4 rounded-2xl border border-white/5">
                       <span className="text-blue-500">✔</span> High-resolution (1K) professional output
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-300 bg-white/5 p-4 rounded-2xl border border-white/5">
                       <span className="text-blue-500">✔</span> Advanced reflection mapping
                    </div>
                 </div>

                 <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-200/80 mb-10 w-full font-bold uppercase tracking-widest">
                    Pro features require a paid Gemini API key. Please ensure billing is enabled. 
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="block mt-2 underline text-amber-400">View Billing Documentation</a>
                 </div>

                 <div className="flex flex-col gap-4 w-full">
                    <button 
                      onClick={handleUnlockPro}
                      className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold uppercase tracking-[0.3em] text-[11px] transition-all shadow-2xl shadow-blue-500/30"
                    >
                      Select Paid API Key
                    </button>
                    <button 
                      onClick={() => setShowUpgradeModal(false)}
                      className="w-full py-4 bg-white/5 hover:bg-white/10 text-slate-500 rounded-2xl font-bold uppercase tracking-widest text-[9px] transition-all"
                    >
                      Maybe Later
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Visualizer;