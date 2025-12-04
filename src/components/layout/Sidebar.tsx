import { Upload, FileText, Mic, Captions, Bot, Settings, Layers } from 'lucide-react';

interface SidebarProps {
  activeTool: string;
  setActiveTool: (tool: string) => void;
}

export const Sidebar = ({ activeTool, setActiveTool }: SidebarProps) => {
  const tools = [
    { id: 'upload', icon: Layers, label: 'Media' },
    { id: 'script', icon: FileText, label: 'Script' },
    { id: 'voice', icon: Mic, label: 'Voice' },
    { id: 'captions', icon: Captions, label: 'Captions' },
  ];

  return (
    <div className="w-[72px] bg-[#0F0F0F] border-r border-[#1f1f1f] flex flex-col items-center py-6 gap-3 z-30 h-screen shrink-0">
      {/* Brand Icon (Small) */}
      <div className="mb-4 text-purple-500">
        <Bot className="w-8 h-8" />
      </div>

      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => setActiveTool(tool.id)}
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-200 group relative ${
            activeTool === tool.id 
              ? 'bg-[#1f1f1f] text-white' 
              : 'text-gray-500 hover:bg-[#1a1a1a] hover:text-gray-300'
          }`}
        >
          <tool.icon className={`w-5 h-5 mb-1 ${activeTool === tool.id ? 'text-purple-500' : 'group-hover:text-purple-400 transition-colors'}`} />
          <span className="text-[9px] font-medium tracking-wide">{tool.label}</span>
          
          {/* Active indicator bar */}
          {activeTool === tool.id && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-500 rounded-r-full" />
          )}
        </button>
      ))}
      
      <div className="mt-auto pb-4">
        <button className="w-14 h-14 flex flex-col items-center justify-center text-gray-600 hover:text-white transition">
            <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};