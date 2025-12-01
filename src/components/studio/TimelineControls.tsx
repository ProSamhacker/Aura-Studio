import { Play, Pause, Square, SkipBack, SkipForward, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTimelineStore } from '@/core/stores/useTimelineStore';
import { formatTime } from '@/core/utils/time';

export const TimelineControls = () => {
  const { 
    isPlaying, setIsPlaying, 
    currentTime, setCurrentTime, 
    duration 
  } = useTimelineStore();

  const handleSkip = (amount: number) => {
    setCurrentTime(Math.min(duration, Math.max(0, currentTime + amount)));
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  return (
    <div className="h-12 bg-[#121212] border-t border-[#1f1f1f] flex items-center justify-between px-4 shrink-0 select-none z-10 relative">
      
      {/* Playback Controls */}
      <div className="flex items-center gap-2">
        <button onClick={() => handleSkip(-5)} className="p-2 text-gray-400 hover:text-white hover:bg-[#1f1f1f] rounded-lg transition" title="Back 5s">
             <div className="flex items-center text-xs font-bold"><ChevronLeft className="w-3 h-3" /> 5s</div>
        </button>

        <button 
            onClick={() => setIsPlaying(!isPlaying)} 
            className="p-2 bg-white/5 text-white hover:bg-purple-600 rounded-lg transition mx-1 border border-white/10"
        >
             {isPlaying ? <Pause className="w-5 h-5 fill-current"/> : <Play className="w-5 h-5 fill-current ml-0.5"/>}
        </button>

         <button onClick={handleStop} className="p-2 text-gray-400 hover:text-white hover:bg-[#1f1f1f] rounded-lg transition" title="Stop">
             <Square className="w-4 h-4 fill-current" />
        </button>

        <button onClick={() => handleSkip(5)} className="p-2 text-gray-400 hover:text-white hover:bg-[#1f1f1f] rounded-lg transition" title="Forward 5s">
             <div className="flex items-center text-xs font-bold">5s <ChevronRight className="w-3 h-3" /></div>
        </button>
      </div>

      {/* Time Display */}
      <div className="text-xs font-mono bg-black/30 px-3 py-1.5 rounded-full border border-white/5 shadow-inner">
          <span className="text-purple-300 font-medium">{formatTime(currentTime)}</span>
          <span className="text-gray-600 mx-2">|</span>
          <span className="text-gray-500">{formatTime(duration)}</span>
      </div>
    </div>
  );
};