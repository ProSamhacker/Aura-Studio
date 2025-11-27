// src/core/stores/useTimelineStore.ts
import { create } from 'zustand';

export interface Clip {
  id: string;
  type: 'video' | 'audio' | 'image';
  url: string; // The blob URL of the file
  start: number; // Where it starts on the timeline (seconds)
  end: number; // Where it ends (seconds)
  layer: number; // 0 = background, 1 = overlay
}

interface TimelineState {
  // The raw file user uploaded
  originalVideoUrl: string | null;
  
  // The generated script from Gemini
  generatedScript: string;
  
  // The list of clips on the timeline
  clips: Clip[];
  
  // Player state
  isPlaying: boolean;
  currentTime: number;
  
  // Actions
  setOriginalVideo: (url: string) => void;
  setScript: (script: string) => void;
  addClip: (clip: Clip) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
}

export const useTimelineStore = create<TimelineState>((set) => ({
  originalVideoUrl: null,
  generatedScript: "",
  clips: [],
  isPlaying: false,
  currentTime: 0,

  setOriginalVideo: (url) => set({ originalVideoUrl: url }),
  setScript: (script) => set({ generatedScript: script }),
  
  addClip: (clip) => set((state) => ({ 
    clips: [...state.clips, clip] 
  })),
  
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
}));