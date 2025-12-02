'use client';

import { Player, PlayerRef } from '@remotion/player';
import { useTimelineStore } from '@/core/stores/useTimelineStore';
import { VideoComposition } from './VideoComposition';
import { useRef, useEffect, useMemo } from 'react';

export const RemotionPlayer = () => {
  const playerRef = useRef<PlayerRef>(null);
  
  const { 
    originalVideoUrl, 
    audioUrl, 
    captions, 
    isPlaying, 
    currentTime, 
    setIsPlaying, 
    setCurrentTime,
    duration,
    fps
  } = useTimelineStore();

  // Memoize inputProps to prevent player reset on every frame update
  const inputProps = useMemo(() => ({
    videoUrl: originalVideoUrl,
    audioUrl: audioUrl,
    captions: captions || [],
  }), [originalVideoUrl, audioUrl, captions]);

  // 1. Sync Store -> Player (Play/Pause)
  useEffect(() => {
    if (!playerRef.current) return;
    if (isPlaying && !playerRef.current.isPlaying()) {
      playerRef.current.play();
    } else if (!isPlaying && playerRef.current.isPlaying()) {
      playerRef.current.pause();
    }
  }, [isPlaying]);

  // 2. Sync Store -> Player (Seeking)
  useEffect(() => {
    if (!playerRef.current) return;
    
    const playerTime = playerRef.current.getCurrentFrame() / fps;
    const timeDiff = Math.abs(playerTime - currentTime);

    // Only seek if the difference is significant (> 0.2s) to prevent stutter
    if (timeDiff > 0.2) {
      playerRef.current.seekTo(currentTime * fps);
    }
  }, [currentTime, fps]);

  // 3. Sync Player -> Store (Polling Loop) + End Detection
  useEffect(() => {
    let animationFrameId: number;

    const loop = () => {
      if (playerRef.current && isPlaying) {
        const frame = playerRef.current.getCurrentFrame();
        const durationInFrames = Math.max(1, Math.floor(duration * fps));

        // Update Store with current time
        setCurrentTime(frame / fps);

        // Check if video ended (Stop logic)
        if (frame >= durationInFrames - 1) {
            setIsPlaying(false);
        } else {
            animationFrameId = requestAnimationFrame(loop);
        }
      }
    };

    if (isPlaying) {
      loop();
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, fps, setCurrentTime, duration, setIsPlaying]);

  return (
    <div className="w-full aspect-video rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-black">
      <Player
        key={audioUrl || 'no-audio'} // CRITICAL FIX: Force re-render when audio changes
        ref={playerRef}
        component={VideoComposition}
        inputProps={inputProps}
        durationInFrames={Math.max(1, Math.floor(duration * fps))}
        fps={fps}
        compositionWidth={1920}
        compositionHeight={1080}
        style={{ width: '100%', height: '100%' }}
        controls={false} // We use our custom timeline controls
      />
    </div>
  );
};