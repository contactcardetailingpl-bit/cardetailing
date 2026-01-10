
import React, { useState } from 'react';
import { generateVisualizerImage } from '../services/geminiService';
import { GeneratedAsset } from '../types';

const Visualizer: React.FC = () => {
  const [carModel, setCarModel] = useState('');
  const [finish, setFinish] = useState('Mirror-like Ceramic Coating');
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<GeneratedAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<GeneratedAsset | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carModel.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const imageUrl = await generateVisualizerImage(carModel, finish);
      const newAsset: GeneratedAsset = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'image',
        url: imageUrl,
        prompt: `Visualizing ${carModel} with ${finish}`,
        timestamp: Date.now()
      };
      setHistory(prev => [newAsset, ...prev]);
      setSelectedAsset(newAsset);
    } catch (error) {
      console.error(error);
      alert("Visualization failed. Please try a different car model.");
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
            <span className="text-blue-500 font-bold text-xs uppercase tracking-[0.3em] mb-2 block">AI Engine</span>
            <h2 className="text-4xl font-display font-bold mb-4 uppercase tracking-tight">Finish Visualizer</h2>
            <p className="text-slate-400 text-sm">See the potential of your vehicle before we even touch it. Select your model and desired protection.</p>
          </div>

          <form onSubmit={handleGenerate} className="space-y-6 bg-slate-900/50 p-8 rounded-2xl border border-white/5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Your Vehicle</label>
              <input 
                type="text"
                value={carModel}
                onChange={(e) => setCarModel(e.target.value)}
                className="w-full bg-[#05070a] border border-white/10 rounded px-4 py-3 text-white focus:ring-1 ring-blue-500 outline-none transition-all text-sm"
                placeholder="e.g. Porsche 911 GT3 RS"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Desired Finish</label>
              <select 
                value={finish}
                onChange={(e) => setFinish(e.target.value)}
                className="w-full bg-[#05070a] border border-white/10 rounded px-4 py-3 text-white focus:ring-1 ring-blue-500 outline-none transition-all text-sm appearance-none"
              >
                <option>Mirror-like Ceramic Coating</option>
                <option>Satin Matte Paint Protection</option>
                <option>High-Gloss Carnauba Wax</option>
                <option>Stealth Dark Chrome</option>
                <option>Deep Candy Metallic</option>
              </select>
            </div>

            <button 
              type="submit"
              disabled={isGenerating || !carModel.trim()}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold uppercase tracking-widest shadow-xl shadow-blue-500/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Rendering...
                </>
              ) : 'Generate View'}
            </button>
          </form>

          {/* History Thumbnails */}
          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Previous Visualizations</label>
            <div className="grid grid-cols-4 gap-2">
              {history.map((asset) => (
                <button 
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className={`aspect-square rounded overflow-hidden border-2 transition-all ${selectedAsset?.id === asset.id ? 'border-blue-500' : 'border-transparent'}`}
                >
                  <img src={asset.url} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
              {Array.from({ length: Math.max(0, 4 - history.length) }).map((_, i) => (
                <div key={i} className="aspect-square rounded bg-[#05070a] border border-white/5 border-dashed"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Display Area */}
        <div className="lg:col-span-8">
          <div className="aspect-video w-full rounded-2xl bg-[#030508] border border-white/5 overflow-hidden relative shadow-2xl flex items-center justify-center">
            {isGenerating ? (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-8 gap-4 animate-in fade-in">
                 <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                 <p className="text-blue-400 font-bold uppercase tracking-[0.2em] text-xs">Simulating Light Refractions...</p>
              </div>
            ) : null}

            {selectedAsset ? (
              <>
                <img 
                  src={selectedAsset.url} 
                  className="w-full h-full object-cover animate-in fade-in duration-1000"
                  alt="Visualized car"
                />
                <div className="absolute top-6 right-6 px-4 py-2 rounded bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white">
                  AI Visualization Results
                </div>
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded bg-black/40 backdrop-blur-md border border-white/10">
                  <p className="text-sm text-slate-200 font-medium">"{selectedAsset.prompt}"</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-6 text-slate-700">
                <div className="w-24 h-24 rounded-full border border-dashed border-slate-800 flex items-center justify-center text-5xl">
                  🚗
                </div>
                <div className="text-center">
                   <p className="font-bold uppercase tracking-widest text-xs mb-2 text-slate-600">No Visualization Rendered</p>
                   <p className="text-sm text-slate-800">Fill out the form to generate a studio-quality render</p>
                </div>
              </div>
            )}
          </div>
          <div className="mt-8 p-6 bg-blue-600/5 border border-blue-600/10 rounded-xl text-xs text-blue-300 leading-relaxed italic">
             * This image is generated by AI to demonstrate visual possibilities. Actual results may vary based on vehicle condition and specific product application.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Visualizer;
