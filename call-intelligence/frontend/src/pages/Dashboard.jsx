import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api.js";
import UploadModal from "../components/UploadModal.jsx";
import SentimentBadge from "../components/SentimentBadge.jsx";
import ScoreCard from "../components/ScoreCard.jsx";

function scoreBadgeClass(score) {
  if (score == null || Number.isNaN(Number(score)))
    return "bg-slate-700/40 text-slate-300 ring-slate-500/30";
  const s = Number(score);
  if (s >= 7) return "bg-emerald-500/15 text-emerald-300 ring-emerald-500/40";
  if (s >= 4) return "bg-amber-500/15 text-amber-200 ring-amber-500/40";
  return "bg-rose-500/15 text-rose-300 ring-rose-500/40";
}

function formatDuration(sec) {
  if (sec == null) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function StatSkeleton() {
  return (
    <div className="h-28 animate-pulse rounded-xl bg-slate-800/60 ring-1 ring-slate-700/50" />
  );
}

/** Normalize for grouping; each topic counts at most once per call. */
function aggregateTopKeywords(calls, limit = 12) {
  const countByNorm = new Map();
  const labelByNorm = new Map();
  for (const c of calls) {
    const kws = Array.isArray(c.keywords) ? c.keywords : [];
    const seenThisCall = new Set();
    for (const raw of kws) {
      const str = typeof raw === "string" ? raw : String(raw ?? "");
      const norm = str.trim().toLowerCase();
      if (!norm) continue;
      if (seenThisCall.has(norm)) continue;
      seenThisCall.add(norm);
      countByNorm.set(norm, (countByNorm.get(norm) || 0) + 1);
      if (!labelByNorm.has(norm)) {
        labelByNorm.set(norm, str.trim() || norm);
      }
    }
  }
  return [...countByNorm.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([norm, count]) => ({
      key: norm,
      label: labelByNorm.get(norm) || norm,
      count,
    }));
}

export default function Dashboard() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/calls");
      setCalls(data);
    } catch {
      setCalls([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const completed = calls.filter((c) => c.status === "complete");
  const totalProcessed = completed.length;
  const sentimentCounts = { Positive: 0, Neutral: 0, Negative: 0 };
  completed.forEach((c) => {
    const k = c.sentiment || "Neutral";
    if (sentimentCounts[k] != null) sentimentCounts[k] += 1;
    else sentimentCounts.Neutral += 1;
  });
  const avgScore =
    totalProcessed > 0
      ? completed.reduce((a, c) => a + (Number(c.overall_score) || 0), 0) /
        totalProcessed
      : null;
  const avgDurationSec =
    totalProcessed > 0
      ? completed.reduce((a, c) => a + (Number(c.duration_seconds) || 0), 0) /
        totalProcessed
      : null;
  const totalActions = completed.reduce(
    (a, c) => a + (Array.isArray(c.action_items) ? c.action_items.length : 0),
    0
  );

  const topKeywords = useMemo(
    () =>
      aggregateTopKeywords(calls.filter((c) => c.status === "complete")),
    [calls]
  );

  const onDelete = async (id) => {
    if (!window.confirm("Delete this call and its audio file?")) return;
    try {
      await api.delete(`/api/calls/${id}`);
      load();
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Call Intelligence
          </h1>
          <p className="mt-1 text-slate-400">
            Upload recordings, get Whisper transcripts and Claude-powered
            coaching insights.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 hover:bg-indigo-500"
        >
          Upload New Call
        </button>
      </header>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {loading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <ScoreCard label="Total Calls Processed" value={totalProcessed} />
            <div className="flex min-h-0 flex-col rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
              <p className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-500">
                Sentiment Split
              </p>
              <ul className="mt-3 flex flex-col gap-2.5" role="list">
                {[
                  {
                    key: "Positive",
                    sentiment: "Positive",
                    count: sentimentCounts.Positive,
                    bullet: "bg-emerald-400",
                    countClass: "text-emerald-400",
                  },
                  {
                    key: "Neutral",
                    sentiment: "Neutral",
                    count: sentimentCounts.Neutral,
                    bullet: "bg-slate-400",
                    countClass: "text-slate-300",
                  },
                  {
                    key: "Negative",
                    sentiment: "Negative",
                    count: sentimentCounts.Negative,
                    bullet: "bg-rose-400",
                    countClass: "text-rose-400",
                  },
                ].map(({ key, sentiment, count, bullet, countClass }) => (
                  <li
                    key={key}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${bullet}`}
                        aria-hidden
                      />
                      <SentimentBadge sentiment={sentiment} />
                    </span>
                    <span
                      className={`shrink-0 text-base font-bold tabular-nums ${countClass}`}
                    >
                      {count}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <ScoreCard
              label="Average Call Score"
              value={avgScore != null ? avgScore.toFixed(1) : null}
              suffix="/10"
            />
            <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Avg Duration
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-indigo-300">
                {avgDurationSec != null
          ? `${(avgDurationSec / 60).toFixed(1)} min`
          : "—"}
              </p>
            </div>
            <ScoreCard label="Total Action Items" value={totalActions} />
            <div className="flex min-h-0 flex-col rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
              <p className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-500">
                Top Keywords
              </p>
              {topKeywords.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  No topics yet — complete call analysis to see themes here.
                </p>
              ) : (
                <div
                  className="dashboard-keywords-scroll mt-3 max-h-44 overflow-y-auto overscroll-y-contain pr-2 sm:max-h-52"
                  role="region"
                  aria-label="Top keywords list"
                >
                  <ul className="flex flex-col gap-2 pb-0.5">
                    {topKeywords.map(({ key, label, count }) => (
                      <li
                        key={key}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
                        <span className="min-w-0 truncate rounded-full border border-slate-600/60 bg-slate-800/40 px-2.5 py-0.5 font-medium text-slate-300">
                          {label}
                        </span>
                        <span className="shrink-0 tabular-nums font-bold text-sky-300/90">
                          {count}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-white">All calls</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/40">
          {loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-lg bg-slate-800/70"
                />
              ))}
            </div>
          ) : calls.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-lg font-medium text-slate-300">
                No calls yet
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Upload a sales recording to see transcripts, scores, and
                follow-ups here.
              </p>
              <button
                type="button"
                onClick={() => setUploadOpen(true)}
                className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Upload your first call
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
                <thead className="bg-slate-900/80 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">File</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Duration</th>
                    <th className="px-4 py-3 font-medium">Score</th>
                    <th className="px-4 py-3 font-medium">Sentiment</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {calls.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-800/30"
                    >
                      <td className="max-w-[200px] truncate px-4 py-3 font-medium text-slate-200">
                        {c.filename}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                        {formatDate(c.created_at)}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {formatDuration(c.duration_seconds)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${scoreBadgeClass(
                  c.overall_score
                )}`}
                        >
                          {c.overall_score != null
                            ? `${Number(c.overall_score).toFixed(1)}/10`
                            : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <SentimentBadge sentiment={c.sentiment} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2 text-slate-300">
                          {c.status !== "complete" && c.status !== "error" && (
                            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                          )}
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/calls/${c.id}`}
                          className="mr-2 text-indigo-400 hover:text-indigo-300"
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          onClick={() => onDelete(c.id)}
                          className="text-rose-400 hover:text-rose-300"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onComplete={load}
      />
    </div>
  );
}
