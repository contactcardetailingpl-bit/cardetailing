
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
// Updated imports to use refactored utility functions from geminiService
import { decode, encode, decodeAudioData } from '../services/geminiService';
import { TranscriptionItem } from '../types';

const LiveSection: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcription, setTranscription] = useState<TranscriptionItem[]>([]);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active'>('idle');

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  const currentInRef = useRef('');
  const currentOutRef = useRef('');

  const stopSession = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsActive(false);
    setStatus('idle');
  }, []);

  const startSession = async () => {
    try {
      setStatus('connecting');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setStatus('active');
            setIsActive(true);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                // Updated to use the standard encode function
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const serverContent = message.serverContent;
            if (!serverContent) return;

            // Handle Audio
            const audioData = serverContent.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              const ctx = audioContextRef.current;
              if (ctx) {
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                // Updated to use the standard decode function
                const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                sourcesRef.current.add(source);
                source.onended = () => sourcesRef.current.delete(source);
              }
            }

            // Handle Interruptions
            if (serverContent.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }

            // Handle Transcriptions
            const inputTranscription = serverContent.inputTranscription;
            const outputTranscription = serverContent.outputTranscription;

            if (inputTranscription) {
              currentInRef.current += inputTranscription.text;
            }
            if (outputTranscription) {
              currentOutRef.current += outputTranscription.text;
            }
            if (serverContent.turnComplete) {
              const userText = currentInRef.current;
              const modelText = currentOutRef.current;
              setTranscription(prev => [...prev, 
                { role: 'user', text: userText },
                { role: 'model', text: modelText }
              ]);
              currentInRef.current = '';
              currentOutRef.current = '';
            }
          },
          onerror: (e) => {
            console.error('Session error:', e);
            stopSession();
          },
          onclose: () => {
            console.log('Session closed');
            stopSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: "You are Lumina, a helpful and empathetic AI companion. Keep your responses natural and conversational."
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (error) {
      console.error('Failed to start session:', error);
      setStatus('idle');
    }
  };

  useEffect(() => {
    return () => stopSession();
  }, [stopSession]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-4xl mx-auto w-full">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-display font-bold mb-4">Live Voice Assistant</h2>
        <p className="text-slate-400">Low-latency, human-like voice conversation powered by Gemini 2.5 Flash Native Audio.</p>
      </div>

      <div className="relative mb-20">
        {/* Visualization */}
        <div className="relative w-64 h-64 flex items-center justify-center">
            <div className={`absolute inset-0 rounded-full bg-emerald-500/20 blur-3xl transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}></div>
            
            {/* Animated Rings */}
            {isActive && (
                <>
                    <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-full animate-ping"></div>
                    <div className="absolute inset-4 border-2 border-emerald-500/20 rounded-full animate-ping delay-300"></div>
                </>
            )}

            <button 
                onClick={isActive ? stopSession : startSession}
                disabled={status === 'connecting'}
                className={`z-10 w-40 h-40 rounded-full flex flex-col items-center justify-center transition-all duration-500 transform ${
                    isActive 
                    ? 'bg-rose-600 shadow-2xl shadow-rose-500/40 hover:scale-95' 
                    : 'bg-emerald-600 shadow-2xl shadow-emerald-500/40 hover:scale-105'
                } disabled:opacity-50`}
            >
                {status === 'connecting' ? (
                   <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mb-2"></div>
                ) : (
                    <span className="text-4xl mb-2">{isActive ? '⏹️' : '🎙️'}</span>
                )}
                <span className="font-bold text-sm tracking-widest uppercase">
                    {status === 'connecting' ? 'Connecting' : isActive ? 'End Call' : 'Start Call'}
                </span>
            </button>
        </div>
      </div>

      {/* Transcription View */}
      <div className="w-full bg-slate-900/50 border border-white/5 rounded-3xl p-8 max-h-[400px] overflow-y-auto space-y-4">
        <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Live Transcript</h3>
            {isActive && <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Recording
            </div>}
        </div>
        
        {transcription.length === 0 ? (
            <p className="text-slate-600 text-sm text-center py-8 italic">No conversation yet. Say "Hello Lumina!" to begin.</p>
        ) : (
            transcription.map((item, i) => (
                <div key={i} className={`flex flex-col ${item.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] font-bold text-slate-600 uppercase mb-1">{item.role}</span>
                    <p className={`px-4 py-2 rounded-2xl text-sm ${
                        item.role === 'user' 
                        ? 'bg-emerald-500/10 text-emerald-100 border border-emerald-500/20' 
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                        {item.text || "..."}
                    </p>
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default LiveSection;
