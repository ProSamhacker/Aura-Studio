'use client';

import { useState, useRef, useEffect } from 'react';
import { useTimelineStore } from '@/core/stores/useTimelineStore';
import { FFmpegClient } from '@/core/ffmpeg/client';
import { trimVideo, compressVideo, mergeAudioWithVideo } from '@/core/ffmpeg/actions';
import { Sidebar } from '@/components/layout/Sidebar';
import { ToolPanel } from '@/components/layout/ToolPanel';
import { RemotionPlayer } from '@/components/editor/RemotionPlayer';
import { Download, Loader2, Scissors, UploadCloud } from 'lucide-react';

export default function StudioPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTool, setActiveTool] = useState('upload');
  
  // Logic States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  // Preview State (Restored from your old code)
  const [previewVoiceUrl, setPreviewVoiceUrl] = useState<string | null>(null);

  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const COMPRESSION_THRESHOLD = 100 * 1024 * 1024; 

  const { 
    setOriginalVideo, originalVideoUrl, setScript, appendScript, generatedScript,
    audioUrl, setAudio, captions, setCaptions 
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
    
    // Reset states
    setOriginalVideo(URL.createObjectURL(file));
    setCaptions([]);
    setAudio("");
    setPreviewVoiceUrl(null);
    
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

      // Updated prompt to be more specific
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
        
        // --- THE CLEANER ---
        // Removes: #, ", *, and markdown headers
        chunk = chunk
            .replace(/[#"*]/g, "")      // Remove # " *
            .replace(/\*\*/g, "")       // Remove double asterisks
            .replace(/###/g, "")        // Remove triple hashtags
            .replace(/^Title:/gm, "")   // Remove "Title:" labels
            .replace(/^Summary:/gm, "") // Remove "Summary:" labels
        
        // (Optional) If you really want to remove commas, uncomment this:
        // chunk = chunk.replace(/,/g, ""); 

        appendScript(chunk);
      }
    } catch (err) { console.error(err); } 
    finally { setIsAnalyzing(false); setIsProcessing(false); }
  };

  // --- RESTORED ROBUST VOICE GENERATION LOGIC ---
 const handleGenerateVoice = async () => {
    if (!generatedScript) return;
    setIsGeneratingVoice(true);
    
    try {
       // 1. SPLIT BY LINE
       const lines = generatedScript.split('\n');
       
       // 2. SIMPLE PARSER
       const cleanLines = lines
        .map(line => line.trim())
        .filter(line => {
            if (!line) return false;
            // Filter out timestamps like (0:00) or 0:00
            // This regex catches (0:00), 0:00, [0:00]
            if (line.match(/^[\(\[]?\d{1,2}:\d{2}/)) return false;
            return true;
        });

       const textToRead = cleanLines.join(' ');
       
       console.log("🗣️ CLEANED TEXT FOR AI:", textToRead);

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
  // --- NEW: Apply Voice Function ---
  const handleApplyVoice = () => {
      if (previewVoiceUrl) {
          setAudio(previewVoiceUrl);
          setCaptions([]); // Reset captions because audio changed
          setPreviewVoiceUrl(null); // Clear preview
      }
  };

  // --- RESTORED SMART CAPTION LOGIC ---
  const handleAutoCaption = async () => {
    // Logic: Transcribe Voiceover if exists, otherwise transcribe Video
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
       setCaptions(data.captions.map((c: any) => ({ ...c, start: parseFloat(c.start), end: parseFloat(c.end) })));
    } catch (e) { alert("Transcription failed"); } 
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

  // --- RENDER ---
  return (
    <div className="flex h-screen bg-[#0E0E0E] text-white overflow-hidden font-sans selection:bg-purple-500/30">
      
      {/* ZONE A: SIDEBAR */}
      <Sidebar activeTool={activeTool} setActiveTool={setActiveTool} />

      {/* ZONE B: TOOL PANEL (Dynamic Drawer) */}
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
        
        {/* Header */}
        <div className="h-14 border-b border-[#1f1f1f] flex items-center justify-between px-6 bg-[#0F0F0F]">
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-xs font-medium text-gray-400">Project: Untitled Video</span>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={handleFinalExport}
                    disabled={isProcessing || !audioUrl}
                    className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2"
                >
                    {isProcessing ? <Loader2 className="animate-spin w-3 h-3"/> : <Download className="w-3 h-3"/>}
                    Export Video
                </button>
            </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-[#0a0a0a] p-8 flex flex-col items-center justify-center relative">
             {!originalVideoUrl ? (
                <div className="text-center text-gray-600">
                    <div className="w-16 h-16 bg-[#141414] rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-800">
                        <UploadCloud className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-sm">Select "Media" in the sidebar to upload</p>
                </div>
             ) : (
                <div className="w-full max-w-5xl aspect-video shadow-2xl shadow-black ring-1 ring-gray-800 rounded-lg overflow-hidden relative bg-black">
                    <RemotionPlayer />
                    {/* Simple Compression Progress Overlay */}
                    {isProcessing && (
                         <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
                             <p className="text-white font-medium animate-pulse mb-2">Processing...</p>
                             <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 transition-all" style={{width: `${progress}%`}}></div>
                             </div>
                         </div>
                    )}
                </div>
             )}
        </div>

        {/* ZONE D: TIMELINE */}
        <div className="h-60 bg-[#0F0F0F] border-t border-[#1f1f1f] p-4 flex flex-col">
            <div className="flex justify-between items-center mb-2 px-1">
                <div className="flex gap-4 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                    <span className="cursor-pointer hover:text-white">00:00</span>
                    <span>00:15</span>
                    <span>00:30</span>
                </div>
                <div className="flex gap-2">
                    <Scissors className="w-3 h-3 text-gray-500 hover:text-white cursor-pointer"/>
                </div>
            </div>
            
            {/* Tracks Container */}
            <div className="flex-1 space-y-1 relative overflow-hidden">
                {/* Video Track */}
                <div className="h-10 bg-[#1a1a1a] rounded border border-gray-800 flex items-center px-1 relative overflow-hidden group">
                    <div className="absolute inset-0 flex gap-0.5 opacity-20">
                        {[...Array(20)].map((_, i) => <div key={i} className="flex-1 bg-gray-500/50 rounded-sm"></div>)}
                    </div>
                    <span className="relative z-10 text-[9px] text-gray-400 pl-2 font-medium">VIDEO 1</span>
                </div>
                
                {/* Audio Track */}
                {audioUrl && (
                    <div className="h-10 bg-purple-900/20 rounded border border-purple-500/30 flex items-center px-2 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/c/c3/Waveform.png')] bg-repeat-x opacity-30 bg-contain"></div>
                        <span className="relative z-10 text-[9px] text-purple-300 font-medium">AI VOICEOVER</span>
                    </div>
                )}

                {/* Caption Track */}
                {captions.length > 0 && (
                    <div className="h-8 bg-yellow-900/20 rounded border border-yellow-500/30 flex items-center px-2 mt-1">
                        <span className="text-[9px] text-yellow-300 font-medium">SUBTITLES</span>
                    </div>
                )}

                {/* Playhead */}
                <div className="absolute top-0 left-[10%] bottom-0 w-px bg-red-500 z-50 shadow-[0_0_8px_rgba(255,0,0,0.8)]">
                    <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rotate-45 rounded-sm"></div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}