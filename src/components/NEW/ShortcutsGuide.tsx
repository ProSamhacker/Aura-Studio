import React, { useState, useEffect } from 'react';
import { X, Keyboard, Zap } from 'lucide-react';

const ShortcutsGuide = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Toggle with ? key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const shortcuts = [
    {
      category: 'Playback',
      items: [
        { key: 'Space', action: 'Play / Pause' },
        { key: '←', action: 'Jump back 1 second' },
        { key: '→', action: 'Jump forward 1 second' },
        { key: 'Home', action: 'Go to start' },
        { key: 'End', action: 'Go to end' },
      ]
    },
    {
      category: 'Editing',
      items: [
        { key: 'S', action: 'Split clip at playhead' },
        { key: 'Ctrl + C', action: 'Copy selected clip' },
        { key: 'Ctrl + V', action: 'Paste clip' },
        { key: 'Ctrl + X', action: 'Cut clip' },
        { key: 'Delete', action: 'Delete selected clip' },
      ]
    },
    {
      category: 'Timeline',
      items: [
        { key: 'Ctrl + Scroll', action: 'Zoom in/out' },
        { key: 'Shift + Scroll', action: 'Fast scroll' },
        { key: 'Click', action: 'Seek to position' },
        { key: 'Right Click', action: 'Show context menu' },
      ]
    },
    {
      category: 'Project',
      items: [
        { key: 'Ctrl + S', action: 'Save project' },
        { key: '?', action: 'Show/hide shortcuts' },
      ]
    }
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-purple-600 hover:bg-purple-500 text-white rounded-full shadow-2xl flex items-center justify-center z-50 transition-all hover:scale-110 group"
        title="Keyboard Shortcuts (?)"
      >
        <Keyboard className="w-5 h-5 group-hover:rotate-12 transition-transform" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[200] animate-in fade-in duration-200 p-4">
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border-2 border-purple-500/30 rounded-2xl max-w-2xl w-full shadow-2xl shadow-purple-900/20 max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-purple-500/20 flex items-center justify-between bg-gradient-to-r from-purple-900/20 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Keyboard Shortcuts</h2>
              <p className="text-sm text-gray-400 mt-0.5">Master your workflow</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                {section.category}
              </h3>
              
              <div className="grid gap-2">
                {section.items.map((item) => (
                  <div 
                    key={item.key}
                    className="flex items-center justify-between p-3 bg-[#1a1a1a]/50 hover:bg-[#252525] rounded-lg border border-white/5 hover:border-purple-500/30 transition group"
                  >
                    <span className="text-sm text-gray-300 group-hover:text-white transition">
                      {item.action}
                    </span>
                    <kbd className="px-3 py-1.5 bg-[#0a0a0a] border-2 border-white/20 rounded-lg text-xs font-mono font-bold text-white shadow-lg min-w-[60px] text-center group-hover:border-purple-500/50 group-hover:shadow-purple-500/20 transition">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-purple-500/20 bg-gradient-to-r from-transparent to-purple-900/10">
          <p className="text-xs text-center text-gray-500">
            Press <kbd className="px-2 py-0.5 bg-white/10 rounded text-white font-mono">?</kbd> anytime to toggle this guide • 
            Press <kbd className="px-2 py-0.5 bg-white/10 rounded text-white font-mono ml-1">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsGuide;