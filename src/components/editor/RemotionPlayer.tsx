'use client';

import { Player } from '@remotion/player';
import { useTimelineStore } from '@/core/stores/useTimelineStore';
import { VideoComposition } from './VideoComposition';

export const RemotionPlayer = () => {
  // 1. Grab all the live data from the store
  const { originalVideoUrl, audioUrl, captions } = useTimelineStore();

  // Default dimensions (16:9)
  const width = 1920;
  const height = 1080;

  return (
    <div className="w-full aspect-video rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-black">
      <Player
        component={VideoComposition}
        inputProps={{
          videoUrl: originalVideoUrl,
          audioUrl: audioUrl, // <--- Passing the AI Audio URL
          captions: captions || [], // <--- Passing the Real Captions
        }}
        durationInFrames={30 * 60} // Default 60s (In a real app, this should match video duration)
        fps={30}
        compositionWidth={width}
        compositionHeight={height}
        style={{
          width: '100%',
          height: '100%',
        }}
        controls
      />
    </div>
  );
};