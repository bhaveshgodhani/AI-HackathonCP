function scoreTone(score) {
  if (score == null || Number.isNaN(Number(score))) {
    return "text-slate-400";
  }
  const s = Number(score);
  if (s >= 7) return "text-emerald-400";
  if (s >= 4) return "text-amber-400";
  return "text-rose-400";
}

export default function ScoreCard({ label, value, suffix = "" }) {
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${scoreTone(value)}`}>
        {value != null ? `${value}${suffix}` : "—"}
      </p>
    </div>
  );
}
