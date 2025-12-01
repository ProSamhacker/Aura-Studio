import { Loader2, Download, Play, Pause, Square } from 'lucide-react';
import { useTimelineStore } from '@/core/stores/useTimelineStore';
import { formatTime } from '@/core/utils/time';

interface HeaderProps {
  isProcessing: boolean;
  onExport: () => void;
}

export const Header = ({ isProcessing, onExport }: HeaderProps) => {
  const { isPlaying, setIsPlaying, currentTime, setCurrentTime, audioUrl } = useTimelineStore();

  return (
    <div className="h-14 border-b border-[#1f1f1f] flex items-center justify-between px-6 bg-[#0F0F0F] shrink-0">
      <div className="flex items-center gap-4">
        <span className="text-xs font-medium text-gray-400">Project: Aura Studio</span>
        <div className="h-6 w-px bg-gray-800"></div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 hover:bg-gray-800 rounded-full transition">
            {isPlaying ? <Pause className="w-4 h-4 fill-white"/> : <Play className="w-4 h-4 fill-white"/>}
          </button>
          <button onClick={() => { setIsPlaying(false); setCurrentTime(0); }} className="p-2 hover:bg-gray-800 rounded-full transition">
            <Square className="w-3 h-3 fill-white"/>
          </button>
          <span className="text-sm font-mono font-medium text-purple-400 min-w-[80px]">
            {formatTime(currentTime)}
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onExport}
          disabled={isProcessing || !audioUrl}
          className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2"
        >
          {isProcessing ? <Loader2 className="animate-spin w-3 h-3"/> : <Download className="w-3 h-3"/>}
          Export
        </button>
      </div>
    </div>
  );
};