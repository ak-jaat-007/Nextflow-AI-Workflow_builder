import React, { memo } from "react";
import { Handle, Position } from "reactflow";
import { Type } from "lucide-react";
import { useWorkflowStore } from "@/store/useWorkflowStore";

interface TextNodeProps {
  id: string;
  data: {
    value: string;
  };
}

const TextInputNode = ({ id, data }: TextNodeProps) => {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);

  return (
    <div
      className="
        relative
        px-6 py-4
        rounded-2xl
        bg-slate-900/80
        backdrop-blur-md
        border border-slate-700
        shadow-xl
        text-white
        min-w-[280px]
        transition-all duration-200
        hover:scale-[1.02]
        hover:border-blue-500/40
      "
    >
      {/* Header */}
      <div className="flex items-center pb-3 mb-3 border-b border-slate-800">
        <div className="p-2 bg-blue-500/10 rounded-lg mr-3">
          <Type className="w-4 h-4 text-blue-400" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Text Node
        </span>
      </div>

      {/* Textarea */}
      <textarea
        className="
          w-full
          bg-slate-950
          border border-slate-800
          rounded-lg
          p-3
          text-sm
          outline-none
          resize-none
          transition-all duration-200
          focus:border-blue-500
          focus:shadow-[0_0_12px_rgba(59,130,246,0.5)]
        "
        rows={4}
        value={data.value}
        onChange={(evt) =>
          updateNodeData(id, { value: evt.target.value })
        }
        placeholder="Enter text..."
      />

      {/* ========================= */}
      {/* LEFT SIDE INPUT HANDLES */}
      {/* ========================= */}

      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="
          !w-4 !h-4
          !bg-purple-500
          !border-2 !border-slate-900
          shadow-[0_0_10px_rgba(168,85,247,0.6)]
          -left-2
        "
      />

      {/* ========================= */}
      {/* RIGHT SIDE OUTPUT HANDLES */}
      {/* ========================= */}

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="
          !w-4 !h-4
          !bg-blue-500
          !border-2 !border-slate-900
          shadow-[0_0_12px_rgba(59,130,246,0.7)]
          -right-2
        "
      />
    </div>
  );
};

export default memo(TextInputNode);