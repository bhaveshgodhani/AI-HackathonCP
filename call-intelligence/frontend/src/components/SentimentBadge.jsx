const styles = {
  Positive: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/40",
  Neutral: "bg-slate-500/15 text-slate-300 ring-slate-500/40",
  Negative: "bg-rose-500/15 text-rose-300 ring-rose-500/40",
};

export default function SentimentBadge({ sentiment, size = "sm" }) {
  const label = sentiment || "Neutral";
  const cls = styles[label] || styles.Neutral;
  const pad =
    size === "lg"
      ? "px-5 py-2 text-lg font-semibold"
      : "px-2.5 py-1 text-xs font-medium";
  return (
    <span
      className={`inline-flex items-center rounded-full ring-1 ring-inset ${pad} ${cls}`}
    >
      {label}
    </span>
  );
}
