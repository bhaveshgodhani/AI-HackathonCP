import { useEffect, useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api, { audioUrlFromFilePath } from "../api.js";
import AudioPlayer from "../components/AudioPlayer.jsx";
import SentimentBadge from "../components/SentimentBadge.jsx";
import TalkTimeChart from "../components/TalkTimeChart.jsx";
import KeywordTags from "../components/KeywordTags.jsx";

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function overallTone(score) {
  if (score == null || Number.isNaN(Number(score))) return "text-slate-400";
  const s = Number(score);
  if (s >= 7) return "text-emerald-400";
  if (s >= 4) return "text-amber-400";
  return "text-rose-400";
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse space-y-6 px-4 py-10">
      <div className="h-8 w-48 rounded bg-slate-800" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-32 rounded-xl bg-slate-800/80" />
        <div className="h-32 rounded-xl bg-slate-800/80" />
        <div className="h-32 rounded-xl bg-slate-800/80" />
      </div>
      <div className="h-40 rounded-xl bg-slate-800/60" />
    </div>
  );
}

export default function CallDetail() {
  const { id } = useParams();
  const [call, setCall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get(`/api/calls/${id}`);
        if (!cancelled) setCall(data);
      } catch {
        if (!cancelled) setError("Could not load call.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const performanceData = useMemo(() => {
    if (!call) return [];
    return [
      {
        name: "Communication clarity",
        score: Number(call.communication_clarity_score) || 0,
      },
      { name: "Politeness", score: Number(call.politeness_score) || 0 },
      {
        name: "Business knowledge",
        score: Number(call.business_knowledge_score) || 0,
      },
      {
        name: "Problem handling",
        score: Number(call.problem_handling_score) || 0,
      },
      {
        name: "Listening",
        score: Number(call.listening_ability_score) || 0,
      },
    ];
  }, [call]);

  const audioSrc = call ? audioUrlFromFilePath(call.file_path) : "";
  const questionnaire = call?.questionnaire_coverage || {};
  const qEntries = Object.entries(questionnaire);

  if (loading) return <DetailSkeleton />;
  if (error || !call) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-rose-400">{error || "Not found"}</p>
        <Link to="/" className="mt-4 inline-block text-indigo-400 hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        to="/"
        className="inline-flex items-center text-sm font-medium text-indigo-400 hover:text-indigo-300"
      >
        ← Back
      </Link>

      <header className="mt-6 flex flex-col gap-2 border-b border-slate-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{call.filename}</h1>
          <p className="mt-1 text-sm text-slate-400">{formatDate(call.created_at)}</p>
        </div>
        <span className="text-sm text-slate-500">Call #{call.id}</span>
      </header>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-5 md:col-span-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Call summary
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-200">
            {call.summary || (call.status !== "complete" ? "Processing…" : "—")}
          </p>
        </div>
        <div className="flex flex-col justify-center gap-4 rounded-xl border border-slate-700/60 bg-slate-900/50 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Sentiment
            </p>
            <div className="mt-2">
              <SentimentBadge sentiment={call.sentiment} size="lg" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Overall score
            </p>
            <p
              className={`mt-1 text-4xl font-bold tabular-nums ${overallTone(
                call.overall_score
              )}`}
            >
              {call.overall_score != null
                ? `${Number(call.overall_score).toFixed(1)}`
                : "—"}
              <span className="text-2xl text-slate-500">/10</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <AudioPlayer src={audioSrc} />
      </div>

      <div className="mt-6 rounded-xl border border-slate-700/60 bg-slate-900/50 p-5">
        <h2 className="text-sm font-semibold text-white">Transcript</h2>
        {call.transcript?.trim() ? (
          <div className="mt-4 max-h-[min(28rem,55vh)] overflow-y-auto rounded-lg border border-slate-800/80 bg-slate-950/40 p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
              {call.transcript.trim()}
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            {call.status !== "complete"
              ? "Transcript will appear here after processing."
              : "No transcript available for this call."}
          </p>
        )}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-5">
          <h2 className="text-sm font-semibold text-white">Talk time analysis</h2>
          <TalkTimeChart
            agentPercent={call.agent_talk_time_percent}
            customerPercent={call.customer_talk_time_percent}
          />
        </div>
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-5">
          <h2 className="mb-4 text-sm font-semibold text-white">
            Agent performance scores
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={performanceData}
                margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  domain={[0, 10]}
                  stroke="#64748b"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={132}
                  stroke="#64748b"
                  tick={{ fill: "#cbd5e1", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Bar
                  dataKey="score"
                  fill="#6366f1"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-5">
          <h2 className="text-sm font-semibold text-white">
            Business questionnaire coverage
          </h2>
          {qEntries.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No data yet.</p>
          ) : (
            <table className="mt-4 w-full text-sm">
              <tbody className="divide-y divide-slate-800">
                {qEntries.map(([q, ok]) => (
                  <tr key={q}>
                    <td className="py-2 pr-4 text-slate-300">{q}</td>
                    <td className="py-2 text-right text-lg">
                      {ok ? "✅" : "❌"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-5">
          <h2 className="text-sm font-semibold text-white">Top keywords</h2>
          <div className="mt-4">
            <KeywordTags keywords={call.keywords || []} />
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-5">
          <h2 className="text-sm font-semibold text-white">
            Follow-up action items
          </h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-200">
            {(call.action_items || []).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
            {(!call.action_items || call.action_items.length === 0) && (
              <li className="list-none pl-0 text-slate-500">None listed.</li>
            )}
          </ol>
        </div>
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-5">
          <h2 className="text-sm font-semibold text-white">Observations</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-emerald-400/90">
                Positive
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-emerald-100/90">
                {(call.positive_observations || []).map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
                {(!call.positive_observations ||
                  call.positive_observations.length === 0) && (
                  <li className="list-none text-slate-500">—</li>
                )}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-rose-400/90">
                Negative
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-rose-100/90">
                {(call.negative_observations || []).map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
                {(!call.negative_observations ||
                  call.negative_observations.length === 0) && (
                  <li className="list-none text-slate-500">—</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
