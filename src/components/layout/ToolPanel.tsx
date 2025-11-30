import { useTimelineStore } from '@/core/stores/useTimelineStore';
import { Loader2, Mic, Wand2, CheckCircle, Bot, Clock } from 'lucide-react';
import { ExternalLink } from 'lucide-react';

interface ToolPanelProps {
  activeTool: string;
  isAnalyzing: boolean;
  isGeneratingVoice: boolean;
  isTranscribing: boolean;
  previewVoiceUrl: string | null;
  handleGenerateVoice: () => void;
  handleApplyVoice: () => void;
  handleAutoCaption: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ToolPanel = ({ 
  activeTool, isAnalyzing, isGeneratingVoice, isTranscribing, previewVoiceUrl,
  handleGenerateVoice, handleApplyVoice, handleAutoCaption, fileInputRef, handleFileSelect 
}: ToolPanelProps) => {
  
  const { generatedScript, setScript, audioUrl, captions } = useTimelineStore();

  const handleLineUpdate = (index: number, newText: string, timestamp: string | null) => {
    const lines = generatedScript.split('\n');
    // If we have a timestamp, prepend it back: "(0:00) Text"
    // If not, just use the text.
    lines[index] = timestamp ? `(${timestamp}) ${newText}` : newText;
    setScript(lines.join('\n'));
  };

  return (
    <div className="w-[360px] bg-[#141414] border-r border-[#1f1f1f] h-screen overflow-y-auto flex flex-col shrink-0 z-20 transition-all duration-300">
      
      {/* --- 1. MEDIA UPLOAD PANEL --- */}
      {activeTool === 'upload' && (
        <div className="p-6">
          <h2 className="text-lg font-bold text-white mb-6">Project Media</h2>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-700 rounded-xl h-40 flex flex-col items-center justify-center bg-[#1a1a1a] hover:bg-[#202020] hover:border-purple-500 cursor-pointer transition group"
          >
            <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={handleFileSelect} />
            <div className="bg-[#252525] p-3 rounded-full mb-3 group-hover:scale-110 transition">
                <Wand2 className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-sm text-gray-400 font-medium">Upload Video</p>
            <p className="text-xs text-gray-600 mt-1">Auto-Compress & Analyze</p>
          </div>
        </div>
      )}

      {/* --- 2. SCRIPT EDITOR PANEL (FIXED) --- */}
      {activeTool === 'script' && (
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-[#1f1f1f] sticky top-0 bg-[#141414] z-10">
            <h2 className="text-lg font-bold text-white">AI Script</h2>
            <p className="text-xs text-gray-500 mt-1">
                {isAnalyzing ? "Analyzing footage..." : "Edit text segments below."}
            </p>
          </div>
          
          <div className="flex-1 p-4 space-y-3">
            {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center h-64 text-purple-400 space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="text-sm font-medium animate-pulse">Gemini is watching...</span>
                </div>
            ) : generatedScript ? (
                generatedScript.split('\n').map((line, index) => {
                    if (!line.trim()) return null;

                    // --- UPDATED REGEX LOGIC ---
                    // Matches: (0:00) OR (0:00 - 0:05) OR 0:00 OR - 0:00)
                    // It grabs the entire prefix including dashes and spaces.
                    const match = line.match(/^[\s-]*[\(\[]?(\d{1,2}:\d{2}(?:\s*[-–]\s*\d{1,2}:\d{2})?)[\)\]]?:?\s*/);
                    
                    const timestamp = match ? match[1] : null; // "0:00 - 0:05"
                    const fullPrefix = match ? match[0] : "";  // "(0:00 - 0:05) "
                    
                    // Clean text is the line MINUS the entire prefix
                    const textContent = line.replace(fullPrefix, "").trim();

                    return (
                        <div key={index} className="group bg-[#1a1a1a] border border-gray-800 hover:border-gray-600 rounded-xl p-3 transition-all relative">
                            {/* Timestamp Badge */}
                            <div className="flex items-center gap-2 mb-2">
                                <div className="bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 border border-purple-500/20 select-none">
                                    <Clock className="w-3 h-3" />
                                    {timestamp || "Auto"}
                                </div>
                            </div>
                            
                            {/* Clean Text Area */}
                            <textarea 
                                className="w-full bg-transparent text-gray-200 text-sm leading-relaxed outline-none resize-none font-medium h-auto overflow-hidden placeholder-gray-600"
                                value={textContent}
                                rows={Math.max(2, Math.ceil(textContent.length / 35))}
                                onChange={(e) => handleLineUpdate(index, e.target.value, timestamp)}
                            />
                        </div>
                    );
                })
            ) : (
                <div className="text-center text-gray-600 mt-10 text-sm italic">
                    Upload a video to generate a script.
                </div>
            )}
          </div>
        </div>
      )}

      {/* --- 3. VOICE STUDIO PANEL --- */}
      {activeTool === 'voice' && (
        <div className="p-6 space-y-8">
          <div>
            <h2 className="text-lg font-bold text-white mb-2">Voice Studio</h2>
            <p className="text-xs text-gray-500">Powered by ElevenLabs</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Voice Actor</label>
                <select className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg p-3 text-white text-sm outline-none focus:border-purple-500">
                    <option>Adam (Deep Narrative)</option>
                    <option>Bella (Energetic)</option>
                    <option>Josh (Casual)</option>
                </select>
            </div>

            <button 
                onClick={handleGenerateVoice}
                disabled={isGeneratingVoice || !generatedScript}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-purple-900/20"
            >
                {isGeneratingVoice ? <Loader2 className="animate-spin w-4 h-4"/> : <Mic className="w-4 h-4"/>}
                {isGeneratingVoice ? "Generating..." : "Generate Voiceover"}
            </button>
          </div>

          {previewVoiceUrl && !audioUrl && (
             <div className="bg-purple-900/20 p-4 rounded-xl border border-purple-500/50 animate-in fade-in slide-in-from-top-2">
                 <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-purple-300 font-bold uppercase">Preview</span>
                    <button onClick={handleApplyVoice} className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded text-xs font-bold transition">Apply to Timeline</button>
                 </div>
                 <audio controls src={previewVoiceUrl} className="w-full h-8 opacity-90" />
             </div>
          )}

          {audioUrl && (
             <div className="bg-[#1a1a1a] p-4 rounded-xl border border-green-500/30">
                 <div className="flex items-center gap-3 mb-3">
                    <div className="bg-green-500/10 p-2 rounded-full">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <span className="text-sm text-white font-medium">Voiceover Active</span>
                 </div>
                 <audio controls src={audioUrl} className="w-full h-8 opacity-80" />
             </div>
          )}
        </div>
      )}

      {/* --- 4. CAPTIONS PANEL --- */}
      {activeTool === 'captions' && (
        <div className="flex flex-col h-full">
            <div className="p-5 border-b border-[#1f1f1f] bg-[#141414]">
                <h2 className="text-lg font-bold text-white mb-2">Subtitles</h2>
                <button onClick={handleAutoCaption} disabled={isTranscribing} className="w-full bg-[#252525] hover:bg-[#303030] text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 border border-gray-700 transition">
                    {isTranscribing ? <Loader2 className="animate-spin w-4 h-4"/> : <Wand2 className="w-4 h-4 text-yellow-400"/>}
                    {captions.length > 0 ? "Regenerate Captions" : "Auto-Transcribe"}
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {captions.map((cap, i) => (
                    <div key={i} className="group flex gap-3 p-3 rounded-lg hover:bg-[#1a1a1a] transition border border-transparent hover:border-gray-800">
                        <div className="text-[10px] text-gray-600 font-mono mt-1 w-12 shrink-0">{cap.start.toFixed(1)}s</div>
                        <textarea className="flex-1 bg-transparent text-gray-300 text-sm outline-none resize-none h-auto overflow-hidden" defaultValue={cap.text} rows={Math.ceil(cap.text.length / 30)}/>
                    </div>
                ))}
            </div>
        </div>
      )}

     {/* --- 5. AURAIQ BOT (EMBEDDED) --- */}
      {activeTool === 'auraiq' && (
        <div className="flex flex-col h-full bg-[#141414]">
             <div className="p-5 border-b border-[#1f1f1f] flex justify-between items-start">
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Bot className="w-5 h-5 text-blue-400"/> AuraIQ
                    </h2>
                    <p className="text-xs text-gray-500">Your AI Production Assistant</p>
                </div>
                <a 
                    href="https://auraiq-app.vercel.app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-white transition p-1 hover:bg-[#252525] rounded-md"
                    title="Open in new tab"
                >
                    <ExternalLink className="w-4 h-4" />
                </a>
             </div>
             
             {/* THE EMBED */}
             <div className="flex-1 relative bg-white/5">
                <iframe 
                    src="https://auraiq-app.vercel.app"
                    className="absolute inset-0 w-full h-full border-none"
                    title="AuraIQ Assistant"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                    loading="lazy"
                />
             </div>
        </div>
      )}
    </div>
  );
};