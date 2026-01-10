
import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import { GeneratedAsset } from '../types';

const ImageSection: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<GeneratedAsset[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedAsset | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const imageUrl = await generateImage(prompt);
      const newAsset: GeneratedAsset = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'image',
        url: imageUrl,
        prompt: prompt,
        timestamp: Date.now()
      };
      setHistory(prev => [newAsset, ...prev]);
      setSelectedImage(newAsset);
    } catch (error) {
      console.error(error);
      alert("Failed to generate image. Please try a different prompt.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col px-6 py-12 max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Controls */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          <div>
            <h2 className="text-4xl font-display font-bold mb-4">Image Forge</h2>
            <p className="text-slate-400">Create high-fidelity 1K visuals in seconds.</p>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Prompt</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 ring-purple-500/50 outline-none resize-none transition-all"
                placeholder="A futuristic solarpunk city with floating gardens and crystal towers at sunset..."
              />
            </div>
            <button 
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-bold shadow-xl shadow-purple-500/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : 'Generate Asset'}
            </button>
          </form>

          {/* History Thumbnails */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Recent Creations</label>
              <span className="text-xs text-slate-600">{history.length} assets</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {history.map((asset) => (
                <button 
                  key={asset.id}
                  onClick={() => setSelectedImage(asset)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${selectedImage?.id === asset.id ? 'border-purple-500' : 'border-transparent'}`}
                >
                  <img src={asset.url} alt={asset.prompt} className="w-full h-full object-cover" />
                </button>
              ))}
              {Array.from({ length: Math.max(0, 3 - history.length) }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl bg-slate-900/50 border border-white/5 border-dashed"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Display Area */}
        <div className="lg:col-span-7">
          <div className="aspect-square w-full rounded-3xl bg-slate-900 border border-white/5 overflow-hidden relative shadow-2xl flex items-center justify-center">
            {isGenerating ? (
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md z-10 flex flex-col items-center justify-center text-center p-8 gap-4">
                 <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                 <p className="text-indigo-400 font-medium">Channeling creative sparks...</p>
              </div>
            ) : null}

            {selectedImage ? (
              <>
                <img 
                  src={selectedImage.url} 
                  alt={selectedImage.prompt} 
                  className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-500"
                />
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10">
                  <p className="text-sm text-slate-200 line-clamp-2 italic">"{selectedImage.prompt}"</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 text-slate-600">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-800 flex items-center justify-center text-3xl">
                  🖼️
                </div>
                <p>Generated image will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageSection;
