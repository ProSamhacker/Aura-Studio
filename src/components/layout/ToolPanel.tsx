import { useTimelineStore } from '@/core/stores/useTimelineStore';
import { Loader2, Mic, Wand2, Bot, Clock, RefreshCw, FileVideo, Plus, Trash2, Edit3, X } from 'lucide-react';
import EnhancedVoicePanel from '@/components/NEW/VoiceControlPanel';
import CaptionStyleEditor from '@/components/NEW/CaptionStyleEditor';

interface ToolPanelProps {
  activeTool: string;
  isAnalyzing: boolean;
  isGeneratingVoice: boolean;
  isTranscribing: boolean;
  previewVoiceUrl: string | null;
  handleGenerateVoice: () => void;
  handleApplyVoice: () => void;
  handleAutoCaption: () => void;
  handleRegenerateScript: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ToolPanel = ({ 
  activeTool, isAnalyzing, isGeneratingVoice, isTranscribing, previewVoiceUrl,
  handleGenerateVoice, handleApplyVoice, handleAutoCaption, handleRegenerateScript,
  fileInputRef, handleFileSelect 
}: ToolPanelProps) => {
  
  const { 
    generatedScript, setScript, captions, 
    voiceSettings, setVoiceSettings,
    defaultCaptionStyle, setDefaultCaptionStyle, updateCaption, 
    mediaLibrary, setOriginalVideo, originalVideoUrl
  } = useTimelineStore();

  const handleLineUpdate = (index: number, newText: string, timestamp: string | null) => {
    const lines = generatedScript.split('\n');
    lines[index] = timestamp ? `(${timestamp}) ${newText}` : newText;
    setScript(lines.join('\n'));
  };

  return (
    <div className="w-[360px] bg-[#141414] border-r border-[#1f1f1f] h-screen flex flex-col shrink-0 z-20 transition-all duration-300">
      
      {/* --- 1. MEDIA LIBRARY PANEL --- */}
      {activeTool === 'upload' && (
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-[#1f1f1f] flex justify-between items-center">
            <h2 className="text-base font-bold text-white">Project Media</h2>
            <span className="text-xs text-gray-500">{mediaLibrary.length} assets</span>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto no-scrollbar space-y-4">
            {/* Upload Area */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-gray-700 rounded-xl h-24 flex flex-col items-center justify-center bg-[#1a1a1a] hover:bg-[#202020] hover:border-purple-500 cursor-pointer transition group"
            >
              <input type="file" ref={fileInputRef} className="hidden" accept="video/*,image/*" multiple onChange={handleFileSelect} />
              <div className="flex items-center gap-2 text-gray-400 group-hover:text-purple-400 transition">
                <Plus className="w-4 h-4" />
                <span className="text-xs font-bold">Add Media</span>
              </div>
              <p className="text-[10px] text-gray-600 mt-1">Videos & Images supported</p>
            </div>

            {/* Media Grid */}
            <div className="grid grid-cols-2 gap-3">
                {mediaLibrary.map((media) => (
                    <div 
                        key={media.id}
                        onClick={() => media.type === 'video' && setOriginalVideo(media.url)}
                        className={`aspect-video bg-[#000] rounded-lg border relative group cursor-pointer overflow-hidden ${originalVideoUrl === media.url ? 'border-purple-500 ring-1 ring-purple-500/50' : 'border-gray-800 hover:border-gray-600'}`}
                    >
                        {media.type === 'video' ? (
                            <video src={media.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" />
                        ) : (
                            <img src={media.url} alt={media.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" />
                        )}
                        
                        {/* Overlay Info */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                            <p className="text-[10px] text-white truncate font-medium">{media.name}</p>
                        </div>
                        
                        {/* Active Indicator */}
                        {originalVideoUrl === media.url && (
                            <div className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                        )}
                    </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* --- 2. SCRIPT EDITOR PANEL --- */}
      {activeTool === 'script' && (
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-[#1f1f1f] sticky top-0 bg-[#141414] z-10 flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-white">AI Script</h2>
              <p className="text-[10px] text-gray-500 mt-0.5">Auto-generated narrative</p>
            </div>
            <button 
              onClick={handleRegenerateScript}
              disabled={isAnalyzing || !originalVideoUrl}
              className="p-1.5 bg-[#1f1f1f] hover:bg-[#2a2a2a] text-gray-400 hover:text-white rounded-lg transition"
              title="Regenerate"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto no-scrollbar space-y-3">
            {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center h-64 text-purple-400 space-y-3">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-xs font-medium animate-pulse">Analyzing visual content...</span>
                </div>
            ) : generatedScript ? (
                generatedScript.split('\n').map((line, index) => {
                    if (!line.trim()) return null;
                    const match = line.match(/^[\s-]*[\(\[]?(\d{1,2}:\d{2}(?:\s*[-–]\s*\d{1,2}:\d{2})?)[\)\]]?:?\s*/);
                    const timestamp = match ? match[1] : null;
                    const textContent = line.replace(match ? match[0] : "", "").trim();

                    return (
                        <div key={index} className="group bg-[#1a1a1a] border border-gray-800 hover:border-gray-600 focus-within:border-purple-500/50 rounded-xl p-3 transition-all">
                            {timestamp && (
                                <div className="flex items-center gap-1 mb-2 text-[10px] text-purple-400 font-mono">
                                    <Clock className="w-3 h-3" />
                                    {timestamp}
                                </div>
                            )}
                            <textarea 
                                className="w-full bg-transparent text-gray-200 text-sm leading-relaxed outline-none resize-none font-medium placeholder-gray-600"
                                value={textContent}
                                rows={Math.max(2, Math.ceil(textContent.length / 35))}
                                onChange={(e) => handleLineUpdate(index, e.target.value, timestamp)}
                            />
                        </div>
                    );
                })
            ) : (
                <div className="text-center text-gray-600 mt-10 text-xs italic p-4 border border-dashed border-gray-800 rounded-xl">
                    Add a video to generate a script automatically.
                </div>
            )}
          </div>
        </div>
      )}

      {/* --- 3. VOICE STUDIO PANEL --- */}
      {activeTool === 'voice' && (
        <EnhancedVoicePanel
          settings={voiceSettings}
          onSettingsChange={setVoiceSettings}
          onGenerate={handleGenerateVoice}
          isGenerating={isGeneratingVoice}
          previewUrl={previewVoiceUrl}
          onApply={handleApplyVoice}
          script={generatedScript}
        />
      )}

      {/* --- 4. CAPTION EDITOR PANEL --- */}
      {activeTool === 'captions' && (
        <div className="flex flex-col h-full bg-[#141414]">
          <div className="p-5 border-b border-[#1f1f1f]">
             <h2 className="text-base font-bold text-white mb-4">Captions</h2>
             
             {/* Generate Button is ALWAYS here */}
             <button 
                onClick={handleAutoCaption}
                disabled={isTranscribing}
                className="w-full py-3 bg-[#202020] hover:bg-[#2a2a2a] border border-gray-800 hover:border-purple-500/50 rounded-xl flex items-center justify-center gap-2 text-gray-300 hover:text-white transition group"
            >
                {isTranscribing ? <Loader2 className="w-4 h-4 animate-spin text-purple-500" /> : <Bot className="w-4 h-4 group-hover:text-purple-500 transition" />}
                <span className="text-xs font-bold">{isTranscribing ? "Transcribing..." : "Generate Captions"}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            {captions.length > 0 ? (
                <>
                    {/* Style Editor appears only when captions exist */}
                    <CaptionStyleEditor
                        style={defaultCaptionStyle}
                        onChange={setDefaultCaptionStyle}
                    />
                    
                    {/* Caption List */}
                    <div className="p-4 space-y-2">
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Transcript</div>
                        {captions.map((cap, i) => (
                            <div key={i} className="bg-[#1a1a1a] p-3 rounded-lg border border-gray-800 hover:border-gray-700 transition group focus-within:border-purple-500/50">
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-1.5 rounded">{cap.start.toFixed(1)}s - {cap.end.toFixed(1)}s</span>
                                    <button className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"><Trash2 className="w-3 h-3" /></button>
                                </div>
                                <textarea
                                    value={cap.text}
                                    onChange={(e) => updateCaption(i, { text: e.target.value })}
                                    className="w-full bg-transparent text-xs text-gray-200 outline-none resize-none leading-relaxed"
                                    rows={Math.max(1, Math.ceil(cap.text.length / 30))}
                                />
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-600 px-8 text-center">
                    <p className="text-xs">No captions yet.</p>
                    <p className="text-[10px] mt-1 text-gray-700">Click generate to analyze audio.</p>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};