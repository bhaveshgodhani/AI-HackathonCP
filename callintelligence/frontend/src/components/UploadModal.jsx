import { useRef, useState, useEffect } from "react";
import api from "../api.js";

function statusMessage(status) {
  switch (status) {
    case "uploaded":
      return "Uploading...";
    case "transcribing":
      return "Transcribing...";
    case "analyzing":
      return "Analyzing...";
    case "complete":
      return "Complete!";
    case "error":
      return "Something went wrong.";
    default:
      return "Working...";
  }
}

export default function UploadModal({ open, onClose, onComplete }) {
  const inputRef = useRef(null);
  const [phase, setPhase] = useState("");
  const [callId, setCallId] = useState(null);
  const [error, setError] = useState("");
  const pollRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setPhase("");
      setCallId(null);
      setError("");
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
  }, [open]);

  const startPoll = (id) => {
    if (pollRef.current) clearInterval(pollRef.current);
    const tick = async () => {
      try {
        const { data } = await api.get(`/api/calls/${id}`);
        setPhase(statusMessage(data.status));
        if (data.status === "complete") {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          onComplete?.();
          setTimeout(onClose, 600);
        } else if (data.status === "error") {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          setError("Processing failed. Check API keys and try again.");
        }
      } catch {
        setError("Lost connection while polling.");
      }
    };
    void tick();
    pollRef.current = setInterval(tick, 3000);
  };

  if (!open) return null;

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setPhase("Uploading...");
    try {
      const form = new FormData();
      form.append("file", file);
      const { data: up } = await api.post("/api/calls/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCallId(up.id);
      setPhase("Transcribing...");
      await api.post(`/api/analyze/${up.id}`);
      startPoll(up.id);
    } catch (err) {
      setPhase("");
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Upload or analysis failed to start."
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">Upload New Call</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-400">
          MP3, WAV, M4A, or OGG up to your server limits. We transcribe with
          Whisper and analyze with OpenAI.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".mp3,.wav,.m4a,.ogg,audio/*"
          className="hidden"
          onChange={onPickFile}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={!!phase && phase !== "Complete!" && !error}
          className="mt-6 w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          Choose audio file
        </button>
        {phase && (
          <div className="mt-4 flex items-center gap-2 text-sm text-indigo-200">
            {(phase === "Transcribing..." ||
              phase === "Analyzing..." ||
              phase === "Uploading...") && (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
            )}
            {phase === "Complete!" && <span className="text-emerald-400">✓</span>}
            <span>{phase}</span>
            {callId && (
              <span className="text-slate-500">· Call #{callId}</span>
            )}
          </div>
        )}
        {error && (
          <p className="mt-3 text-sm text-rose-400" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
