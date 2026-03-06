"use client";

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Crop } from 'lucide-react';
import { useWorkflowStore } from '@/store/useWorkflowStore';

export default memo(({ id, data }: any) => {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);

  return (
    <div className="px-4 py-3 shadow-2xl rounded-xl bg-[#0f111a] border border-orange-500/40 text-white min-w-[200px] transition-all hover:border-orange-500/60">
      {/* Header */}
      <div className="flex items-center pb-2 border-b border-slate-800/50 mb-3">
        <div className="p-1 bg-orange-500/10 rounded mr-2">
          <Crop className="w-3.5 h-3.5 text-orange-400" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-200">FFmpeg Crop</span>
      </div>

      {/* Input Fields */}
      <div className="space-y-3 pb-1">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Width</label>
            <input 
              type="number" 
              placeholder="500"
              className="w-full bg-slate-950 border border-slate-800 rounded-md p-1.5 text-[10px] outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all"
              value={data?.width || ''}
              onChange={(e) => updateNodeData(id, { width: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Height</label>
            <input 
              type="number" 
              placeholder="500"
              className="w-full bg-slate-950 border border-slate-800 rounded-md p-1.5 text-[10px] outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all"
              value={data?.height || ''}
              onChange={(e) => updateNodeData(id, { height: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>
        <p className="text-[8px] text-slate-600 italic leading-tight">Dimensions will be processed via FFmpeg background task.</p>
      </div>

      {/* Handles */}
      <Handle 
        type="target" 
        
        position={Position.Left} 
        id="image"
        className="!w-2.5 !h-2.5 !bg-orange-500 !border-2 !border-[#0f111a] hover:!scale-125 transition-transform" 
      />
      <Handle 
        type="source" 
        
        position={Position.Right} 
        id="image"
        className="!w-2.5 !h-2.5 !bg-orange-500 !border-2 !border-[#0f111a] hover:!scale-125 transition-transform" 
      />
    </div>
  );
});