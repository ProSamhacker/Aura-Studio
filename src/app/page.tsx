'use client';

import { useState, useRef } from 'react';
import { UploadCloud, Sparkles, Play, Pause } from 'lucide-react';
import { useTimelineStore } from '@/core/stores/useTimelineStore';

export default function DashboardPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Connect to our new Brain
  const { setOriginalVideo, originalVideoUrl, setScript, generatedScript } = useTimelineStore();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Create a local URL for the video so we can play it immediately
    const objectUrl = URL.createObjectURL(file);
    setOriginalVideo(objectUrl);

    // 2. Trigger Gemini Analysis (Real)
    await analyzeVideo(file);
  };

  const analyzeVideo = async (file: File) => {
    setIsAnalyzing(true);
    // In a real app, we'd upload the file to S3 here. 
    // For now, we send the filename as context to Gemini.
    
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        body: JSON.stringify({
          prompt: `User uploaded a video file named: ${file.name}. Size: ${file.size} bytes.`,
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        fullText += text;
        setScript(fullText); // Store in global state
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-10 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: Upload & Player */}
        <div className="space-y-6">
          <div className="text-left space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Aura Studio
            </h1>
            <p className="text-slate-400">AI Post-Production Suite</p>
          </div>

          {!originalVideoUrl ? (
            // Upload Box
            <div 
              className="border-2 border-dashed border-slate-700 rounded-xl h-64 flex flex-col items-center justify-center hover:border-blue-500 hover:bg-slate-900/50 transition cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="video/*"
                onChange={handleFileSelect}
              />
              <div className="bg-slate-800 p-4 rounded-full mb-4 group-hover:scale-110 transition">
                <UploadCloud className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold">Upload Raw Footage</h3>
            </div>
          ) : (
            // Video Preview
            <div className="relative rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
              <video 
                src={originalVideoUrl} 
                controls 
                className="w-full aspect-video bg-black"
              />
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: AI Analysis */}
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 h-[600px] overflow-y-auto">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <h2 className="font-semibold text-lg">AI Director's Cut</h2>
          </div>
          
          {generatedScript ? (
            <div className="prose prose-invert prose-sm max-w-none text-slate-300 whitespace-pre-wrap">
              {generatedScript}
            </div>
          ) : (
            <div className="text-slate-600 italic text-center mt-20">
              Upload a video to generate script and analysis...
            </div>
          )}
        </div>

      </div>
    </div>
  );
}