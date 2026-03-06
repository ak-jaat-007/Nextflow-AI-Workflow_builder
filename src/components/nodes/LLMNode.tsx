import React, { memo } from "react";
import { Handle, Position } from "reactflow";
import { BrainCircuit } from "lucide-react";

export default memo(() => {
  return (
    <div
      className="
        relative
        bg-[#0f111a]
        border border-[#2e303d]
        rounded-2xl
        pl-12 pr-6 py-6
        min-w-[300px]
        text-white
        shadow-[0_0_25px_rgba(0,0,0,0.6)]
      "
    >
      {/* Header */}
      <div className="flex items-center border-b border-[#2e303d] pb-4 mb-6">
        <div className="p-2 bg-purple-500/10 rounded-lg mr-3">
          <BrainCircuit size={20} className="text-purple-500" />
        </div>
        <span className="text-xs font-bold tracking-[0.2em] text-white uppercase">
          Gemini 2.5 Flash
        </span>
      </div>

      <div className="flex flex-col gap-8">
        {/* System Prompt */}
        <div className="relative flex items-center group">
          <Handle
            type="target"
            position={Position.Left}
            id="system"
            className="
              !w-4 !h-4         /* 🔥 Increased size to match text nodes */
              !bg-slate-500
              !border-2 !border-[#0f111a]
              !-left-[54px]      /* 🔥 Adjusted for larger dot size */
              !transform-none
              shadow-[0_0_8px_rgba(100,116,139,0.5)]
              hover:!scale-110 transition-transform
            "
          />
          <span className="text-slate-400 tracking-wide text-sm">
            System Prompt
          </span>
        </div>

        {/* User Message */}
        <div className="relative flex items-center group">
          <Handle
            type="target"
            position={Position.Left}
            id="user"
            className="
              !w-4 !h-4         /* 🔥 Increased size to match text nodes */
              !bg-blue-500
              !border-2 !border-[#0f111a]
              !-left-[54px]      /* 🔥 Adjusted for larger dot size */
              !transform-none
              shadow-[0_0_12px_rgba(59,130,246,0.6)]
              hover:!scale-110 transition-transform
            "
          />
          <span className="text-blue-400 font-semibold tracking-wide text-sm">
            User Message
          </span>
        </div>

        {/* Images */}
        <div className="relative flex items-center group">
          <Handle
            type="target"
            position={Position.Left}
            id="image"
            className="
              !w-4 !h-4         /* 🔥 Increased size to match text nodes */
              !bg-green-500
              !border-2 !border-[#0f111a]
              !-left-[54px]      /* 🔥 Adjusted for larger dot size */
              !transform-none
              shadow-[0_0_12px_rgba(34,197,94,0.6)]
              hover:!scale-110 transition-transform
            "
          />
          <span className="text-green-400 tracking-wide text-sm">
            Images (Optional)
          </span>
        </div>
      </div>

      {/* Output Source Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="
          !w-4 !h-4         /* 🔥 Same consistent size */
          !bg-purple-500
          !border-2 !border-[#0f111a]
          !-right-2          /* Perfectly centered on the right edge */
          shadow-[0_0_15px_rgba(168,85,247,0.7)]
          hover:!scale-110 transition-transform
        "
      />
    </div>
  );
});