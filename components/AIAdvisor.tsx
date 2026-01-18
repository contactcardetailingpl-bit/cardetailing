import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { chatWithAdvisor, generateExpertSpeech, decode, decodeAudioData } from '../services/geminiService';

const AIAdvisor: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Welcome to the CarDetailing.PL AI Advisor. How can I help you protect or restore your vehicle today? Ask me about ceramic coatings, paint correction, or how to treat specific interior surfaces.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isExpert, setIsExpert] = useState(false);
  const [isPlaying, setIsPlaying] = useState<number | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isProUnlocked, setIsProUnlocked] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const testPrompts = [
    "What is the best ceramic coating for a Porsche in Poland?",
    "How do I remove bird lime from delicate paint?",
    "Tell me about your fabric extraction process.",
    "Do you handle matte finish wraps?"
  ];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    const checkKeyStatus = async () => {
      // @ts-ignore
      if (typeof window.aistudio !== 'undefined' && await window.aistudio.hasSelectedApiKey()) {
        setIsProUnlocked(true);
      }
    };
    checkKeyStatus();
  }, []);

  const handleSpeak = async (text: string, index: number) => {
    if (isPlaying !== null) return;
    
    try {
      setIsPlaying(index);
      const base64Audio = await generateExpertSpeech(text);
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setIsPlaying(null);
      source.start();
    } catch (error) {
      console.error("Speech playback error:", error);
      setIsPlaying(null);
    }
  };

  const handleProSelect = async () => {
    // @ts-ignore
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (hasKey || isProUnlocked) {
      setIsExpert(true);
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
  };

  const executePrompt = async (text: string) => {
    if (isTyping) return;
    const userMessage: Message = { role: 'user', content: text };
    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setInput('');
    setIsTyping(true);
    await performChat(updatedHistory);
  };

  const performChat = async (history: Message[]) => {
    setIsTyping(true);

    try {
      const { text, grounding } = await chatWithAdvisor(history, isExpert);
      const assistantMessage: Message = { 
        role: 'assistant', 
        content: text, 
        groundingUrls: grounding 
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Chat Error Details:", error);
      
      let errorMsg = 'I apologize, I lost connection to our detailing database. This often happens if the AI server is busy or the API key is not configured correctly.';
      
      if (error.message?.includes("API_KEY_INVALID")) {
        errorMsg = "Detallier Alert: The API key provided is invalid. Please check your environment variables.";
      } else if (error.message?.includes("Requested entity was not found.")) {
        setIsProUnlocked(false);
        setIsExpert(false);
        errorMsg = "Session expired or model restricted. Please re-select your Pro key or try the Standard plan.";
      }
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: errorMsg 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    
    const userMessage: Message = { role: 'user', content: input };
    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setInput('');
    performChat(updatedHistory);
  };

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-6 py-12">
      <div className="flex flex-col gap-2 mb-8 text-center">
        <span className="text-blue-500 font-bold text-xs uppercase tracking-[0.3em]">Virtual Consultant</span>
        <h2 className="text-4xl font-display font-bold uppercase tracking-tight">AI Car Care Advisor</h2>
        <p className="text-slate-500">Expert knowledge on automotive restoration and protection, 24/7.</p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="bg-slate-900 border border-white/10 p-1 rounded-xl flex items-center gap-1 shadow-2xl">
          <button 
            onClick={() => setIsExpert(false)}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${!isExpert ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-white'}`}
          >
            Flash (Standard)
          </button>
          <button 
            onClick={handleProSelect}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${isExpert ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-white'}`}
          >
            {!isProUnlocked && (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
              </svg>
            )}
            Pro (Expert Plan)
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 mb-8 scroll-smooth min-h-[500px] p-6 bg-slate-900/20 border border-white/5 rounded-3xl">
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}
          >
             <div className="flex items-center gap-2 mb-1 px-2">
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{msg.role === 'user' ? 'Client' : 'Head Detailer'}</span>
                {msg.role === 'assistant' && (
                  <button 
                    onClick={() => handleSpeak(msg.content, i)}
                    className={`text-slate-500 hover:text-blue-400 transition-colors ${isPlaying === i ? 'text-blue-500' : ''}`}
                    title="Listen to advice"
                  >
                    {isPlaying === i ? (
                      <div className="flex gap-0.5 items-end h-3">
                        <div className="w-0.5 bg-blue-500 animate-[bounce_0.6s_infinite] h-full"></div>
                        <div className="w-0.5 bg-blue-500 animate-[bounce_0.8s_infinite] h-2"></div>
                        <div className="w-0.5 bg-blue-500 animate-[bounce_0.5s_infinite] h-full"></div>
                      </div>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    )}
                  </button>
                )}
             </div>
            <div className={`max-w-[90%] px-6 py-4 rounded-xl ${
              msg.role === 'user' 
              ? 'bg-blue-600 text-white rounded-tr-none shadow-xl shadow-blue-500/10' 
              : 'bg-slate-900 border border-white/10 text-slate-200 rounded-tl-none leading-relaxed'
            }`}>
              <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
              {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block w-full mb-1">Recommended Resources</span>
                  {msg.groundingUrls.map((url, idx) => (
                    <a 
                      key={idx} 
                      href={url.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[11px] bg-slate-800 hover:bg-blue-500/20 px-3 py-1.5 rounded border border-white/5 text-blue-400 transition-colors inline-block max-w-[220px] truncate"
                    >
                      {url.title || url.uri}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex flex-col items-start">
             <span className="text-[9px] font-bold text-slate-600 uppercase mb-1 tracking-widest px-2">
              {isExpert ? 'Expert Thinking...' : 'Typing...'}
             </span>
            <div className="bg-slate-900 border border-white/5 px-6 py-4 rounded-xl rounded-tl-none flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce delay-75"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce delay-150"></span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="mb-6 flex flex-wrap gap-2 justify-center">
        <span className="w-full text-center text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-1">Test Run Prompts</span>
        {testPrompts.map((p, idx) => (
          <button 
            key={idx}
            onClick={() => executePrompt(p)}
            className="text-[10px] px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-slate-400 hover:text-blue-400 hover:border-blue-500/50 transition-all"
          >
            {p}
          </button>
        ))}
      </div>

      <form 
        onSubmit={handleSubmit}
        className="relative group bg-slate-900 border border-white/10 p-2 rounded-2xl shadow-2xl focus-within:ring-2 ring-blue-500/50 transition-all sticky bottom-4"
      >
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isExpert ? "Describe specific damage for expert plan..." : "Ask a general detailing question..."}
          className="w-full bg-transparent border-none focus:ring-0 text-white px-5 py-4 placeholder:text-slate-600 text-sm"
        />
        <button 
          type="submit"
          disabled={!input.trim() || isTyping}
          className="absolute right-3 top-3 bottom-3 aspect-square bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center justify-center transition-all disabled:opacity-50 disabled:bg-slate-800"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </form>

      {/* Upgrade to Pro Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#05070a]/90 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-slate-900 border border-white/10 max-w-md w-full rounded-3xl p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
              </div>

              <div className="relative z-10 flex flex-col items-center text-center">
                 <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20">
                    <span className="text-3xl">💎</span>
                 </div>
                 <h3 className="text-2xl font-display font-bold uppercase tracking-tight mb-4">Unlock Expert Plan</h3>
                 <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                   Get access to **Gemini 3 Pro**, featuring advanced reasoning for complex paint correction diagnostics and multi-step restoration strategies.
                 </p>
                 
                 <div className="space-y-4 w-full mb-8">
                    <div className="flex items-center gap-3 text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5">
                       <span className="text-blue-500">✓</span> High-fidelity technical reasoning
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5">
                       <span className="text-blue-500">✓</span> Extended context for long restoration plans
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5">
                       <span className="text-blue-500">✓</span> Priority expert speech generation
                    </div>
                 </div>

                 <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-200/80 mb-8 w-full">
                    Pro features require a paid Gemini API key. Please ensure your project has billing enabled. 
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="block mt-1 font-bold underline text-amber-400">View Billing Docs</a>
                 </div>

                 <div className="flex flex-col gap-3 w-full">
                    <button 
                      onClick={handleUnlockPro}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-500/20"
                    >
                      Select Paid API Key
                    </button>
                    <button 
                      onClick={() => setShowUpgradeModal(false)}
                      className="w-full py-4 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all"
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

export default AIAdvisor;