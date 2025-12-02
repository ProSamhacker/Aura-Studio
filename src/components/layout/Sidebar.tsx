import { Upload, FileText, Mic, Captions, Bot, Settings } from 'lucide-react';

interface SidebarProps {
  activeTool: string;
  setActiveTool: (tool: string) => void;
}

export const Sidebar = ({ activeTool, setActiveTool }: SidebarProps) => {
  const tools = [
    { id: 'upload', icon: Upload, label: 'Media' },
    { id: 'script', icon: FileText, label: 'Script' },
    { id: 'voice', icon: Mic, label: 'Voice' },
    { id: 'captions', icon: Captions, label: 'Captions' },

  ];

  return (
    <div className="w-[72px] bg-[#0F0F0F] border-r border-[#1f1f1f] flex flex-col items-center py-4 gap-2 z-30 h-screen shrink-0">
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => setActiveTool(tool.id)}
          className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all duration-200 group ${
            activeTool === tool.id 
              ? 'bg-[#252525] text-white' 
              : 'text-gray-500 hover:bg-[#1a1a1a] hover:text-gray-300'
          }`}
        >
          <tool.icon className={`w-6 h-6 mb-1 ${activeTool === tool.id ? 'text-purple-500' : 'group-hover:text-purple-400'}`} />
          <span className="text-[10px] font-medium">{tool.label}</span>
        </button>
      ))}
      <div className="mt-auto pb-4">
        <button className="w-16 h-16 flex flex-col items-center justify-center text-gray-500 hover:text-gray-300">
            <Settings className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};