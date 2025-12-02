import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, Volume2, Gauge, Activity, Play, CheckCircle, Loader2,
  User, UserCircle, X, ChevronRight
} from 'lucide-react';

interface VoiceSettings {
  voiceId: string;
  speed: number;
  pitch: number;
  stability: number;
  similarityBoost: number;
}

interface Voice {
  id: string;
  name: string;
  description: string;
  gender: 'male' | 'female';
  age: 'young' | 'middle' | 'old';
  style: string;
}

const EnhancedVoicePanel = ({
  settings,
  onSettingsChange,
  onGenerate,
  isGenerating,
  previewUrl,
  onApply,
  script
}: {
  settings: VoiceSettings;
  onSettingsChange: (updates: Partial<VoiceSettings>) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  previewUrl: string | null;
  onApply: () => void;
  script: string;
}) => {
  const [showVoiceLibrary, setShowVoiceLibrary] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowVoiceLibrary(false);
      }
    };

    if (showVoiceLibrary) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showVoiceLibrary]);

  const voices: Voice[] = [
    { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', description: 'Deep, authoritative voice', gender: 'male', age: 'middle', style: 'narrative' },
    { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', description: 'Clear, professional', gender: 'female', age: 'young', style: 'professional' },
    { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam', description: 'Energetic, youthful', gender: 'male', age: 'young', style: 'energetic' },
    { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', description: 'Strong, confident', gender: 'female', age: 'middle', style: 'confident' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', description: 'Soft, warm', gender: 'female', age: 'young', style: 'warm' },
    { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', description: 'Rich, storytelling', gender: 'male', age: 'middle', style: 'storytelling' },
    { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', description: 'Cheerful, bright', gender: 'female', age: 'young', style: 'cheerful' },
    { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', description: 'Casual, friendly', gender: 'male', age: 'young', style: 'casual' },
  ];

  const selectedVoice = voices.find(v => v.id === settings.voiceId) || voices[0];

  return (
    <div className="flex flex-col h-full bg-[#141414]">
      {/* Header */}
      <div className="p-6 border-b border-[#1f1f1f] bg-[#141414]">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Mic className="w-5 h-5 text-purple-500" />
          Voice Studio
        </h2>
        <p className="text-xs text-gray-500 mt-1">AI Neural Text-to-Speech</p>
      </div>

      <div className="p-6 space-y-8 flex-1 overflow-y-auto no-scrollbar">
        
        {/* Selected Voice Card */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Current Voice</label>
          <button
            onClick={() => setShowVoiceLibrary(true)}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 hover:border-purple-500/50 hover:bg-[#202020] transition group flex items-center gap-4 text-left shadow-lg relative overflow-hidden"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center border border-purple-500/30 group-hover:scale-105 transition z-10">
               {selectedVoice.gender === 'male' ? <User className="w-6 h-6 text-purple-400" /> : <UserCircle className="w-6 h-6 text-purple-400" />}
            </div>
            <div className="flex-1 z-10">
              <div className="text-base font-bold text-white flex items-center gap-2">
                {selectedVoice.name}
                <span className="text-[9px] px-1.5 py-0.5 bg-white/5 border border-white/10 text-gray-400 rounded-full uppercase tracking-wide font-normal">
                  {selectedVoice.style}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{selectedVoice.description}</div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-purple-400 transition z-10" />
            
            {/* Hover Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/0 to-purple-500/5 opacity-0 group-hover:opacity-100 transition duration-500" />
          </button>
        </div>

        {/* Voice Library Modal */}
        {showVoiceLibrary && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div ref={modalRef} className="bg-[#141414] border border-[#2a2a2a] rounded-3xl w-full max-w-3xl h-[85vh] flex flex-col shadow-2xl shadow-purple-900/20 scale-100 animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-[#2a2a2a] flex justify-between items-center bg-[#141414] rounded-t-3xl">
                <div>
                  <h3 className="text-xl font-bold text-white">Voice Library</h3>
                  <p className="text-xs text-gray-500 mt-1">Select a character for your video</p>
                </div>
                <button onClick={() => setShowVoiceLibrary(false)} className="p-2 hover:bg-[#252525] rounded-full transition text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-3 no-scrollbar bg-[#0E0E0E]">
                {voices.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => {
                      onSettingsChange({ voiceId: voice.id });
                      setShowVoiceLibrary(false);
                    }}
                    className={`p-4 rounded-xl border-2 transition text-left group relative ${
                      settings.voiceId === voice.id
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-gray-600 hover:bg-[#202020]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition ${
                        settings.voiceId === voice.id ? 'bg-purple-500/20' : 'bg-[#252525] group-hover:bg-[#303030]'
                      }`}>
                        {voice.gender === 'male' ? (
                          <User className={`w-5 h-5 ${settings.voiceId === voice.id ? 'text-purple-400' : 'text-gray-500'}`} />
                        ) : (
                          <UserCircle className={`w-5 h-5 ${settings.voiceId === voice.id ? 'text-purple-400' : 'text-gray-500'}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white text-sm mb-0.5">{voice.name}</div>
                        <div className="text-xs text-gray-500 mb-2 truncate">{voice.description}</div>
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[9px] px-1.5 py-0.5 bg-white/5 border border-white/10 text-gray-400 rounded uppercase tracking-wide">
                            {voice.gender}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-white/5 border border-white/10 text-gray-400 rounded uppercase tracking-wide">
                            {voice.style}
                          </span>
                        </div>
                      </div>
                      
                      {/* Selection Indicator */}
                      {settings.voiceId === voice.id && (
                        <div className="absolute top-4 right-4">
                          <div className="w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings Grid */}
        <div className="grid grid-cols-2 gap-4">
            {/* Speed Control */}
            <div className="space-y-3 bg-[#1a1a1a] p-4 rounded-xl border border-[#2a2a2a] hover:border-gray-700 transition">
                <label className="text-[10px] font-bold text-gray-500 uppercase flex justify-between items-center">
                  <span className="flex items-center gap-1.5"><Gauge className="w-3 h-3" /> Speed</span>
                  <span className="text-purple-400 font-mono bg-purple-500/10 px-1.5 rounded">{settings.speed.toFixed(2)}x</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.05"
                  value={settings.speed}
                  onChange={(e) => onSettingsChange({ speed: parseFloat(e.target.value) })}
                  className="w-full accent-purple-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
            </div>

            {/* Pitch Control */}
            <div className="space-y-3 bg-[#1a1a1a] p-4 rounded-xl border border-[#2a2a2a] hover:border-gray-700 transition">
                <label className="text-[10px] font-bold text-gray-500 uppercase flex justify-between items-center">
                  <span className="flex items-center gap-1.5"><Volume2 className="w-3 h-3" /> Pitch</span>
                  <span className="text-purple-400 font-mono bg-purple-500/10 px-1.5 rounded">{settings.pitch.toFixed(2)}x</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.05"
                  value={settings.pitch}
                  onChange={(e) => onSettingsChange({ pitch: parseFloat(e.target.value) })}
                  className="w-full accent-purple-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
            </div>
        </div>

        {/* Stability Slider (Full Width) */}
        <div className="space-y-3 bg-[#1a1a1a] p-4 rounded-xl border border-[#2a2a2a] hover:border-gray-700 transition">
            <label className="text-[10px] font-bold text-gray-500 uppercase flex justify-between items-center">
              <span className="flex items-center gap-1.5"><Activity className="w-3 h-3" /> Stability</span>
              <span className="text-purple-400 font-mono bg-purple-500/10 px-1.5 rounded">{Math.round(settings.stability * 100)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.stability}
              onChange={(e) => onSettingsChange({ stability: parseFloat(e.target.value) })}
              className="w-full accent-purple-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-gray-600 font-medium">
              <span>More Variable</span>
              <span>More Consistent</span>
            </div>
        </div>

        {/* Generate Action */}
        <div className="pt-2">
            <button
                onClick={onGenerate}
                disabled={isGenerating || !script}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition shadow-lg shadow-purple-900/20 group relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                {isGenerating ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                </>
                ) : (
                <>
                    <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Generate Voiceover
                </>
                )}
            </button>
            {!script && (
              <p className="text-center text-[10px] text-red-400 mt-2">Generate or write a script first.</p>
            )}
        </div>

        {/* Preview Player */}
        {previewUrl && (
            <div className="p-4 bg-gradient-to-r from-[#1a1a1a] to-[#202020] rounded-xl border border-purple-500/30 animate-in slide-in-from-bottom-2 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-purple-400 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Ready to Apply
                    </span>
                    <button
                        onClick={onApply}
                        className="px-4 py-1.5 bg-white text-black hover:bg-gray-200 text-xs font-bold rounded-lg transition flex items-center gap-2"
                    >
                        <Play className="w-3 h-3 fill-black" />
                        Apply to Timeline
                    </button>
                </div>
                <audio controls src={previewUrl} className="w-full h-8 rounded opacity-80 hover:opacity-100 transition" />
            </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedVoicePanel;