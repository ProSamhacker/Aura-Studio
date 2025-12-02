// src/app/project/[projectId]/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useTimelineStore } from '@/core/stores/useTimelineStore';
import { FFmpegClient } from '@/core/ffmpeg/client';
import { compressVideo, mergeAudioWithVideo } from '@/core/ffmpeg/actions';
import { Sidebar } from '@/components/layout/Sidebar';
import { ToolPanel } from '@/components/layout/ToolPanel';
import { Canvas } from '@/components/studio/Canvas'; 
import { Timeline } from '@/components/studio/Timeline';
import { TimelineControls } from '@/components/studio/TimelineControls';
import { Download, Loader2 } from 'lucide-react';

export default function StudioPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTool, setActiveTool] = useState('upload');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [previewVoiceUrl, setPreviewVoiceUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  
  const COMPRESSION_THRESHOLD = 100 * 1024 * 1024; 

  const { 
    setOriginalVideo, originalVideoUrl, setScript, appendScript, generatedScript,
    audioUrl, setAudio, setCaptions,
    setIsPlaying, setCurrentTime, setDuration // Ensure setDuration is imported
  } = useTimelineStore();

  useEffect(() => {
    FFmpegClient.getInstance().then(() => setReady(true)).catch(e => console.error(e));
  }, []);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Show local preview immediately (Fast, but temporary)
    const localUrl = URL.createObjectURL(file);
    setOriginalVideo(localUrl);

    // --- FIX START: Extract Duration & Reset Timeline ---
    // We create a temporary hidden video element to read metadata
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.onloadedmetadata = () => {
      const duration = tempVideo.duration;
      // This update resets videoTrim to {0, duration}, fixing the invisible timeline
      if (duration && isFinite(duration)) {
        setDuration(duration); 
      }
    };
    tempVideo.src = localUrl;
    // --- FIX END ---
    
    // 2. Upload to Drive in background
    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        
        console.log("Saved to Drive:", data.url);
        
        // Replace the temporary local link with the permanent Cloud link
        // Note: Ideally, keep using localUrl for thumbnails to avoid network lag
        setOriginalVideo(data.url); 
        
    } catch (error) {
        console.error("Upload failed", error);
    }

    setActiveTool('script'); 
    await analyzeVideo(file);
  };

  const analyzeVideo = async (file: File) => {
    setIsAnalyzing(true);
    const { setScript, appendScript } = useTimelineStore.getState();
    try {
      let base64Video = "";
      if (file.size > COMPRESSION_THRESHOLD) {
        setIsProcessing(true); setProgress(0);
        const rawUrl = URL.createObjectURL(file);
        const compressedBlob = await compressVideo(rawUrl, (pct) => setProgress(pct));
        base64Video = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(compressedBlob);
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
        });
        setIsProcessing(false); 
      } else {
        base64Video = await fileToBase64(file);
      }

      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        body: JSON.stringify({ 
            prompt: "Analyze this video and write a synchronized voiceover script. format: **(0:00 - 0:00)** \"Spoken Text\". Do not provide a summary, mood, or intro text. Output ONLY the script.",
            videoData: base64Video, 
            mimeType: file.type 
        }),
      });
      
      if (!response.ok) throw new Error("API Error");
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;
      
      setScript(''); 
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
       let chunk = decoder.decode(value, { stream: true });
        
        chunk = chunk
            .replace(/[#"*]/g, "")      
            .replace(/\*\*/g, "")       
            .replace(/###/g, "")        
            .replace(/^Title:/gm, "")   
            .replace(/^Summary:/gm, "") 

        appendScript(chunk);
      }
    } catch (err) { console.error(err); } 
    finally { setIsAnalyzing(false); setIsProcessing(false); }
  };

 const handleGenerateVoice = async () => {
    if (!generatedScript) return;
    setIsGeneratingVoice(true);
    
    try {
       const lines = generatedScript.split('\n');
       const cleanLines = lines
        .map(line => line.replace(/^[\s-]*[\(\[]?\d{1,2}:\d{2}(?:.*?)[\)\]]?:?\s*/, "").trim())
        .filter(line => line.length > 0);

       const textToRead = cleanLines.join(' ');
       if (textToRead.length < 2) throw new Error("Script is empty.");

       const response = await fetch('/api/ai/voice', {
         method: 'POST',
         body: JSON.stringify({ text: textToRead, voiceId: "pNInz6obpgDQGcFmaJgB" }),
       });
       
       if (!response.ok) throw new Error('Failed');
       const blob = await response.blob();
       setPreviewVoiceUrl(URL.createObjectURL(blob));
       
    } catch (e) { 
        alert("Voice generation failed"); 
        console.error(e); 
    } finally { 
        setIsGeneratingVoice(false); 
    }
  };

  const handleApplyVoice = () => {
      if (previewVoiceUrl) {
          setAudio(previewVoiceUrl);
          setCaptions([]); 
          setPreviewVoiceUrl(null); 
      }
  };

  // --- Caption generation with filtering ---
  const handleAutoCaption = async () => {
    let mediaToTranscribe = audioUrl || originalVideoUrl;
    let mimeType = audioUrl ? 'audio/mpeg' : 'video/mp4';
    if (!mediaToTranscribe) return;
    
    setIsTranscribing(true);
    try {
       const responseMedia = await fetch(mediaToTranscribe);
       const blob = await responseMedia.blob();
       const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
       });

       const response = await fetch('/api/ai/transcribe', {
         method: 'POST',
         body: JSON.stringify({ mediaData: base64Data, mimeType: mimeType }),
       });
       
       const data = await response.json();
       
       // Filter out garbage captions (numbers, timecodes, empty strings)
       const cleanCaptions = data.captions
        .map((c: any) => ({ ...c, start: parseFloat(c.start), end: parseFloat(c.end) }))
        .filter((c: any) => {
            const text = c.text.trim();
            // Reject purely numeric strings (e.g. "004", "2024")
            if (/^\d+$/.test(text)) return false; 
            // Reject timecode-like strings (e.g. "00:04", "1:30")
            if (/^\d{1,2}:\d{2}$/.test(text)) return false;
            return text.length > 0;
        });

       setCaptions(cleanCaptions);
    } catch (e) { 
        console.error(e);
        alert("Transcription failed"); 
    } 
    finally { setIsTranscribing(false); }
  };

  const handleFinalExport = async () => {
      if (!originalVideoUrl || !audioUrl) return;
      setIsProcessing(true);
      try {
        const finalUrl = await mergeAudioWithVideo(originalVideoUrl, audioUrl, (pct) => setProgress(pct));
        const a = document.createElement('a'); a.href = finalUrl; a.download = 'final.mp4'; a.click();
      } catch (e) { alert("Export failed"); } finally { setIsProcessing(false); }
  };

  return (
    <div className="flex h-screen bg-[#0E0E0E] text-white overflow-hidden font-sans selection:bg-purple-500/30">
      
      {/* ZONE A: SIDEBAR */}
      <Sidebar activeTool={activeTool} setActiveTool={setActiveTool} />

      {/* ZONE B: TOOL PANEL */}
      <ToolPanel 
         activeTool={activeTool}
         isAnalyzing={isAnalyzing}
         isGeneratingVoice={isGeneratingVoice}
         isTranscribing={isTranscribing}
         previewVoiceUrl={previewVoiceUrl}
         handleGenerateVoice={handleGenerateVoice}
         handleApplyVoice={handleApplyVoice}
         handleAutoCaption={handleAutoCaption}
         fileInputRef={fileInputRef}
         handleFileSelect={handleFileSelect}
      />

      {/* ZONE C: MAIN STAGE */}
      <div className="flex-1 flex flex-col relative min-w-0">
        
        {/* Header Area */}
        <div className="h-14 border-b border-[#1f1f1f] flex items-center justify-between px-6 bg-[#0F0F0F] shrink-0">
            <span className="text-xs font-medium text-gray-400">Project: Aura Studio</span>
            <button 
                onClick={handleFinalExport}
                disabled={isProcessing || !audioUrl}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2"
            >
                {isProcessing ? <Loader2 className="animate-spin w-3 h-3"/> : <Download className="w-3 h-3"/>}
                Export
            </button>
        </div>

        {/* ZONE C: CANVAS */}
        <Canvas isProcessing={isProcessing} progress={progress} />

        {/* ZONE D: TIMELINE AREA */}
        <TimelineControls />
        <Timeline />

      </div>
    </div>
  );
}