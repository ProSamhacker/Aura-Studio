// src/components/studio/Timeline.tsx - PROFESSIONAL VIDEO EDITOR VERSION
import { useRef, useEffect, useState, useCallback } from 'react';
import { Video as VideoIcon, Music, GripVertical, Loader2, Scissors, Copy, Trash2, Split } from 'lucide-react';
import { useTimelineStore } from '@/core/stores/useTimelineStore';
import { formatTime } from '@/core/utils/time';
import { generateVideoThumbnails } from '@/core/utils/media';

interface ContextMenu {
  x: number;
  y: number;
  clipType: 'video' | 'audio' | 'caption';
  clipIndex?: number;
}

export const Timeline = () => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  
  const { 
    originalVideoUrl, audioUrl, captions, 
    duration, zoomLevel, setZoomLevel, isPlaying,
    videoTrim, setVideoTrim, setCurrentTime, setOriginalVideo,
    setDuration, currentTime, saveProject, splitClipAtPlayhead,
    copyClip, pasteClip, deleteClip, cutClip
  } = useTimelineStore();

  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [isTrimming, setIsTrimming] = useState<'start' | 'end' | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [selectedClip, setSelectedClip] = useState<{ type: string; index?: number } | null>(null);

  // --- DYNAMIC TIMELINE LENGTH ---
  // Calculate actual content duration
  const calculateContentDuration = useCallback(() => {
    let maxDuration = 0;
    
    // Video duration
    if (videoTrim) {
      maxDuration = Math.max(maxDuration, videoTrim.end);
    }
    
    // Audio duration (if exists and longer)
    if (audioUrl && duration > maxDuration) {
      maxDuration = duration;
    }
    
    // Caption end times
    if (captions.length > 0) {
      const lastCaptionEnd = Math.max(...captions.map(c => c.end));
      maxDuration = Math.max(maxDuration, lastCaptionEnd);
    }
    
    return Math.max(maxDuration, 10); // Minimum 10 seconds
  }, [videoTrim, audioUrl, duration, captions]);

  const contentDuration = calculateContentDuration();
  
  // --- CONFIG ---
  const START_PADDING = 40; // Increased for better UX
  const END_PADDING = 300; // Extra space for adding content
  const totalWidth = (contentDuration * zoomLevel) + START_PADDING + END_PADDING;

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Space - Play/Pause
      if (e.code === 'Space') {
        e.preventDefault();
        useTimelineStore.setState({ isPlaying: !isPlaying });
      }
      
      // Ctrl/Cmd + S - Save
      if (modifier && e.key === 's') {
        e.preventDefault();
        saveProject();
        console.log('✅ Project saved');
      }
      
      // Ctrl/Cmd + C - Copy
      if (modifier && e.key === 'c' && selectedClip) {
        e.preventDefault();
        copyClip(selectedClip.type, selectedClip.index);
        console.log('📋 Clip copied');
      }
      
      // Ctrl/Cmd + V - Paste
      if (modifier && e.key === 'v') {
        e.preventDefault();
        pasteClip(currentTime);
        console.log('📌 Clip pasted');
      }
      
      // Ctrl/Cmd + X - Cut
      if (modifier && e.key === 'x' && selectedClip) {
        e.preventDefault();
        cutClip(selectedClip.type, selectedClip.index);
        console.log('✂️ Clip cut');
      }
      
      // Delete/Backspace - Delete selected clip
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedClip) {
        e.preventDefault();
        deleteClip(selectedClip.type, selectedClip.index);
        setSelectedClip(null);
        console.log('🗑️ Clip deleted');
      }
      
      // Arrow Left - Jump back 1s
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentTime(Math.max(0, currentTime - 1));
      }
      
      // Arrow Right - Jump forward 1s
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentTime(Math.min(contentDuration, currentTime + 1));
      }
      
      // Home - Go to start
      if (e.key === 'Home') {
        e.preventDefault();
        setCurrentTime(0);
      }
      
      // End - Go to end
      if (e.key === 'End') {
        e.preventDefault();
        setCurrentTime(contentDuration);
      }
      
      // S - Split at playhead
      if (e.key === 's' && !modifier && selectedClip) {
        e.preventDefault();
        splitClipAtPlayhead(currentTime);
        console.log('✂️ Split at playhead');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentTime, selectedClip, contentDuration, saveProject, copyClip, pasteClip, cutClip, deleteClip, splitClipAtPlayhead, setCurrentTime]);

  // --- CONTEXT MENU ---
  const handleContextMenu = useCallback((e: React.MouseEvent, type: 'video' | 'audio' | 'caption', index?: number) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      clipType: type,
      clipIndex: index
    });
    setSelectedClip({ type, index });
  }, []);

  // Close context menu
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // --- THUMBNAIL GENERATION ---
  useEffect(() => {
    if (!originalVideoUrl) {
      setThumbnails([]);
      return;
    }

    setIsLoadingThumbnails(true);
    const thumbnailCount = Math.min(50, Math.max(15, Math.floor(contentDuration / 2)));
    
    generateVideoThumbnails(originalVideoUrl, thumbnailCount)
      .then((thumbs) => {
        setThumbnails(thumbs);
        setIsLoadingThumbnails(false);
      })
      .catch((error) => {
        console.error('Thumbnail generation failed:', error);
        setThumbnails([]);
        setIsLoadingThumbnails(false);
      });
  }, [originalVideoUrl, contentDuration]);

  // --- SMOOTH PLAYHEAD ANIMATION ---
  useEffect(() => {
    let rafId: number;
    let lastTime = performance.now();

    const animate = (currentTimestamp: number) => {
      const state = useTimelineStore.getState();
      const deltaTime = (currentTimestamp - lastTime) / 1000; // Convert to seconds
      lastTime = currentTimestamp;

      if (state.isPlaying) {
        // Smooth frame-independent animation
        const newTime = Math.min(state.currentTime + deltaTime, contentDuration);
        
        if (newTime >= contentDuration) {
          useTimelineStore.setState({ isPlaying: false, currentTime: contentDuration });
        } else {
          useTimelineStore.setState({ currentTime: newTime });
        }
      }

      // Update playhead position
      const currentPx = (state.currentTime * state.zoomLevel) + START_PADDING;
      if (playheadRef.current) {
        playheadRef.current.style.transform = `translateX(${currentPx}px)`;
      }

      // Auto-scroll viewport
      if (state.isPlaying && viewportRef.current) {
        const viewport = viewportRef.current;
        const viewportWidth = viewport.clientWidth;
        const currentScroll = viewport.scrollLeft;
        const relativePos = currentPx - currentScroll;
        const triggerPoint = viewportWidth * 0.7;

        if (relativePos > triggerPoint) {
          viewport.scrollTo({
            left: currentPx - triggerPoint,
            behavior: 'smooth'
          });
        }
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [contentDuration, zoomLevel]);

  // --- ZOOM & SCROLL ---
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.ctrlKey || e.metaKey) {
        // Zoom
        const zoomDelta = e.deltaY > 0 ? 0.85 : 1.15;
        const newZoom = Math.max(10, Math.min(300, useTimelineStore.getState().zoomLevel * zoomDelta));
        setZoomLevel(newZoom);
      } else {
        // Scroll
        const scrollSpeed = e.shiftKey ? 3 : 1;
        viewport.scrollLeft += e.deltaY * scrollSpeed;
      }
    };

    viewport.addEventListener('wheel', handleWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', handleWheel);
  }, [setZoomLevel]);

  // --- MOUSE INTERACTION ---
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!viewportRef.current) return;
      
      const rect = viewportRef.current.getBoundingClientRect();
      const scrollLeft = viewportRef.current.scrollLeft;
      const relativeX = e.clientX - rect.left + scrollLeft;
      const effectiveX = Math.max(0, relativeX - START_PADDING);
      const timeAtMouse = effectiveX / useTimelineStore.getState().zoomLevel;

      if (isDraggingPlayhead) {
        setCurrentTime(Math.max(0, Math.min(contentDuration, timeAtMouse)));
      }

      if (isTrimming) {
        if (isTrimming === 'start') {
          const newStart = Math.min(timeAtMouse, videoTrim.end - 0.5);
          setVideoTrim(Math.max(0, newStart), videoTrim.end);
        } else {
          const newEnd = Math.max(videoTrim.start + 0.5, timeAtMouse);
          setVideoTrim(videoTrim.start, newEnd);
          
          // Update duration if extending
          if (newEnd > duration) {
            setDuration(newEnd);
          }
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingPlayhead(false);
      setIsTrimming(null);
    };

    if (isDraggingPlayhead || isTrimming) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPlayhead, isTrimming, videoTrim, setCurrentTime, setVideoTrim, contentDuration, duration, setDuration]);

  // --- CLICK TO SEEK ---
  const handleTimelineClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.no-seek')) return;

    if (viewportRef.current) {
      const rect = viewportRef.current.getBoundingClientRect();
      const scrollLeft = viewportRef.current.scrollLeft;
      const relativeX = e.clientX - rect.left + scrollLeft;
      
      if (relativeX < START_PADDING) return;

      const effectiveX = relativeX - START_PADDING;
      const timeAtMouse = effectiveX / zoomLevel;
      
      setCurrentTime(Math.max(0, Math.min(contentDuration, timeAtMouse)));
      setIsDraggingPlayhead(true);
    }
  };

  // --- DROP HANDLER ---
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const url = e.dataTransfer.getData('video/url');
    if (url) {
      setOriginalVideo(url);
    }
  };

  // --- RULER TICKS ---
  const tickInterval = zoomLevel > 80 ? 1 : zoomLevel > 40 ? 2 : zoomLevel > 20 ? 5 : 10;
  const ticks = [];
  for (let i = 0; i <= contentDuration; i += tickInterval) {
    ticks.push(i);
  }

  // --- VIDEO TRACK DIMENSIONS ---
  const videoTrackLeft = START_PADDING;
  const videoDuration = videoTrim.end - videoTrim.start;
  const videoTrackWidth = videoDuration * zoomLevel;

  if (!originalVideoUrl) {
    return (
      <div className="flex flex-col h-72 bg-[#121212] border-t border-[#1f1f1f] items-center justify-center">
        <VideoIcon className="w-12 h-12 text-gray-700 mb-3" />
        <p className="text-gray-500 text-sm">Drag media from library to timeline</p>
        <p className="text-gray-600 text-xs mt-1">Or upload a video to get started</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-72 bg-[#121212] border-t border-[#1f1f1f] select-none relative shrink-0 pr-6 z-0">
      
      {/* Keyboard Shortcuts Tooltip */}
      <div className="absolute top-2 right-8 text-[10px] text-gray-600 bg-black/50 px-2 py-1 rounded z-50 font-mono">
        <span className="text-gray-500">Shortcuts:</span> Space=Play | S=Split | Ctrl+S=Save | ←→=Navigate
      </div>

      <div 
        ref={viewportRef} 
        className="flex-1 overflow-x-auto overflow-y-hidden relative modern-scrollbar rounded-xl"
      >
        <div 
          className="h-full relative" 
          style={{ width: `${totalWidth}px`, minWidth: '100%' }}
          onMouseDown={handleTimelineClick}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          
          {/* RULER */}
          <div className="h-10 border-b border-gray-800 w-full pointer-events-none sticky top-0 bg-[#121212] z-20">
            {ticks.map((time) => (
              <div 
                key={time} 
                className="absolute bottom-0 h-4 border-l border-gray-600" 
                style={{ left: `${(time * zoomLevel) + START_PADDING}px` }}
              >
                <span className="absolute -top-6 -left-2 text-[10px] text-gray-400 font-mono select-none font-medium">
                  {formatTime(time)}
                </span>
              </div>
            ))}
          </div>

          {/* PLAYHEAD */}
          <div 
            ref={playheadRef} 
            className="absolute top-0 bottom-0 w-0 z-50 cursor-ew-resize group no-seek"
            style={{ left: 0 }} 
            onMouseDown={(e) => { 
              e.stopPropagation(); 
              setIsDraggingPlayhead(true); 
            }}
          >
            <div className="absolute top-0 left-0 bottom-0 w-[2px] bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
            <div className="absolute -top-0 -left-2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-red-500 transform transition-transform group-hover:scale-125 drop-shadow-lg"></div>
            
            {/* Time tooltip */}
            <div className="absolute -top-8 left-3 bg-red-500 text-white text-[10px] font-mono px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none">
              {formatTime(currentTime)}
            </div>
          </div>

          {/* TRACKS */}
          <div className="py-4 space-y-3 relative w-full mt-2">
            
            {/* VIDEO TRACK */}
            <div 
              className={`h-24 relative group rounded-lg no-seek transition-all ${
                selectedClip?.type === 'video' ? 'ring-2 ring-blue-500' : ''
              }`}
              style={{ 
                left: `${videoTrackLeft}px`, 
                width: `${Math.max(50, videoTrackWidth)}px` 
              }}
              onClick={() => setSelectedClip({ type: 'video' })}
              onContextMenu={(e) => handleContextMenu(e, 'video')}
            >
              <div className="absolute inset-y-1 inset-x-0 bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] rounded-lg border-2 border-purple-500/40 overflow-hidden select-none group-hover:border-purple-400 transition-all shadow-lg">
                
                {/* Thumbnails */}
                {isLoadingThumbnails ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a]">
                    <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                  </div>
                ) : thumbnails.length > 0 ? (
                  <div className="absolute inset-0 flex opacity-30">
                    {thumbnails.map((src, i) => (
                      <img 
                        key={i} 
                        src={src} 
                        className="h-full flex-1 object-cover" 
                        alt=""
                      />
                    ))}
                  </div>
                ) : null}
                
                {/* Label */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-90 z-10 pointer-events-none">
                  <VideoIcon className="w-5 h-5 text-purple-300 drop-shadow-lg"/>
                  <span className="text-xs text-white font-bold tracking-wide drop-shadow-lg">
                    Main Video • {formatTime(videoDuration)}
                  </span>
                </div>

                {/* Trim indicators */}
                {videoTrim.start > 0 && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400"></div>
                )}
                {videoTrim.end < duration && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-yellow-400"></div>
                )}
              </div>
              
              {/* Trim Handles */}
              <div 
                className="no-seek absolute left-0 top-1 bottom-1 w-5 bg-purple-600/90 hover:bg-purple-500 cursor-ew-resize flex items-center justify-center z-30 opacity-0 group-hover:opacity-100 rounded-l-lg transition-all shadow-xl border-r-2 border-purple-400"
                onMouseDown={(e) => { 
                  e.stopPropagation(); 
                  setIsTrimming('start'); 
                }}
                title="Trim Start (drag to adjust)"
              >
                <GripVertical className="w-4 h-4 text-white" />
              </div>
              
              <div 
                className="no-seek absolute right-0 top-1 bottom-1 w-5 bg-purple-600/90 hover:bg-purple-500 cursor-ew-resize flex items-center justify-center z-30 opacity-0 group-hover:opacity-100 rounded-r-lg transition-all shadow-xl border-l-2 border-purple-400"
                onMouseDown={(e) => { 
                  e.stopPropagation(); 
                  setIsTrimming('end'); 
                }}
                title="Trim End (drag to adjust)"
              >
                <GripVertical className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* AUDIO TRACK */}
            {audioUrl && (
              <div 
                className={`h-12 relative rounded-lg bg-gradient-to-br from-[#1a2a3a] to-[#1a1a2a] border-2 border-blue-500/40 overflow-hidden group hover:border-blue-500/70 transition-all no-seek shadow-lg ${
                  selectedClip?.type === 'audio' ? 'ring-2 ring-blue-500' : ''
                }`}
                style={{ 
                  left: `${START_PADDING}px`, 
                  width: `${videoTrackWidth}px` 
                }}
                onClick={() => setSelectedClip({ type: 'audio' })}
                onContextMenu={(e) => handleContextMenu(e, 'audio')}
              >
                <div className="absolute inset-0 flex items-center px-4 gap-2 z-10">
                  <div className="bg-blue-500/30 p-1.5 rounded-lg border border-blue-400/50">
                    <Music className="w-4 h-4 text-blue-300" />
                  </div>
                  <span className="text-xs text-blue-100 font-bold tracking-wide drop-shadow">
                    AI Voiceover
                  </span>
                </div>
                
                {/* Waveform visualization */}
                <div className="absolute bottom-0 left-0 right-0 h-full opacity-20 flex items-end gap-1 px-3">
                  {Array.from({ length: 60 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="bg-blue-400 flex-1 rounded-t-sm transition-all" 
                      style={{ height: `${30 + Math.random() * 70}%` }}
                    ></div>
                  ))}
                </div>
              </div>
            )}

            {/* CAPTIONS TRACK */}
            {captions.length > 0 && (
              <div className="relative h-10 w-full">
                {captions.map((cap, i) => {
                  const capLeft = (cap.start * zoomLevel) + START_PADDING;
                  const capWidth = Math.max(30, (cap.end - cap.start) * zoomLevel);
                  const isSelected = selectedClip?.type === 'caption' && selectedClip.index === i;
                  
                  return (
                    <div 
                      key={i} 
                      className={`no-seek absolute top-0 bottom-0 bg-gradient-to-r from-yellow-900/40 to-yellow-800/40 border-2 rounded-lg flex items-center px-3 overflow-hidden hover:from-yellow-800/60 hover:to-yellow-700/60 transition cursor-pointer group ${
                        isSelected ? 'ring-2 ring-yellow-400 border-yellow-400' : 'border-yellow-600/50'
                      }`}
                      style={{ 
                        left: `${capLeft}px`, 
                        width: `${capWidth}px` 
                      }}
                      onClick={() => setSelectedClip({ type: 'caption', index: i })}
                      onContextMenu={(e) => handleContextMenu(e, 'caption', i)}
                      title={cap.text}
                    >
                      {i === 0 && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400/80"></div>
                      )}
                      <span className="text-[10px] text-yellow-50 truncate font-medium select-none group-hover:text-white drop-shadow">
                        {cap.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* CONTEXT MENU */}
      {contextMenu && (
        <div 
          className="fixed bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-2xl py-1 z-[100] min-w-[180px]"
          style={{ 
            left: `${contextMenu.x}px`, 
            top: `${contextMenu.y}px` 
          }}
        >
          <button
            onClick={() => {
              copyClip(contextMenu.clipType, contextMenu.clipIndex);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3"
          >
            <Copy className="w-4 h-4" />
            Copy <span className="ml-auto text-xs text-gray-500">Ctrl+C</span>
          </button>
          
          <button
            onClick={() => {
              cutClip(contextMenu.clipType, contextMenu.clipIndex);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3"
          >
            <Scissors className="w-4 h-4" />
            Cut <span className="ml-auto text-xs text-gray-500">Ctrl+X</span>
          </button>
          
          <button
            onClick={() => {
              pasteClip(currentTime);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3"
          >
            <Copy className="w-4 h-4 rotate-180" />
            Paste <span className="ml-auto text-xs text-gray-500">Ctrl+V</span>
          </button>
          
          <div className="h-px bg-gray-700 my-1"></div>
          
          <button
            onClick={() => {
              splitClipAtPlayhead(currentTime);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3"
          >
            <Split className="w-4 h-4" />
            Split at Playhead <span className="ml-auto text-xs text-gray-500">S</span>
          </button>
          
          <div className="h-px bg-gray-700 my-1"></div>
          
          <button
            onClick={() => {
              deleteClip(contextMenu.clipType, contextMenu.clipIndex);
              setSelectedClip(null);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 flex items-center gap-3"
          >
            <Trash2 className="w-4 h-4" />
            Delete <span className="ml-auto text-xs text-gray-500">Del</span>
          </button>
        </div>
      )}
    </div>
  );
};