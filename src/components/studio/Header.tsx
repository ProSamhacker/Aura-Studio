import { Loader2, Download, Play, Pause, Square } from 'lucide-react';
import { useTimelineStore } from '@/core/stores/useTimelineStore';
import { formatTime } from '@/core/utils/time';

interface HeaderProps {
  isProcessing: boolean;
  onExport: () => void;
}

export const Header = ({ isProcessing, onExport }: HeaderProps) => {
  const { isPlaying, setIsPlaying, currentTime, setCurrentTime, audioUrl, name } = useTimelineStore();

  return (
    <div className="h-14 border-b border-[#1f1f1f] flex items-center justify-between px-6 bg-[#0F0F0F] shrink-0 backdrop-blur-md bg-opacity-95 z-30">
      <div className="flex items-center gap-4">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{name || "Untitled Project"}</span>
        <div className="h-4 w-px bg-gray-800"></div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsPlaying(!isPlaying)} 
            className={`w-8 h-8 flex items-center justify-center rounded-full transition ${isPlaying ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current"/> : <Play className="w-3.5 h-3.5 fill-current ml-0.5"/>}
          </button>
          <button 
            onClick={() => { setIsPlaying(false); setCurrentTime(0); }} 
            className="w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-full transition text-gray-400 hover:text-white"
          >
            <Square className="w-3 h-3 fill-current"/>
          </button>
          <span className="text-sm font-mono font-medium text-gray-300 min-w-[60px] ml-2">
            {formatTime(currentTime)}
          </span>
        </div>
      </div>
      
      {/* Right Actions */}
      <div className="flex gap-2">
        {/* AuraIQ/SmartAlign removed as requested */}
        <button
          onClick={onExport}
          disabled={isProcessing || !audioUrl}
          className="bg-white hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-black px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-purple-900/10"
        >
          {isProcessing ? <Loader2 className="animate-spin w-3 h-3"/> : <Download className="w-3 h-3"/>}
          Export Video
        </button>
      </div>
    </div>
  );
};