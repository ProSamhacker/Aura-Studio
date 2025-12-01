import { useState, useRef, useEffect } from 'react';
import { UploadCloud, ZoomIn, ZoomOut, Move } from 'lucide-react';
import { RemotionPlayer } from '@/components/editor/RemotionPlayer';
import { useTimelineStore } from '@/core/stores/useTimelineStore';

interface CanvasProps {
  isProcessing: boolean;
  progress: number;
}

export const Canvas = ({ isProcessing, progress }: CanvasProps) => {
  const { originalVideoUrl } = useTimelineStore();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use Refs for state that is accessed inside event listeners
  // This prevents the listener from becoming stale
  const transformRef = useRef({ scale: 1, x: 0, y: 0 });
  const [transform, setTransform] = useState(transformRef.current);

  // Helper to update both ref and state
  const updateTransform = (newTransform: { scale: number; x: number; y: number }) => {
      transformRef.current = newTransform;
      setTransform(newTransform);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
        // 1. STOP PAGE SCROLLING
        e.preventDefault();
        e.stopPropagation();

        const current = transformRef.current;

        if (e.ctrlKey || e.metaKey) {
            // ZOOM
            const zoomSensitivity = 0.1;
            const delta = e.deltaY > 0 ? (1 - zoomSensitivity) : (1 + zoomSensitivity);
            const newScale = Math.min(Math.max(0.5, current.scale * delta), 5);

            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const newX = mouseX - (mouseX - current.x) * (newScale / current.scale);
            const newY = mouseY - (mouseY - current.y) * (newScale / current.scale);

            updateTransform({ scale: newScale, x: newX, y: newY });
        } else {
            // PAN
            updateTransform({ 
                ...current, 
                x: current.x - e.deltaX, 
                y: current.y - e.deltaY 
            });
        }
    };

    // Passive: false is required to prevent default browser scrolling
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
      if (e.button === 1 || e.shiftKey) { 
          setIsDragging(true);
          setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (isDragging) {
          updateTransform({
              ...transform,
              x: e.clientX - dragStart.x,
              y: e.clientY - dragStart.y
          });
      }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div 
        ref={containerRef}
        className="flex-1 bg-[#0a0a0a] p-8 flex flex-col items-center justify-center relative overflow-hidden cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
    >
      <div className="absolute top-4 right-4 z-50 flex gap-2 bg-black/50 p-1 rounded-lg backdrop-blur-sm pointer-events-auto select-none">
          <span className="text-xs text-white font-mono flex items-center px-1">{Math.round(transform.scale * 100)}%</span>
          <button onClick={() => updateTransform({ ...transform, scale: 1, x: 0, y: 0 })} className="p-1.5 hover:bg-white/10 rounded" title="Reset"><Move className="w-4 h-4 text-white"/></button>
      </div>

      {!originalVideoUrl ? (
        <div className="text-center text-gray-600 pointer-events-none select-none">
          <div className="w-16 h-16 bg-[#141414] rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-800">
            <UploadCloud className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-sm">Select "Media" in the sidebar to upload</p>
        </div>
      ) : (
        <div 
            className="will-change-transform origin-top-left"
            style={{ 
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` 
            }}
        >
          <div className="w-[800px] aspect-video shadow-2xl shadow-black ring-1 ring-gray-800 rounded-lg overflow-hidden relative bg-black pointer-events-none">
            <RemotionPlayer />
            {isProcessing && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
                <p className="text-white font-medium animate-pulse mb-2">Processing...</p>
                <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 transition-all" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};