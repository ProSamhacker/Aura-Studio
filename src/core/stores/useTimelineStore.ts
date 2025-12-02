// src/core/stores/useTimelineStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
  zoomLevel: number;
  videoTrim: { start: number; end: number };

  // Actions
  setOriginalVideo: (url: string) => void;
  setScript: (script: string) => void;
  appendScript: (text: string) => void;
  setCaptions: (captions: Caption[]) => void;
  updateCaption: (index: number, text: string) => void;
  setAudio: (url: string) => void;
  addClip: (clip: Clip) => void;
  
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setZoomLevel: (zoom: number) => void;
  setVideoTrim: (start: number, end: number) => void;
  
  // Reset function
  resetProject: () => void;
}

const initialState = {
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
  videoTrim: { start: 0, end: 60 },
};

export const useTimelineStore = create<TimelineState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setOriginalVideo: (url) => {
        // Only proxy Drive URLs
        if (url && (url.includes('drive.google.com') || url.includes('googleusercontent.com'))) {
          const proxyUrl = `/api/video-proxy?url=${encodeURIComponent(url)}`;
          set({ originalVideoUrl: proxyUrl });
        } else {
          set({ originalVideoUrl: url });
        }
      },

      setScript: (script) => set({ generatedScript: script }),
      
      appendScript: (text) => set((state) => ({ 
        generatedScript: state.generatedScript + text 
      })),
      
      setCaptions: (captions) => set({ captions }),

      updateCaption: (index, newText) => set((state) => {
        const newCaptions = [...state.captions];
        if (newCaptions[index]) {
          newCaptions[index] = { ...newCaptions[index], text: newText };
        }
        return { captions: newCaptions };
      }),

      setAudio: (url) => set({ audioUrl: url }),
      
      addClip: (clip) => set((state) => ({ 
        clips: [...state.clips, clip] 
      })),
      
      setIsPlaying: (isPlaying) => {
        const state = get();
        // Auto-stop at end
        if (isPlaying && state.currentTime >= state.duration) {
          set({ currentTime: 0, isPlaying: true });
        } else {
          set({ isPlaying });
        }
      },
      
      setCurrentTime: (time) => {
        const state = get();
        const clampedTime = Math.max(0, Math.min(state.duration, time));
        
        // Auto-stop at end
        if (clampedTime >= state.duration && state.isPlaying) {
          set({ currentTime: state.duration, isPlaying: false });
        } else {
          set({ currentTime: clampedTime });
        }
      },
      
      setDuration: (duration) => set({ 
        duration,
        videoTrim: { start: 0, end: duration }
      }),
      
      setZoomLevel: (zoomLevel) => set({ 
        zoomLevel: Math.max(10, Math.min(200, zoomLevel)) 
      }),
      
      setVideoTrim: (start, end) => set((state) => ({ 
        videoTrim: { 
          start: Math.max(0, start), 
          end: Math.min(state.duration, Math.max(start + 0.5, end))
        } 
      })),
      
      resetProject: () => set(initialState),
    }),
    {
      name: 'aura-project-storage',
      storage: createJSONStorage(() => localStorage),
      // Don't persist temporary state or blob URLs
      partialize: (state) => {
        const shouldPersist = (url: string | null) => {
          if (!url) return false;
          // Don't persist blob URLs - they're temporary
          if (url.startsWith('blob:')) return false;
          return true;
        };

        return {
          // Only persist Drive URLs, not blob URLs
          originalVideoUrl: shouldPersist(state.originalVideoUrl) ? state.originalVideoUrl : null,
          generatedScript: state.generatedScript,
          captions: state.captions,
          audioUrl: shouldPersist(state.audioUrl) ? state.audioUrl : null,
          duration: state.duration,
          videoTrim: state.videoTrim,
          zoomLevel: state.zoomLevel,
        };
      },
      // Handle hydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Reset playback state on load
          state.isPlaying = false;
          state.currentTime = 0;
        }
      },
    }
  )
);