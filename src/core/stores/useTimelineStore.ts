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
  start: number;
  end: number;
  text: string;
}

interface TimelineState {
  originalVideoUrl: string | null;
  generatedScript: string;
  captions: Caption[];
  audioUrl: string | null;
  
  clips: Clip[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  fps: number;
  zoomLevel: number; // Pixels per second

  // --- NEW: Trim State for Main Video ---
  // startOffset: How many seconds into the source video we start playing (Trimming the beginning)
  // endOffset: At what source time we stop playing (Trimming the end)
  videoTrim: { start: number; end: number }; 

  // Actions
  setOriginalVideo: (url: string) => void;
  setScript: (script: string) => void;
  appendScript: (text: string) => void;
  setCaptions: (captions: Caption[]) => void;
  setAudio: (url: string) => void;
  addClip: (clip: Clip) => void;
  
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setZoomLevel: (zoom: number) => void;
  setVideoTrim: (start: number, end: number) => void; // <--- NEW ACTION
}

export const useTimelineStore = create<TimelineState>((set) => ({
  originalVideoUrl: null,
  generatedScript: "",
  audioUrl: null,
  clips: [],
  captions: [],
  
  isPlaying: false,
  currentTime: 0,
  duration: 60,
  fps: 30,
  zoomLevel: 30,
  
  // Default trim is 0 to infinity (will be capped by actual duration on load)
  videoTrim: { start: 0, end: 0 }, 

  setOriginalVideo: (url) => set({ originalVideoUrl: url }),
  setScript: (script) => set({ generatedScript: script }),
  appendScript: (text) => set((state) => ({ generatedScript: state.generatedScript + text })),
  setCaptions: (captions) => set({ captions }),
  setAudio: (url) => set({ audioUrl: url }),
  addClip: (clip) => set((state) => ({ clips: [...state.clips, clip] })),
  
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (time) => set({ currentTime: Math.max(0, time) }),
  setDuration: (duration) => set({ duration, videoTrim: { start: 0, end: duration } }), // Reset trim on new video
  setZoomLevel: (zoomLevel) => set({ zoomLevel: Math.max(10, Math.min(200, zoomLevel)) }),
  
  setVideoTrim: (start, end) => set((state) => ({ 
    videoTrim: { 
      start: Math.max(0, start), 
      end: Math.min(state.duration, Math.max(start + 1, end)) // Ensure end > start
    } 
  })),
}));