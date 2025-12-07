// src/components/editor/VideoComposition.tsx - FIXED TRIM LOGIC
import React from 'react';
import { AbsoluteFill, Video, Audio, useCurrentFrame, useVideoConfig, Img, OffthreadVideo } from 'remotion';

interface CaptionStyle {
  color: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  textAlign: 'left' | 'center' | 'right';
  backgroundColor: string;
  position: 'top' | 'center' | 'bottom';
  opacity: number;
}

interface Caption {
  start: number;
  end: number;
  text: string;
  style?: CaptionStyle;
}

interface VideoCompositionProps {
  videoUrl: string | null;
  audioUrl: string | null;
  captions: Caption[];
  videoTrim: { start: number; end: number };
}

export const VideoComposition: React.FC<VideoCompositionProps> = ({ 
  videoUrl, 
  audioUrl, 
  captions,
  videoTrim
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Current time in the COMPOSITION (what the user sees)
  const compositionTime = frame / fps;
  
  // Current time in the SOURCE VIDEO (accounting for trim)
  const sourceVideoTime = compositionTime + videoTrim.start;

  // Find active caption (based on composition time, NOT source time)
  const activeCaption = Array.isArray(captions) 
    ? captions.find((c) => compositionTime >= c.start && compositionTime <= c.end)
    : null;

  // Default style fallback
  const defaultStyle: CaptionStyle = {
    color: '#FFFFFF',
    fontSize: 42,
    fontFamily: 'Inter, sans-serif',
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    position: 'bottom',
    opacity: 1,
  };

  const captionStyle = activeCaption?.style || defaultStyle;

  // CRITICAL FIX: Calculate which frame to show from source video
  // The video component needs to know WHERE in the source video we are
  const videoStartFrame = Math.floor(videoTrim.start * fps);
  
  // FLEXBOX POSITIONING
  const verticalMap = {
    top: 'justify-start pt-16',
    center: 'justify-center',
    bottom: 'justify-end pb-20'
  };

  const horizontalMap = {
    left: 'items-start pl-16',
    center: 'items-center',
    right: 'items-end pr-16'
  };

  return (
    <AbsoluteFill className="bg-black">
      
      {/* LAYER 1: Video */}
      {videoUrl ? (
        <AbsoluteFill>
          {/* 
            CRITICAL: We use startFrom to offset into the source video
            The frame prop tells Remotion which frame of the SOURCE to show
            For trimmed video starting at 5s with 30fps: startFrom = 5 * 30 = 150
            When composition frame=0, we show source frame=150
            When composition frame=30, we show source frame=180
          */}
          <OffthreadVideo
            src={videoUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
            // Mute original audio if we have AI voiceover
            volume={audioUrl ? 0 : 1}
            // Start playback at the trim start point
            startFrom={videoStartFrame}
            // The current frame in the composition maps to source video frame
            // Remotion handles this automatically with startFrom
          />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill className="bg-[#111] flex items-center justify-center">
           <span className="text-gray-500 font-mono text-lg">No Video Source</span>
        </AbsoluteFill>
      )}

      {/* LAYER 2: AI Voiceover */}
      {audioUrl && (
        <Audio 
          src={audioUrl} 
          volume={1}
        />
      )}

      {/* LAYER 3: Styled Captions with Animation */}
      {activeCaption && (
        <AbsoluteFill 
          className={`flex flex-col ${verticalMap[captionStyle.position]} ${horizontalMap[captionStyle.textAlign]}`}
          style={{ opacity: captionStyle.opacity }}
        >
          <div 
            className="px-8 py-4 rounded-2xl shadow-2xl backdrop-blur-sm max-w-[90%] animate-in fade-in slide-in-from-bottom-2 duration-200"
            style={{
              backgroundColor: captionStyle.backgroundColor,
              // Subtle scale animation based on caption length
              transform: `scale(${1 - (activeCaption.text.length > 60 ? 0.05 : 0)})`
            }}
          >
            <p 
              style={{
                color: captionStyle.color,
                fontSize: captionStyle.fontSize,
                fontFamily: captionStyle.fontFamily,
                fontWeight: captionStyle.fontWeight,
                textAlign: captionStyle.textAlign,
                margin: 0,
                lineHeight: 1.4,
                textShadow: '0px 3px 6px rgba(0,0,0,0.9), 0px 1px 3px rgba(0,0,0,0.8)',
                letterSpacing: '0.02em'
              }}
            >
              {activeCaption.text}
            </p>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};