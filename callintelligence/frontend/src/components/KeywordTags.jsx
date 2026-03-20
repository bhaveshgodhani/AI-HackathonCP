const colors = [
  "bg-indigo-500/20 text-indigo-200 ring-indigo-400/30",
  "bg-purple-500/20 text-purple-200 ring-purple-400/30",
  "bg-violet-500/20 text-violet-200 ring-violet-400/30",
  "bg-fuchsia-500/20 text-fuchsia-200 ring-fuchsia-400/30",
  "bg-sky-500/20 text-sky-200 ring-sky-400/30",
];

export default function KeywordTags({ keywords = [] }) {
  if (!keywords.length) {
    return <p className="text-sm text-slate-500">No keywords extracted.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {keywords.map((k, i) => (
        <span
          key={`${k}-${i}`}
          className={`rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset ${colors[i % colors.length]}`}
        >
          {k}
        </span>
      ))}
    </div>
  );
}
