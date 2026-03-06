"use client";

import React, { useEffect, useState } from "react";
import { Clock, ChevronDown, ChevronRight } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

export default function HistorySidebar() {
  const { isSignedIn, isLoaded } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [openRun, setOpenRun] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nodeDetails, setNodeDetails] = useState<Record<string, any[]>>({});
  const [loadingNodes, setLoadingNodes] = useState<Record<string, boolean>>({});

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/history");
      const data = await res.json();

      if (Array.isArray(data)) {
        setHistory(data);
      } else if (Array.isArray(data?.runs)) {
        setHistory(data.runs);
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchNodeDetails = async (runId: string) => {
    if (nodeDetails[runId]) return; // already fetched

    setLoadingNodes((prev) => ({ ...prev, [runId]: true }));
    try {
      const res = await fetch(`/api/runs/${runId}/nodes`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setNodeDetails((prev) => ({ ...prev, [runId]: data }));
      } else {
        setNodeDetails((prev) => ({ ...prev, [runId]: [] }));
      }
    } catch (error) {
      console.error(`Failed to fetch node details for run ${runId}:`, error);
      setNodeDetails((prev) => ({ ...prev, [runId]: [] }));
    } finally {
      setLoadingNodes((prev) => ({ ...prev, [runId]: false }));
    }
  };

  // ✅ Only fetch when Clerk is loaded and user is signed in
  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setLoading(false);
      return;
    }

    fetchHistory();
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, [isLoaded, isSignedIn]);

  const toggleRun = (runId: string) => {
    if (openRun === runId) {
      setOpenRun(null);
    } else {
      setOpenRun(runId);
      fetchNodeDetails(runId);
    }
  };

  return (
    <div className="w-80 bg-[#090a0f] border-l border-[#1d1e26] p-4 flex flex-col h-screen overflow-y-auto">
      <h2 className="text-white font-bold mb-6 flex items-center gap-2">
        <Clock className="w-4 h-4 text-purple-400" />
        Execution History
      </h2>

      {/* ✅ Show sign-in prompt if not authenticated */}
      {isLoaded && !isSignedIn && (
        <p className="text-slate-500 text-xs text-center mt-10">
          Sign in to view history
        </p>
      )}

      {isLoaded && isSignedIn && loading && (
        <p className="text-slate-500 text-xs text-center">Loading history...</p>
      )}

      <div className="space-y-4">
        {isLoaded && isSignedIn && !loading && history.length === 0 && (
          <p className="text-slate-600 text-xs text-center mt-10">No recent runs</p>
        )}

        {history.map((run: any) => {
          const output =
            typeof run.outputData === "object" ? run.outputData : null;
          const outputText = output?.text || null;
          const outputImage = output?.image || null;
          const hasNodeDetails = nodeDetails[run.id];
          const isLoadingNodes = loadingNodes[run.id];

          return (
            <div key={run.id} className="p-3 rounded-lg bg-[#161821] border border-[#2e303d]">
              {/* Status + Time */}
              <div className="flex justify-between items-start mb-2">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    run.status === "COMPLETED"
                      ? "bg-green-500/10 text-green-500"
                      : run.status === "FAILED"
                      ? "bg-red-500/10 text-red-500"
                      : "bg-yellow-500/10 text-yellow-500"
                  }`}
                >
                  {run.status}
                </span>
                <span className="text-[10px] text-slate-500">
                  {new Date(run.createdAt).toLocaleTimeString()}
                </span>
              </div>

              {/* Run ID */}
              <p className="text-xs text-slate-300 truncate mb-2">Run ID: {run.id}</p>

              {/* View Output (if any) */}
              {run.status === "COMPLETED" && (outputText || outputImage) && (
                <>
                  <button
                    onClick={() => setOpenRun(openRun === run.id ? null : run.id)}
                    className="text-[11px] text-blue-400 hover:underline"
                  >
                    {openRun === run.id ? "Hide Output" : "View Output"}
                  </button>

                  {openRun === run.id && (
                    <div className="mt-2 p-3 bg-slate-800 rounded text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {outputText && <p className="mb-2">{outputText}</p>}
                      {outputImage && (
                        <img
                          src={outputImage}
                          alt="output"
                          className="rounded border border-slate-700"
                        />
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Node-level details toggle */}
              <button
                onClick={() => toggleRun(run.id)}
                className="text-[11px] text-purple-400 hover:underline flex items-center gap-1 mt-2"
              >
                {openRun === run.id ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
                {openRun === run.id ? "Hide Node Details" : "View Node Details"}
              </button>

              {/* Node details list */}
              {openRun === run.id && (
                <div className="mt-3 space-y-3">
                  {isLoadingNodes && (
                    <p className="text-[10px] text-slate-500">Loading node details...</p>
                  )}
                  {!isLoadingNodes && (!hasNodeDetails || hasNodeDetails.length === 0) && (
                    <p className="text-[10px] text-slate-500 italic">
                      No node‑level details available for this run.
                    </p>
                  )}
                  {hasNodeDetails &&
                    hasNodeDetails.map((nodeRun: any) => (
                      <div key={nodeRun.id} className="bg-slate-900 rounded p-2 border border-slate-700">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-300">
                            {nodeRun.nodeType || "Unknown"}
                          </span>
                          <span
                            className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                              nodeRun.status === "COMPLETED"
                                ? "bg-green-500/20 text-green-400"
                                : nodeRun.status === "FAILED"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-yellow-500/20 text-yellow-400"
                            }`}
                          >
                            {nodeRun.status || "UNKNOWN"}
                          </span>
                        </div>
                        {nodeRun.duration ? (
                          <p className="text-[9px] text-slate-500 mt-1">
                            Duration: {nodeRun.duration}ms
                          </p>
                        ) : null}
                        {nodeRun.input && Object.keys(nodeRun.input).length > 0 && (
                          <div className="mt-1">
                            <p className="text-[8px] text-slate-500 uppercase">Inputs:</p>
                            <pre className="text-[9px] text-slate-300 bg-slate-950 p-1 rounded overflow-x-auto">
                              {JSON.stringify(nodeRun.input, null, 2)}
                            </pre>
                          </div>
                        )}
                        {nodeRun.output && Object.keys(nodeRun.output).length > 0 && (
                          <div className="mt-1">
                            <p className="text-[8px] text-slate-500 uppercase">Output:</p>
                            <pre className="text-[9px] text-slate-300 bg-slate-950 p-1 rounded overflow-x-auto">
                              {JSON.stringify(nodeRun.output, null, 2)}
                            </pre>
                          </div>
                        )}
                        {nodeRun.error && (
                          <p className="text-[9px] text-red-400 mt-1">Error: {nodeRun.error}</p>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}