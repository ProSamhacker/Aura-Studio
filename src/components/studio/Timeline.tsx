import { useRef, useEffect, useState } from 'react';
import { Video as VideoIcon, Music, GripVertical, Type } from 'lucide-react';
import { useTimelineStore } from '@/core/stores/useTimelineStore';
import { formatTime } from '@/core/utils/time';

export const Timeline = () => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  
  // NOTE: We DO NOT destruct 'currentTime' here to prevent re-renders!
  const { 
    originalVideoUrl, audioUrl, captions, 
    duration, zoomLevel, setZoomLevel, isPlaying,
    videoTrim, setVideoTrim, setCurrentTime
  } = useTimelineStore();

  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [isTrimming, setIsTrimming] = useState<'start' | 'end' | null>(null);

  // --- CONFIG ---
  const START_PADDING = 20; 
  // FIX: Increased padding significantly (1000px) so the timeline can keep scrolling 
  // even when the video nears the end. This prevents the "pointer out of bounds" issue.
  const END_PADDING = 1000;  
  const totalWidth = (duration * zoomLevel) + START_PADDING + END_PADDING; 

  // --- 1. ANIMATION LOOP (The "Game Loop" for the Playhead) ---
  useEffect(() => {
    let animationFrameId: number;

    const loop = () => {
      // Direct state access to avoid React render cycle overhead
      const state = useTimelineStore.getState();
      const currentPx = (state.currentTime * state.zoomLevel) + START_PADDING;

      if (playheadRef.current) {
        playheadRef.current.style.transform = `translateX(${currentPx}px)`;
      }

      // --- SMOOTH AUTO-SCROLL ---
      if (state.isPlaying && viewportRef.current) {
        const viewport = viewportRef.current;
        const viewportWidth = viewport.clientWidth;
        const currentScroll = viewport.scrollLeft;
        
        // Calculate where the playhead is relative to the *visible* window
        const relativePos = currentPx - currentScroll;

        // If playhead passes 75% of the screen width, scroll to keep it there.
        const triggerPoint = viewportWidth * 0.75;

        if (relativePos > triggerPoint) {
           // We set the scroll so that currentPx sits exactly at the triggerPoint
           viewport.scrollLeft = currentPx - triggerPoint;
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [zoomLevel]); 


  // --- 2. SCROLL & ZOOM HANDLER ---
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleWheelNative = (e: WheelEvent) => {
        e.preventDefault(); 
        e.stopPropagation();

        if (e.ctrlKey) {
            // ZOOM
            const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
            const newZoom = Math.max(10, Math.min(200, useTimelineStore.getState().zoomLevel * zoomDelta));
            setZoomLevel(newZoom);
        } else {
            // SCROLL
            viewport.scrollLeft += e.deltaY;
        }
    };

    viewport.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => viewport.removeEventListener('wheel', handleWheelNative);
  }, [setZoomLevel]);

  // --- 3. MOUSE INTERACTION ---
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!viewportRef.current) return;
      
      const rect = viewportRef.current.getBoundingClientRect();
      const scrollLeft = viewportRef.current.scrollLeft;
      const relativeX = e.clientX - rect.left + scrollLeft;
      
      const effectiveX = Math.max(0, relativeX - START_PADDING);
      const timeAtMouse = effectiveX / useTimelineStore.getState().zoomLevel;

      if (isDraggingPlayhead) {
          setCurrentTime(Math.max(0, Math.min(duration, timeAtMouse)));
      }

      if (isTrimming) {
          if (isTrimming === 'start') {
              const newStart = Math.min(timeAtMouse, videoTrim.end - 0.5);
              setVideoTrim(Math.max(0, newStart), videoTrim.end);
          } else {
              const newEnd = Math.max(timeAtMouse, videoTrim.start + 0.5);
              setVideoTrim(videoTrim.start, Math.min(duration, newEnd));
          }
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDraggingPlayhead(false);
      setIsTrimming(null);
    };

    if (isDraggingPlayhead || isTrimming) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDraggingPlayhead, isTrimming, videoTrim, setCurrentTime, setVideoTrim, duration]);

  // --- RENDER HELPERS ---
  const tickInterval = zoomLevel > 60 ? 1 : zoomLevel > 30 ? 5 : 10;
  const ticks = [];
  for (let i = 0; i <= duration; i += tickInterval) { ticks.push(i); }

  const videoStartPx = (videoTrim.start * zoomLevel) + START_PADDING;
  const videoDurationPx = (videoTrim.end - videoTrim.start) * zoomLevel;

  return (
    // FIX: Added 'pr-6' here to create the spacing (margin) from the right page edge
    <div className="flex flex-col h-60 bg-[#121212] border-t border-[#1f1f1f] select-none relative shrink-0 pr-6">
      <div ref={viewportRef} className="flex-1 overflow-x-auto overflow-y-hidden relative scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-[#0E0E0E] rounded-xl">
        <div className="h-full relative" style={{ width: `${totalWidth}px` }}
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    if (clickX >= START_PADDING) setIsDraggingPlayhead(true);
                }
            }}
        >
            {/* RULER */}
            <div className="h-8 border-b border-gray-800 w-full pointer-events-none sticky top-0 bg-[#121212] z-20">
                {ticks.map((time) => (
                    <div key={time} className="absolute bottom-0 h-3 border-l border-gray-600" style={{ left: `${(time * zoomLevel) + START_PADDING}px` }}>
                        <span className="absolute -top-5 -left-1 text-[10px] text-gray-500 font-mono select-none">{formatTime(time)}</span>
                    </div>
                ))}
            </div>

            {/* PLAYHEAD */}
            <div ref={playheadRef} className="absolute top-0 bottom-0 w-0 z-50 cursor-ew-resize group"
                style={{ left: 0, top: 0 }} 
                onMouseDown={(e) => { e.stopPropagation(); setIsDraggingPlayhead(true); }}
            >
                <div className="absolute top-0 left-0 bottom-0 w-px bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                <div className="absolute -top-0 -left-1.5 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white transform transition-transform group-hover:scale-125"></div>
            </div>

            {/* TRACKS */}
            <div className="py-4 space-y-4 relative w-full mt-2">
                {originalVideoUrl && (
                    <div className="h-14 relative group rounded-md" style={{ left: `${videoStartPx}px`, width: `${videoDurationPx}px` }}>
                        <div className="absolute inset-0 bg-[#2A2A2A] rounded-md border border-purple-500/40 flex items-center justify-center overflow-hidden">
                             <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-50">
                                <VideoIcon className="w-4 h-4 text-purple-300"/>
                                <span className="text-[10px] text-purple-200">Video Track</span>
                             </div>
                        </div>
                        <div className="absolute left-0 top-0 bottom-0 w-3 bg-purple-600 cursor-ew-resize flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 rounded-l-md"
                            onMouseDown={(e) => { e.stopPropagation(); setIsTrimming('start'); }}><GripVertical className="w-2 h-2 text-white" /></div>
                        <div className="absolute right-0 top-0 bottom-0 w-3 bg-purple-600 cursor-ew-resize flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 rounded-r-md"
                            onMouseDown={(e) => { e.stopPropagation(); setIsTrimming('end'); }}><GripVertical className="w-2 h-2 text-white" /></div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};