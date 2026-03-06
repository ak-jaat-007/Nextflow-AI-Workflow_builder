import React, { memo } from "react";
import { Handle, Position } from "reactflow";
import { Scissors } from "lucide-react";

export default memo(() => {
  return (
    <div className="relative bg-[#0f111a] border border-[#2e303d] rounded-2xl p-5 min-w-[260px] text-white shadow-2xl">
      
      {/* Header */}
      <div className="flex items-center border-b border-[#2e303d] pb-3 mb-5">
        <div className="p-1.5 bg-orange-500/10 rounded-lg mr-2">
          <Scissors size={18} className="text-orange-500" />
        </div>
        <span className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
          Extract Frame (FFmpeg)
        </span>
      </div>

      {/* Video Input */}
      <div className="relative flex items-center mb-4 group">
        <Handle
          type="target"
          position={Position.Left}
          id="video"
          className="!w-4 !h-4 !bg-pink-500 !border-2 !border-[#0f111a] !-left-[46px] !transform-none shadow-[0_0_10px_rgba(236,72,153,0.5)]"
        />
        <span className="text-pink-400 font-medium text-sm ml-1">
          Video Source
        </span>
      </div>

      {/* ✅ IMAGE OUTPUT HANDLE */}
      <Handle
        type="source"
        position={Position.Right}
        id="image"   // 🔥 IMPORTANT FIX
        className="!w-4 !h-4 !bg-green-500 !border-2 !border-[#0f111a] !-right-2 shadow-[0_0_15px_rgba(34,197,94,0.6)]"
      />
    </div>
  );
});