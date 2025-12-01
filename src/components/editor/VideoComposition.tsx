import React from 'react';
import { AbsoluteFill, Video, Audio, useCurrentFrame, useVideoConfig } from 'remotion';
import { Caption } from '@/core/stores/useTimelineStore';

interface VideoCompositionProps {
  videoUrl: string | null;
  audioUrl: string | null;
  captions: Caption[]; 
}

export const VideoComposition: React.FC<VideoCompositionProps> = ({ videoUrl, audioUrl, captions }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // Find the caption for the current second
  const activeCaption = Array.isArray(captions) 
    ? captions.find((c) => currentTime >= c.start && currentTime <= c.end)
    : null;

  if (!videoUrl) {
    return (
      <AbsoluteFill className="bg-black flex items-center justify-center">
        <h1 className="text-white text-2xl font-bold">No Video Loaded</h1>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill className="bg-black">
      {/* LAYER 1: The Video (MUTED if AI Audio is present) */}
      <Video 
        src={videoUrl} 
        // FIX: object-contain ensures the entire video is visible regardless of aspect ratio
        className="w-full h-full object-contain"
        // CRITICAL FIX: This line replaces the original audio with the AI voice
        volume={audioUrl ? 0 : 1} 
      />

      {/* LAYER 2: The AI Voiceover */}
      {audioUrl && <Audio src={audioUrl} />}

      {/* LAYER 3: Auto-Captions */}
      {activeCaption && (
        <AbsoluteFill className="justify-end items-center pb-20">
           <div className="bg-black/60 backdrop-blur-sm px-6 py-4 rounded-2xl border border-white/10 shadow-2xl">
              <p className="text-yellow-400 text-3xl font-black font-sans text-center uppercase tracking-wider drop-shadow-md">
                {activeCaption.text}
              </p>
           </div>
        </AbsoluteFill>
      )}
      
      {/* LAYER 4: Watermark */}
      <div className="absolute top-10 right-10 opacity-50">
        <p className="text-white font-bold tracking-widest">AURA STUDIO</p>
      </div>
    </AbsoluteFill>
  );
};