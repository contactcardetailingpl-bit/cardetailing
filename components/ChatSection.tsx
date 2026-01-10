
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { chatWithSearch } from '../services/geminiService';

const ChatSection: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const { text, grounding } = await chatWithSearch(input);
      const assistantMessage: Message = { 
        role: 'assistant', 
        content: text, 
        groundingUrls: grounding 
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I encountered an error while searching for that information. Please try again.' 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-6 py-8">
      <div className="flex flex-col gap-2 mb-8 text-center">
        <h2 className="text-3xl font-display font-bold">Smart Search Chat</h2>
        <p className="text-slate-400">Powered by Gemini 3 Flash with Real-time Grounding</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 mb-8 scroll-smooth min-h-[400px]">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4 opacity-50">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center text-2xl">
              💬
            </div>
            <p>Start a conversation. Ask about recent news or complex facts.</p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}
          >
            <div className={`max-w-[85%] px-5 py-3 rounded-2xl ${
              msg.role === 'user' 
              ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-500/10' 
              : 'bg-slate-900 border border-white/5 text-slate-200 rounded-tl-none'
            }`}>
              <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block w-full mb-1">Sources</span>
                  {msg.groundingUrls.map((url, idx) => (
                    <a 
                      key={idx} 
                      href={url.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[11px] bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-white/5 text-indigo-400 transition-colors inline-block max-w-[200px] truncate"
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
          <div className="flex flex-col items-start animate-pulse">
            <div className="bg-slate-900 border border-white/5 px-5 py-3 rounded-2xl rounded-tl-none">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce delay-75"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce delay-150"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <form 
        onSubmit={handleSubmit}
        className="relative group bg-slate-900/50 backdrop-blur-xl border border-white/10 p-2 rounded-3xl shadow-2xl focus-within:ring-2 ring-indigo-500/50 transition-all sticky bottom-4"
      >
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything..."
          className="w-full bg-transparent border-none focus:ring-0 text-white px-4 py-3 placeholder:text-slate-600"
        />
        <button 
          type="submit"
          disabled={!input.trim() || isTyping}
          className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl flex items-center justify-center transition-all disabled:opacity-50 disabled:bg-slate-800"
        >
          <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default ChatSection;
