"use client";
import { useState } from 'react';
import { useWorkflowStore } from '@/store/useWorkflowStore';
import { Type, Image, Video, BrainCircuit, Crop, Film, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const addNode = useWorkflowStore((state) => state.addNode);

  const tools = [
    { type: 'textInput', label: 'Text Node', icon: Type, color: 'text-blue-400' },
    { type: 'imageUpload', label: 'Upload Image', icon: Image, color: 'text-green-400' },
    { type: 'videoUpload', label: 'Upload Video', icon: Video, color: 'text-red-400' },
    { type: 'geminiLLM', label: 'LLM Node', icon: BrainCircuit, color: 'text-purple-400' },
    { type: 'cropImage', label: 'Crop Image', icon: Crop, color: 'text-orange-400' },
    { type: 'extractFrame', label: 'Extract Frame', icon: Film, color: 'text-pink-400' },
  ];

  return (
    <aside
      className={`bg-[#090a0f] border-r border-[#1d1e26] p-4 flex flex-col h-screen overflow-y-auto shadow-2xl transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Header with toggle button */}
      <div className="flex items-center justify-between mb-8">
        {!collapsed && (
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white italic">NEXTFLOW</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Workflow Builder v1.0</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-[#161821] text-slate-400 hover:text-white transition-colors ml-auto"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Quick Access */}
      <div className="space-y-1">
        {!collapsed && (
          <p className="text-[10px] font-bold text-slate-500 mb-4 px-2 tracking-widest uppercase">
            Quick Access
          </p>
        )}
        {tools.map((tool) => (
          <button
            key={tool.type}
            onClick={() => addNode(tool.type, { x: 150, y: 150 })}
            className="flex items-center w-full gap-4 px-4 py-3 rounded-xl hover:bg-[#161821] group transition-all border border-transparent hover:border-[#2e303d] justify-center md:justify-start"
            title={collapsed ? tool.label : undefined}
          >
            <tool.icon className={`w-5 h-5 ${tool.color} group-hover:scale-110 transition-transform`} />
            {!collapsed && (
              <span className="text-sm font-semibold text-slate-300 group-hover:text-white">
                {tool.label}
              </span>
            )}
          </button>
        ))}
      </div>
    </aside>
  );
}