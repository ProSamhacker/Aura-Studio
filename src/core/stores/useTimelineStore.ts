import { create } from 'zustand';

export interface Clip {
  id: string;
  type: 'video' | 'audio' | 'image';
  url: string;
  start: number;
  end: number;
  layer: number;
}
export interface Caption {
  start: number; // Seconds (e.g., 1.5)
  end: number;   // Seconds (e.g., 3.2)
  text: string;  // The spoken words
}

interface TimelineState {
  // Video State
  originalVideoUrl: string | null;
  
  // Script State
  generatedScript: string;
  
  captions: Caption[];
  setCaptions: (captions: Caption[]) => void;

  // Audio State (NEW)
  audioUrl: string | null;

  // Editor State
  clips: Clip[];
  isPlaying: boolean;
  currentTime: number;
  
  // Actions
  setOriginalVideo: (url: string) => void;
  setScript: (script: string) => void;
  appendScript: (text: string) => void;
  
  // NEW Action for Voiceover
  setAudio: (url: string) => void;
  
  addClip: (clip: Clip) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
}

export const useTimelineStore = create<TimelineState>((set) => ({
  // Initial State
  originalVideoUrl: null,
  generatedScript: "",
  audioUrl: null, // <--- Initialize audio
  clips: [],
  isPlaying: false,
  currentTime: 0,
  captions: [],

  setCaptions: (captions) => set({ captions }),
  // Actions implementation
  setOriginalVideo: (url) => set({ originalVideoUrl: url }),
  setScript: (script) => set({ generatedScript: script }),
  
  appendScript: (text) => set((state) => ({ 
    generatedScript: state.generatedScript + text 
  })),
  
  // NEW Action implementation
  setAudio: (url) => set({ audioUrl: url }),
  
  addClip: (clip) => set((state) => ({ 
    clips: [...state.clips, clip] 
  })),
  
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
}));