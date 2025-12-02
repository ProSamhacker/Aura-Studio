import React, { useState } from 'react';
import { 
  Type, Palette, AlignLeft, AlignCenter, AlignRight,
  ChevronDown, Layout, Move, Sliders, Minus, Plus,
  ArrowUpToLine, ArrowDownToLine, ScanLine
} from 'lucide-react';

interface CaptionStyle {
  color: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  textAlign: 'left' | 'center' | 'right';
  backgroundColor: string;
  position: 'top' | 'center' | 'bottom';
  opacity: number;
}

const CaptionStyleEditor = ({ 
  style, 
  onChange 
}: { 
  style: CaptionStyle, 
  onChange: (updates: Partial<CaptionStyle>) => void 
}) => {
  const fonts = ['Inter', 'Arial', 'Helvetica', 'Georgia', 'Courier New', 'Impact', 'Verdana'];
  const presetColors = [
    '#FFFFFF', '#000000', '#FACC15', '#3B82F6', '#EF4444', 
    '#10B981', '#A855F7', '#F97316'
  ];

  // Helper to handle font size changes
  const adjustFontSize = (delta: number) => {
    const newSize = Math.min(72, Math.max(12, style.fontSize + delta));
    onChange({ fontSize: newSize });
  };

  return (
    <div className="bg-[#141414] p-5 space-y-6 border-b border-[#1f1f1f]">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Palette className="w-4 h-4 text-purple-500" />
          Style Editor
        </h3>
        {/* Reset Button (Conceptual) */}
        <button 
            onClick={() => onChange({ 
                color: '#FFFFFF', fontSize: 32, backgroundColor: 'rgba(0,0,0,0.6)', 
                position: 'bottom', textAlign: 'center', fontWeight: 'bold' 
            })}
            className="text-[10px] text-gray-500 hover:text-white transition"
        >
            Reset Default
        </button>
      </div>

      {/* --- Typography Section --- */}
      <div className="space-y-3">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Typography</label>
        
        {/* Font Family */}
        <div className="relative group">
            <select
                value={style.fontFamily.split(',')[0]}
                onChange={(e) => onChange({ fontFamily: `${e.target.value}, sans-serif` })}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg pl-3 pr-8 py-2.5 text-xs text-white appearance-none focus:border-purple-500 outline-none transition group-hover:border-gray-600"
            >
                {fonts.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
        </div>

        {/* Size & Weight Row */}
        <div className="flex gap-2">
            <div className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg flex items-center justify-between p-1">
                <button onClick={() => adjustFontSize(-2)} className="p-1.5 hover:bg-[#252525] rounded text-gray-400 hover:text-white transition"><Minus className="w-3 h-3" /></button>
                <span className="text-xs font-mono font-medium text-white w-8 text-center">{style.fontSize}</span>
                <button onClick={() => adjustFontSize(2)} className="p-1.5 hover:bg-[#252525] rounded text-gray-400 hover:text-white transition"><Plus className="w-3 h-3" /></button>
            </div>
            
            <button
              onClick={() => onChange({ fontWeight: style.fontWeight === 'bold' ? 'normal' : 'bold' })}
              className={`px-3 rounded-lg text-xs font-bold transition border ${
                style.fontWeight === 'bold'
                  ? 'bg-purple-500/10 border-purple-500 text-purple-400'
                  : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:border-gray-600'
              }`}
            >
              B
            </button>
        </div>

        {/* Alignment */}
        <div className="flex bg-[#1a1a1a] p-1 rounded-lg border border-[#2a2a2a]">
            {(['left', 'center', 'right'] as const).map((align) => (
                <button
                    key={align}
                    onClick={() => onChange({ textAlign: align })}
                    className={`flex-1 py-1.5 flex justify-center rounded-md transition ${
                        style.textAlign === align 
                        ? 'bg-[#2a2a2a] text-white shadow-sm' 
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                >
                    {align === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                    {align === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                    {align === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                </button>
            ))}
        </div>
      </div>

      {/* --- Colors Section --- */}
      <div className="space-y-3">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Colors & Background</label>
        
        <div className="grid grid-cols-2 gap-4">
            {/* Text Color */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-gray-400">Text</span>
                    <div className="w-4 h-4 rounded-full border border-gray-600" style={{ backgroundColor: style.color }}></div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {presetColors.slice(0, 6).map(c => (
                        <button
                            key={c}
                            onClick={() => onChange({ color: c })}
                            className={`w-5 h-5 rounded-full border border-gray-700 hover:scale-110 transition ${style.color === c ? 'ring-2 ring-white ring-offset-1 ring-offset-[#141414]' : ''}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                    <label className="w-5 h-5 rounded-full border border-gray-700 bg-gradient-to-br from-purple-500 to-blue-500 cursor-pointer flex items-center justify-center hover:scale-110 transition">
                        <input type="color" className="hidden" value={style.color} onChange={(e) => onChange({ color: e.target.value })} />
                        <span className="text-[8px] text-white font-bold">+</span>
                    </label>
                </div>
            </div>

            {/* Bg Color */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-gray-400">Background</span>
                    {style.backgroundColor !== 'transparent' && (
                        <div className="w-4 h-4 rounded border border-gray-600" style={{ backgroundColor: style.backgroundColor }}></div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <label className="flex-1 h-8 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg cursor-pointer flex items-center justify-center hover:border-gray-600 transition group relative overflow-hidden">
                        <input 
                            type="color" 
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" 
                            value={style.backgroundColor === 'transparent' ? '#000000' : style.backgroundColor} 
                            onChange={(e) => onChange({ backgroundColor: e.target.value })} 
                        />
                        <div className="w-full h-full flex items-center justify-center gap-2">
                            <div className="w-3 h-3 rounded-full border border-gray-500" style={{ backgroundColor: style.backgroundColor === 'transparent' ? '#000' : style.backgroundColor }}></div>
                            <span className="text-[10px] text-gray-300">Pick</span>
                        </div>
                    </label>
                    <button 
                        onClick={() => onChange({ backgroundColor: 'transparent' })}
                        className={`h-8 px-3 rounded-lg border border-[#2a2a2a] text-[10px] font-medium transition ${
                            style.backgroundColor === 'transparent' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
                        }`}
                        title="Remove Background"
                    >
                        None
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* --- Layout Section --- */}
      <div className="space-y-3">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Layout</label>
        
        {/* Position Toggles */}
        <div className="grid grid-cols-3 gap-2">
            <button
                onClick={() => onChange({ position: 'top' })}
                className={`flex flex-col items-center justify-center py-2 rounded-lg border transition ${
                    style.position === 'top' 
                    ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' 
                    : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-500 hover:border-gray-600 hover:text-gray-300'
                }`}
            >
                <ArrowUpToLine className="w-4 h-4 mb-1" />
                <span className="text-[9px] font-medium">Top</span>
            </button>
            <button
                onClick={() => onChange({ position: 'center' })}
                className={`flex flex-col items-center justify-center py-2 rounded-lg border transition ${
                    style.position === 'center' 
                    ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' 
                    : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-500 hover:border-gray-600 hover:text-gray-300'
                }`}
            >
                <ScanLine className="w-4 h-4 mb-1" />
                <span className="text-[9px] font-medium">Center</span>
            </button>
            <button
                onClick={() => onChange({ position: 'bottom' })}
                className={`flex flex-col items-center justify-center py-2 rounded-lg border transition ${
                    style.position === 'bottom' 
                    ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' 
                    : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-500 hover:border-gray-600 hover:text-gray-300'
                }`}
            >
                <ArrowDownToLine className="w-4 h-4 mb-1" />
                <span className="text-[9px] font-medium">Bottom</span>
            </button>
        </div>

        {/* Opacity Slider */}
        <div className="pt-2">
            <div className="flex justify-between text-[10px] text-gray-500 mb-1.5">
                <span>Opacity</span>
                <span>{Math.round(style.opacity * 100)}%</span>
            </div>
            <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={style.opacity}
                onChange={(e) => onChange({ opacity: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
        </div>
      </div>

      {/* --- Live Preview Box --- */}
      <div className="pt-2">
        <div className="relative w-full aspect-[21/9] bg-black rounded-lg border border-[#2a2a2a] overflow-hidden flex flex-col shadow-inner">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,#111_25%,transparent_25%,transparent_75%,#111_75%,#111),linear-gradient(45deg,#111_25%,transparent_25%,transparent_75%,#111_75%,#111)] bg-[length:20px_20px] bg-[position:0_0,10px_10px] opacity-20"></div>
            
            <div className={`absolute inset-0 p-4 flex ${
                style.position === 'top' ? 'items-start' : 
                style.position === 'center' ? 'items-center' : 
                'items-end'
            } justify-center transition-all duration-300`}>
                <div 
                    className="px-4 py-2 rounded max-w-[80%] transition-all duration-200"
                    style={{
                        backgroundColor: style.backgroundColor,
                        opacity: style.opacity,
                    }}
                >
                    <p style={{
                        color: style.color,
                        fontSize: Math.max(12, style.fontSize / 2.5), // Scaled down for preview
                        fontFamily: style.fontFamily,
                        fontWeight: style.fontWeight,
                        textAlign: style.textAlign,
                        lineHeight: 1.2
                    }}>
                        Preview Text
                    </p>
                </div>
            </div>
        </div>
      </div>

    </div>
  );
};

export default CaptionStyleEditor;