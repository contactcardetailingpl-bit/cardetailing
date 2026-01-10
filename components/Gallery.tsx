
import React, { useState } from 'react';
import { WorkshopMedia } from '../types';

type Category = 'All' | 'Process' | 'Exterior' | 'Interior';

interface GalleryItem {
  id: string | number;
  url: string;
  category: Category;
  title: string;
  description: string;
  tag: string;
  type?: 'image' | 'video';
}

interface GalleryProps {
  customMedia?: WorkshopMedia[];
}

const Gallery: React.FC<GalleryProps> = ({ customMedia = [] }) => {
  const [filter, setFilter] = useState<Category>('All');
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

  // Map state-driven media to gallery item format
  const mappedMedia: GalleryItem[] = customMedia.map(m => ({
    id: m.id,
    url: m.url,
    category: m.category as Category,
    title: m.title,
    description: m.description || 'Workshop session entry.',
    tag: 'Studio Archive',
    type: m.type
  }));

  const filteredItems = filter === 'All' 
    ? mappedMedia 
    : mappedMedia.filter(item => item.category === filter);

  return (
    <div className="flex-1 flex flex-col px-6 py-20 max-w-7xl mx-auto w-full animate-in fade-in duration-700">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-6">
          Portfolio Archive | Poland
        </div>
        <h2 className="text-5xl font-display font-bold mb-6 uppercase tracking-tight">Showcase of Mastery</h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Explore our visual history of automotive preservation. Every vehicle featured is prepared to Polish showroom standards.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-4 mb-12">
        {(['All', 'Process', 'Exterior', 'Interior'] as Category[]).map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
              filter === cat 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
              : 'bg-slate-900 text-slate-500 border border-white/5 hover:border-white/10 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="py-32 flex flex-col items-center justify-center text-slate-600 gap-4">
           <div className="text-4xl">📸</div>
           <p className="font-bold uppercase tracking-widest text-[10px]">No assets currently listed in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <div 
              key={item.id}
              onClick={() => setSelectedImage(item)}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-slate-900 border border-white/5 cursor-pointer animate-in zoom-in duration-300"
            >
              {item.type === 'video' ? (
                <video src={item.url} muted className="w-full h-full object-cover opacity-50 transition-all group-hover:opacity-100" />
              ) : (
                <img src={item.url} alt={item.title} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" />
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-8">
                <span className="text-blue-500 font-bold text-[9px] uppercase tracking-[0.2em] mb-2">{item.tag}</span>
                <h4 className="text-white font-display font-bold text-lg uppercase tracking-tight mb-2">{item.title}</h4>
                {item.type === 'video' && <div className="absolute top-4 right-4 text-xs">🎬</div>}
                <div className="mt-4 flex items-center gap-2 text-[9px] font-bold text-white/50 uppercase tracking-widest">
                  <span>View Entry</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="relative max-w-6xl w-full bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row items-stretch"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-6 right-6 z-50 w-12 h-12 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="lg:w-2/3 relative h-[400px] lg:h-auto bg-black flex items-center justify-center">
              {selectedImage.type === 'video' ? (
                <video src={selectedImage.url} controls autoPlay className="max-w-full max-h-full" />
              ) : (
                <img src={selectedImage.url} alt={selectedImage.title} className="w-full h-full object-cover" />
              )}
            </div>

            <div className="lg:w-1/3 p-12 flex flex-col justify-center">
              <span className="text-blue-500 font-bold text-[10px] uppercase tracking-[0.3em] mb-4 block">Portfolio Case Study</span>
              <h3 className="text-3xl font-display font-bold mb-6 uppercase tracking-tight text-white">{selectedImage.title}</h3>
              <div className="space-y-6 mb-10">
                <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Technical Summary</span>
                  <p className="text-slate-300 text-sm leading-relaxed">{selectedImage.description}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedImage(null)}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-all"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
