"use client";

import React, { useRef } from "react";
import ReactFlow, {
  Background,
  MiniMap,
  Panel,
  useReactFlow,
  Connection,
} from "reactflow";
import "reactflow/dist/style.css";

import { Lock, Unlock, Plus, Minus, Maximize, Download, Upload } from "lucide-react";

import LLMNode from "../nodes/LLMNode";
import TextInputNode from "../nodes/TextInputNode";
import ImageUploadNode from "../nodes/ImageUploadNode";
import CropNode from "../nodes/CropNode";
import ExtractFrameNode from "../nodes/ExtractFrameNode";
import VideoUploadNode from "../nodes/VideoUploadNode";
import { useWorkflowStore } from "@/store/useWorkflowStore";

const nodeTypes = {
  geminiLLM: LLMNode,
  textInput: TextInputNode,
  imageUpload: ImageUploadNode,
  videoUpload: VideoUploadNode,
  cropImage: CropNode,
  extractFrame: ExtractFrameNode,
};

/* ================= ICON CONTROLS ================= */

function CanvasControls({
  isLocked,
  setIsLocked,
}: {
  isLocked: boolean;
  setIsLocked: (v: boolean) => void;
}) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const baseBtn =
    "w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 hover:scale-110";

  return (
    <Panel position="top-left">
      <div className="flex flex-col gap-2 bg-slate-900/80 backdrop-blur-md border border-slate-700 p-2 rounded-2xl shadow-2xl">
        <button
          onClick={() => setIsLocked(!isLocked)}
          className={`${baseBtn} ${
            isLocked
              ? "bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          {isLocked ? <Unlock size={16} /> : <Lock size={16} />}
        </button>

        <button
          disabled={isLocked}
          onClick={() => zoomIn()}
          className={`${baseBtn} bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40`}
        >
          <Plus size={16} />
        </button>

        <button
          disabled={isLocked}
          onClick={() => zoomOut()}
          className={`${baseBtn} bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40`}
        >
          <Minus size={16} />
        </button>

        <button
          disabled={isLocked}
          onClick={() => fitView({ padding: 0.2 })}
          className={`${baseBtn} bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40`}
        >
          <Maximize size={16} />
        </button>
      </div>
    </Panel>
  );
}

/* ================= MAIN CANVAS ================= */

export default function FlowCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    isRunning,
    setIsRunning,
    isLocked,
    setIsLocked,
    setNodes,
    setEdges,
  } = useWorkflowStore();

  // ✅ ref for hidden file input
  const importRef = useRef<HTMLInputElement>(null);

  const runWorkflow = async () => {
    if (isRunning) return;
    setIsRunning(true);
    try {
      const response = await fetch("/api/run-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges }),
      });
      const data = await response.json();
      if (!data.success) {
        alert("Execution Failed: " + (data.error || "Unknown error"));
      }
    } catch (error: any) {
      console.error(error);
      alert("Execution Failed: " + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  // ✅ Export workflow as JSON
  const exportWorkflow = () => {
    const json = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workflow.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ✅ Import workflow from JSON
  const importWorkflow = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed.nodes && parsed.edges) {
          setNodes(parsed.nodes);
          setEdges(parsed.edges);
        } else {
          alert("Invalid workflow file");
        }
      } catch {
        alert("Failed to parse workflow file");
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // reset so same file can be re-imported
  };

  // ✅ Inject isRunning into node data for pulsating glow
  const styledNodes = nodes.map((node) => ({
    ...node,
    className: isRunning ? "node-running" : "",
  }));

  return (
    <div
      className={`w-full h-screen bg-gradient-to-br from-[#0f1117] via-[#0b0d13] to-[#0f1117] ${
        isLocked ? "cursor-not-allowed" : ""
      }`}
    >
      {/* ✅ Hidden file input for import */}
      <input
        ref={importRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={importWorkflow}
      />

      <ReactFlow
        key={isLocked ? "locked" : "unlocked"}
        nodes={styledNodes}
        edges={edges}
        onNodesChange={isLocked ? () => {} : onNodesChange}
        onEdgesChange={isLocked ? () => {} : onEdgesChange}
        onConnect={isLocked ? () => {} : onConnect}
        nodeTypes={nodeTypes}
        fitView
        nodesDraggable={!isLocked}
        nodesConnectable={!isLocked}
        elementsSelectable={!isLocked}
        panOnDrag={!isLocked}
        zoomOnScroll={!isLocked}
        zoomOnPinch={!isLocked}
        zoomOnDoubleClick={!isLocked}
        proOptions={{ hideAttribution: true }}
        className="bg-transparent"

        isValidConnection={(connection: Connection) => {
          const sourceNode = nodes.find((n) => n.id === connection.source);
          const targetNode = nodes.find((n) => n.id === connection.target);

          if (!sourceNode || !targetNode) return false;

          if (targetNode.type === "geminiLLM") {
            if (sourceNode.type === "textInput") {
              return connection.targetHandle === "system" || connection.targetHandle === "user";
            }
            if (sourceNode.type === "imageUpload" || sourceNode.type === "cropImage" || sourceNode.type === "extractFrame") {
              return connection.targetHandle === "image";
            }
          }

          if (targetNode.type === "cropImage") {
            return sourceNode.type === "imageUpload" || sourceNode.type === "extractFrame";
          }

          if (targetNode.type === "extractFrame") {
            return sourceNode.type === "videoUpload";
          }

          return false;
        }}
      >
        <Background
          color="#1f2937"
          gap={32}
          size={1}
          variant={"dots" as any}
        />

        <MiniMap
          zoomable={!isLocked}
          pannable={!isLocked}
          className="!bg-slate-900/80 !border !border-slate-700 !rounded-xl"
        />

        <CanvasControls isLocked={isLocked} setIsLocked={setIsLocked} />

        <Panel position="top-right">
          <div className="flex items-center gap-2">
            {/* ✅ Export button */}
            <button
              onClick={exportWorkflow}
              title="Export Workflow"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:scale-110 transition-all duration-200"
            >
              <Download size={16} />
            </button>

            {/* ✅ Import button */}
            <button
              onClick={() => importRef.current?.click()}
              title="Import Workflow"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:scale-110 transition-all duration-200"
            >
              <Upload size={16} />
            </button>

            {/* Existing run button */}
            <button
              disabled={isRunning}
              onClick={runWorkflow}
              className={`px-6 py-2 rounded-xl font-bold transition-all duration-200 ${
                isRunning
                  ? "bg-slate-700 text-slate-400 font-normal"
                  : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:scale-105 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
              }`}
            >
              {isRunning ? "Running..." : "Run Workflow"}
            </button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}