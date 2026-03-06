"use client";

import React, { memo, useState, useEffect, useRef } from "react";
import { Handle, Position } from "reactflow";
import { Video } from "lucide-react";

import Uppy from "@uppy/core";
import Dashboard from "@uppy/dashboard";
import XHRUpload from "@uppy/xhr-upload";

import "@uppy/core/css/style.css";
import "@uppy/dashboard/css/style.css";

import { useWorkflowStore } from "@/store/useWorkflowStore";

export default memo(({ id, data }: any) => {

  const [open, setOpen] = useState(false);
  const dashboardRef = useRef<HTMLDivElement | null>(null);

  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);

  const uppyRef = useRef<Uppy | null>(null);

  useEffect(() => {

    const uppy = new Uppy({
      id,
      autoProceed: true,
      restrictions: {
        maxNumberOfFiles: 1,
        allowedFileTypes: ["video/*"],
      },
    });

    uppy.use(XHRUpload, {
      endpoint: "/api/upload",
      fieldName: "file",
      formData: true,
    });

    uppy.on("complete", (result: any) => {

      const url = result?.successful?.[0]?.response?.body?.url;

      if (url) {
        updateNodeData(id, { value: url });
        uppy.clear();
        setOpen(false);
      }

    });

    uppyRef.current = uppy;

    return () => {
      uppy.destroy();
    };

  }, [id]);



  useEffect(() => {

    const uppy = uppyRef.current;

    if (!uppy || !open || !dashboardRef.current) return;

    if (!uppy.getPlugin("Dashboard")) {

      uppy.use(Dashboard, {
        target: dashboardRef.current,
        inline: true,
        height: 450,
      });

    }

  }, [open]);



  return (
    <div className="px-4 py-3 shadow-2xl rounded-xl bg-[#0f111a] border border-pink-500/30 text-white min-w-[200px]">

      <div className="flex items-center pb-2 border-b border-slate-800 mb-3">
        <Video className="w-4 h-4 mr-2 text-pink-400" />
        <span className="text-xs font-bold uppercase text-slate-400">
          Video Upload
        </span>
      </div>

      <div
        onClick={() => setOpen(true)}
        className="cursor-pointer border-2 border-dashed border-slate-800 rounded-lg p-4 text-center"
      >

        {data?.value ? (
          <video
            src={data.value}
            controls
            className="w-full rounded"
          />
        ) : (
          <span className="text-slate-500 text-sm">
            Click to Upload Video
          </span>
        )}

      </div>

      {open && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80">

          <div className="w-full max-w-2xl bg-[#1c1c1c] rounded-xl p-4">

            <button
              onClick={() => setOpen(false)}
              className="text-white text-xl"
            >
              ✕
            </button>

            <div ref={dashboardRef} />

          </div>

        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        id="video"
        className="!bg-pink-500 !w-3 !h-3"
      />

    </div>
  );
});