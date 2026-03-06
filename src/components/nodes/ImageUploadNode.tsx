"use client";

import React, { memo, useState, useEffect, useRef } from "react";
import { Handle, Position } from "reactflow";
import { Image as ImageIcon, UploadCloud } from "lucide-react";

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

  /* -------------------------------
     Create Uppy Instance
  -------------------------------- */
  useEffect(() => {

    const uppy = new Uppy({
      id,
      autoProceed: true,
      restrictions: {
        maxNumberOfFiles: 1,
        allowedFileTypes: ["image/*"],
      },
    });

    uppy.use(XHRUpload, {
      endpoint: "/api/upload",
      fieldName: "file",
      formData: true,
     
    });

uppy.on("complete", (result: any) => {

  console.log("FULL RESULT:", result);

  const file = result.successful?.[0];

  const url = file?.response?.body?.url;

  console.log("UPLOAD URL:", url);

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

  }, [id, updateNodeData]);


  /* -------------------------------
     Mount Dashboard when open
  -------------------------------- */
  useEffect(() => {

    const uppy = uppyRef.current;

    if (!uppy || !open || !dashboardRef.current) return;

    if (!uppy.getPlugin("Dashboard")) {

      uppy.use(Dashboard, {
        target: dashboardRef.current,
        inline: true,
        height: 450,
        proudlyDisplayPoweredByUppy: false,
      });

    }

  }, [open]);


  /* -------------------------------
     Cleanup when modal closes
  -------------------------------- */
  useEffect(() => {

    const uppy = uppyRef.current;

    if (!uppy) return;

    if (!open) {

      const dashboard = uppy.getPlugin("Dashboard");

      if (dashboard) {
        uppy.removePlugin(dashboard);
      }

      uppy.cancelAll();
      uppy.clear();
    }

  }, [open]);


  return (
    <div className="px-4 py-3 shadow-2xl rounded-xl bg-[#0f111a] border border-green-500/30 text-white min-w-[200px]">

      <div className="flex items-center pb-2 border-b border-slate-800 mb-3">
        <ImageIcon className="w-4 h-4 mr-2 text-green-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Image Upload
        </span>
      </div>

      <div
        onClick={() => setOpen(true)}
        className="cursor-pointer border-2 border-dashed border-slate-800 rounded-lg p-4 flex flex-col items-center hover:border-green-500/50 transition-all bg-slate-950 min-h-[100px] justify-center"
      >

        {data?.value ? (
          <img
            src={data.value}
            alt="Preview"
            className="w-full h-24 object-contain rounded"
          />
        ) : (
          <>
            <UploadCloud className="w-6 h-6 text-slate-600 mb-2" />
            <span className="text-[10px] text-slate-500 text-center">
              Click to Upload Image
            </span>
          </>
        )}

      </div>

      {open && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md">

          <div className="relative w-full max-w-2xl bg-[#1c1c1c] rounded-2xl shadow-2xl border border-white/10 p-4">

            <button
              onClick={() => setOpen(false)}
              className="absolute -top-10 right-0 text-white hover:text-red-500 text-3xl"
            >
              ×
            </button>

            <div ref={dashboardRef} />

          </div>

        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        id="image"
        className="!w-3 !h-3 !bg-green-500 border-none"
      />

    </div>
  );
});