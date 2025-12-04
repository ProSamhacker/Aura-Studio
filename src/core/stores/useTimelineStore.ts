import { create } from 'zustand';

export interface Caption {
  start: number;
  end: number;
  text: string;
  style?: CaptionStyle;
}

export interface CaptionStyle {
  color: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  textAlign: 'left' | 'center' | 'right';
  backgroundColor: string;
  position: 'top' | 'center' | 'bottom';
  opacity: number;
}

export interface VoiceSettings {
  voiceId: string;
  speed: number; // 0.5 to 2.0
  pitch: number; // 0.5 to 2.0
  stability: number; // 0 to 1
  similarityBoost: number; // 0 to 1
}

export interface MediaAsset {
  id: string;
  url: string;
  type: 'video' | 'image';
  name: string;
}

export interface Project {
  id: string;
  name: string;
  originalVideoUrl: string | null;
  mediaLibrary: MediaAsset[];
  generatedScript: string;
  captions: Caption[];
  audioUrl: string | null;
  voiceSettings: VoiceSettings;
  defaultCaptionStyle: CaptionStyle;
  duration: number;
  videoTrim: { start: number; end: number };
  lastSaved: Date;
}

interface TimelineState extends Project {
  // Playback
  isPlaying: boolean;
  currentTime: number;
  fps: number;
  zoomLevel: number;
  
  // Editing flags
  hasUnsavedChanges: boolean;
  isAutoSaving: boolean;

  // Actions
  setOriginalVideo: (url: string) => void;
  addMediaToLibrary: (file: File, url: string) => void;
  selectMediaFromLibrary: (url: string) => void;
  setDuration: (duration: number) => void;
  setVideoTrim: (start: number, end: number) => void;
  setScript: (script: string) => void;
  appendScript: (text: string) => void;
  setCaptions: (captions: Caption[]) => void;
  updateCaption: (index: number, updates: Partial<Caption>) => void;
  updateCaptionStyle: (index: number, style: Partial<CaptionStyle>) => void;
  setDefaultCaptionStyle: (style: Partial<CaptionStyle>) => void;
  setAudio: (url: string) => void;
  setVoiceSettings: (settings: Partial<VoiceSettings>) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setZoomLevel: (zoom: number) => void;
  saveProject: () => void;
  loadProject: (projectId: string) => void;
  updateProjectName: (name: string) => void;
  resetProject: () => void;
}

const defaultCaptionStyle: CaptionStyle = {
  color: '#FFFFFF',
  fontSize: 42, // Increased default size for better visibility
  fontFamily: 'Inter, sans-serif',
  fontWeight: 'bold',
  textAlign: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  position: 'bottom',
  opacity: 1,
};

const defaultVoiceSettings: VoiceSettings = {
  voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam
  speed: 1.0,
  pitch: 1.0,
  stability: 0.5,
  similarityBoost: 0.75,
};

const initialState = {
  id: '',
  name: 'Untitled Project',
  originalVideoUrl: null,
  mediaLibrary: [],
  generatedScript: '',
  audioUrl: null,
  captions: [],
  voiceSettings: defaultVoiceSettings,
  defaultCaptionStyle: defaultCaptionStyle,
  isPlaying: false,
  currentTime: 0,
  duration: 60,
  fps: 30,
  zoomLevel: 30,
  videoTrim: { start: 0, end: 60 },
  lastSaved: new Date(),
  hasUnsavedChanges: false,
  isAutoSaving: false,
};

