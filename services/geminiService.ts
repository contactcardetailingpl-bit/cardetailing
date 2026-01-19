import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { Message } from "../types";

// Standard encode function for bytes to base64 (from guidelines)
export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Standard decode function for base64 to bytes (from guidelines)
export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// PCM Audio Decoding for Live API and TTS (from guidelines)
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Visualizer image generation supporting both Standard and Pro
export const generateVisualizerImage = async (carModel: string, finishType: string, isExpert: boolean = false): Promise<string> => {
  // Create instance right before call as per guidelines for Pro models
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = isExpert ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  
  const prompt = `A professional high-end cinematic studio photo of a ${carModel} featuring a ${finishType} finish. 
  The car has standard Polish registration plates (white background, black font, blue EU strip with 'PL'). 
  Located inside a pristine, modern automotive detailing facility in Poland with professional studio soft-box lighting. 
  The paintwork shows deep, mirror-like reflections of the studio environment. 
  High-fidelity, 8k resolution, automotive advertising photography style.`;
  
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          ...(isExpert ? { imageSize: "1K" } : {})
        }
      }
    });

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    // Check for safety blocks
    if (!candidates || candidates.length === 0) {
        throw new Error("Safety filters blocked this car model or finish. Try a different description.");
    }

    throw new Error("The engine failed to produce a visual. Please try again.");
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found")) {
        throw new Error("PRO_KEY_REQUIRED");
    }
    throw error;
  }
};

// General image generation using gemini-2.5-flash-image
export const generateImage = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  const candidates = response.candidates;
  if (candidates && candidates.length > 0) {
    const parts = candidates[0].content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  }
  throw new Error("No image generated");
};

// Summary of detailing inquiry using gemini-3-flash-preview
export const summarizeInquiry = async (text: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Summarize the following car detailing request professionally for studio management: ${text}`,
  });
  return response.text || "Summary unavailable.";
};

// Detailing advisor chat with context history
export const chatWithAdvisor = async (history: Message[], isExpert: boolean = false) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = isExpert ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  let firstUserIndex = history.findIndex(m => m.role === 'user');
  if (firstUserIndex === -1) {
    firstUserIndex = history.length; 
  }
  
  const validHistory = history.slice(firstUserIndex);
  
  const contents = validHistory.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        systemInstruction: "You are the head detailer at CarDetailing.PL in Poznań. You are an expert in paint correction, ceramic coatings, and interior restoration. Provide professional advice tailored to the Polish market. Mention that you specialize in high-end vehicles with PL plates. Be concise but extremely knowledgeable.",
        tools: [{ googleSearch: {} }],
        maxOutputTokens: isExpert ? 2048 : 1024,
      },
    });
    
    const text = response.text || "I apologize, I could not generate a response.";
    const candidates = response.candidates;
    const grounding = candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      web: {
        uri: chunk.web?.uri || "",
        title: chunk.web?.title || ""
      }
    })).filter((c: any) => c.web.uri) || [];

    return { text, grounding: grounding.map(g => g.web) };
  } catch (err: any) {
    console.error("Gemini API direct error:", err);
    throw err;
  }
};

// General search grounding chat for ChatSection
export const chatWithSearch = async (message: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: 'user', parts: [{ text: message }] }],
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  
  const text = response.text || "";
  const candidates = response.candidates;
  const grounding = candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
    web: {
        uri: chunk.web?.uri || "",
        title: chunk.web?.title || ""
    }
  })).filter((c: any) => c.web.uri) || [];

  return { text, grounding: grounding.map(g => g.web) };
};

// Expert speech generation
export const generateExpertSpeech = async (text: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say with polish professionalism: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const candidates = response.candidates;
  const base64Audio = candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Audio generation failed");
  return base64Audio;
};

// Video generation using Veo 3.1
export const generateVideoVeo = async (prompt: string, onProgress: (msg: string) => void): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  onProgress('Initializing generation...');
  
  const enhancedPrompt = `${prompt}. The vehicle must feature a Polish standard registration plate.`;
  
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: enhancedPrompt,
    config: {
      numberOfVideos: 1,
      resolution: '1080p',
      aspectRatio: '16:9'
    }
  });

  onProgress('Processing frames in the Poznań studio...');
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
    if (!operation.done) {
        onProgress('Still polishing your masterpiece...');
    }
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed: No URI returned");
  
  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};