import { useEffect, useRef, useState, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";

function formatTime(sec) {
  if (sec == null || Number.isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioPlayer({ src }) {
  const containerRef = useRef(null);
  const wavesurferRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!src || !containerRef.current) return undefined;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#4f46e5",
      progressColor: "#a855f7",
      cursorColor: "#c4b5fd",
      barWidth: 2,
      barGap: 1,
      height: 96,
      normalize: true,
      url: src,
    });
    wavesurferRef.current = ws;

    ws.on("ready", () => {
      setReady(true);
      setDuration(ws.getDuration());
    });
    ws.on("timeupdate", (t) => setCurrent(t));
    ws.on("finish", () => setPlaying(false));
    ws.on("play", () => setPlaying(true));
    ws.on("pause", () => setPlaying(false));

    return () => {
      ws.destroy();
      wavesurferRef.current = null;
      setReady(false);
    };
  }, [src]);

  const toggle = useCallback(() => {
    const ws = wavesurferRef.current;
    if (!ws) return;
    void ws.playPause();
  }, []);

  if (!src) {
    return (
      <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-8 text-center text-slate-500">
        No audio available for this call.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
      <div ref={containerRef} className="w-full overflow-hidden rounded-lg" />
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          disabled={!ready}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {playing ? "Pause" : "Play"}
        </button>
        <span className="font-mono text-sm text-slate-400">
          {formatTime(current)} / {formatTime(duration)}
        </span>
        {!ready && (
          <span className="text-sm text-slate-500">Loading waveform…</span>
        )}
      </div>
    </div>
  );
}