export const useTimelineStore = create<TimelineState>((set, get) => ({
  ...initialState,

  setOriginalVideo: (url) => {
    const proxiedUrl = url.includes('drive.google.com') 
      ? `/api/video-proxy?url=${encodeURIComponent(url)}` 
      : url;
    
    set({ 
      originalVideoUrl: proxiedUrl,
      hasUnsavedChanges: true,
      currentTime: 0 
    });
  },

  addMediaToLibrary: (file, url) => set((state) => {
    // Check duplicates
    const exists = state.mediaLibrary.some(m => m.name === file.name);
    if (exists) return {};

    return {
      mediaLibrary: [
        ...state.mediaLibrary, 
        { 
          id: Math.random().toString(36).substr(2, 9), 
          url, 
          type: file.type.startsWith('video') ? 'video' : 'image', 
          name: file.name 
        }
      ],
      hasUnsavedChanges: true
    };
  }),

  selectMediaFromLibrary: (url) => {
     get().setOriginalVideo(url);
  },

  setDuration: (duration) => {
    const validDuration = Math.max(0.1, duration);
    set({ 
      duration: validDuration,
      videoTrim: { start: 0, end: validDuration },
      hasUnsavedChanges: true
    });
  },

  setVideoTrim: (start, end) => {
    const state = get();
    const validStart = Math.max(0, start);
    const validEnd = Math.min(state.duration, Math.max(start + 0.5, end));
    
    set({ 
      videoTrim: { start: validStart, end: validEnd },
      hasUnsavedChanges: true
    });
  },

  setScript: (script) => set({ 
    generatedScript: script,
    hasUnsavedChanges: true 
  }),
  
  appendScript: (text) => set((state) => ({ 
    generatedScript: state.generatedScript + text,
    hasUnsavedChanges: true
  })),
  
  setCaptions: (captions) => {
    set({ 
      captions, // Don't bake style into captions, use defaultStyle as source of truth unless overridden
      hasUnsavedChanges: true
    });
  },

  updateCaption: (index, updates) => set((state) => {
    const newCaptions = [...state.captions];
    if (newCaptions[index]) {
      newCaptions[index] = { ...newCaptions[index], ...updates };
    }
    return { captions: newCaptions, hasUnsavedChanges: true };
  }),

  updateCaptionStyle: (index, styleUpdates) => set((state) => {
    const newCaptions = [...state.captions];
    if (newCaptions[index]) {
      newCaptions[index] = {
        ...newCaptions[index],
        style: { ...(newCaptions[index].style || state.defaultCaptionStyle), ...styleUpdates } as CaptionStyle
      };
    }
    return { captions: newCaptions, hasUnsavedChanges: true };
  }),

  setDefaultCaptionStyle: (style) => set((state) => ({
    defaultCaptionStyle: { ...state.defaultCaptionStyle, ...style },
    hasUnsavedChanges: true
  })),

  setAudio: (url) => set({ 
    audioUrl: url,
    hasUnsavedChanges: true 
  }),

  setVoiceSettings: (settings) => set((state) => ({
    voiceSettings: { ...state.voiceSettings, ...settings },
    hasUnsavedChanges: true
  })),
  
  setIsPlaying: (isPlaying) => {
    const state = get();
    if (isPlaying && state.currentTime >= state.duration) {
      set({ currentTime: 0, isPlaying: true });
    } else {
      set({ isPlaying });
    }
  },
  
  setCurrentTime: (time) => {
    const state = get();
    const clampedTime = Math.max(0, Math.min(state.duration, time));
    
    if (clampedTime >= state.duration && state.isPlaying) {
      set({ currentTime: state.duration, isPlaying: false });
    } else {
      set({ currentTime: clampedTime });
    }
  },
  
  setZoomLevel: (zoomLevel) => {
    const clamped = Math.max(10, Math.min(200, zoomLevel));
    set({ zoomLevel: clamped });
  },

  saveProject: () => {
    const state = get();
    const projectData: Project = {
      id: state.id,
      name: state.name,
      originalVideoUrl: state.originalVideoUrl,
      mediaLibrary: state.mediaLibrary,
      generatedScript: state.generatedScript,
      captions: state.captions,
      audioUrl: state.audioUrl,
      voiceSettings: state.voiceSettings,
      defaultCaptionStyle: state.defaultCaptionStyle,
      duration: state.duration,
      videoTrim: state.videoTrim,
      lastSaved: new Date(),
    };
    
    localStorage.setItem(`aura-project-${state.id}`, JSON.stringify(projectData));
    
    const projectsList = JSON.parse(localStorage.getItem('aura-projects') || '[]');
    const existingIndex = projectsList.findIndex((p: any) => p.id === state.id);
    
    const projectMeta = {
      id: state.id,
      name: state.name,
      thumbnail: '',
      lastEdited: new Date(),
      duration: state.duration,
    };
    
    if (existingIndex >= 0) {
      projectsList[existingIndex] = projectMeta;
    } else {
      projectsList.unshift(projectMeta);
    }
    
    localStorage.setItem('aura-projects', JSON.stringify(projectsList));
    set({ hasUnsavedChanges: false, lastSaved: new Date() });
  },

  loadProject: (projectId) => {
    const projectData = localStorage.getItem(`aura-project-${projectId}`);
    
    if (projectData) {
      const project: Project = JSON.parse(projectData);
      set({
        ...project,
        mediaLibrary: project.mediaLibrary || [],
        isPlaying: false,
        currentTime: 0,
        fps: 30,
        zoomLevel: 30,
        hasUnsavedChanges: false,
        isAutoSaving: false,
      });
    } else {
      set({
        ...initialState,
        id: projectId,
        hasUnsavedChanges: false,
      });
    }
  },

  updateProjectName: (name) => set({ name, hasUnsavedChanges: true }),
  resetProject: () => set(initialState),
}));