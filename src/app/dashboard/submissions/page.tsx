"use client";
import { useEffect, useState } from "react";
import { listSubmissions } from "@/lib/api";
import type { SubmissionListItem } from "@/types";
import Link from "next/link";
import { FileText, ArrowRight, Search, CheckCircle2, XCircle, Clock } from "lucide-react";

// ── Score Ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const pct = (score / 5) * 100;
  const r = 18;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;
  const color = score >= 4 ? "#16a34a" : score === 3 ? "#d97706" : "#dc2626";
  return (
    <div className="relative flex items-center justify-center w-11 h-11 shrink-0">
      <svg width="44" height="44" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#e5e7eb" strokeWidth="3.5" />
        <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="3.5"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          transform="rotate(-90 22 22)"
        />
      </svg>
      <span className="absolute text-xs font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

// ── Action Pill ───────────────────────────────────────────────────────────────

function ActionPill({ status, queue }: { status: string; queue: string }) {
  let label = "Review";
  let cls = "text-gray-600 bg-gray-100 border border-gray-200";

  if (status === "decline" || queue === "decline-review") {
    label = "Decline";
    cls = "text-red-700 bg-red-50 border border-red-200";
  } else if (queue === "referral-senior-uw") {
    label = "Refer to Senior Underwriter";
    cls = "text-orange-700 bg-orange-50 border border-orange-200";
  } else if (queue === "large-account") {
    label = "Follow up with broker";
    cls = "text-blue-700 bg-blue-50 border border-blue-200";
  } else if (status === "accept") {
    label = "Quote";
    cls = "text-green-700 bg-green-50 border border-green-200";
  } else if (status === "refer") {
    label = "Refer to Senior Underwriter";
    cls = "text-orange-700 bg-orange-50 border border-orange-200";
  }

  return (
    <span className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${cls}`}>
      {label}
    </span>
  );
}

// ── LOB Badge — handles single LOB and comma-separated multi-line ─────────────

function LobBadge({ lob }: { lob: string }) {
  // Multi-line: comma-separated e.g. "Property, General Liability, Umbrella"
  if (lob.includes(",")) {
    const parts = lob.split(",").map(s => s.trim()).filter(Boolean);
    const visible = parts.slice(0, 2);
    const remaining = parts.length - visible.length;
    return (
      <div className="flex flex-wrap gap-1">
        {visible.map((p, i) => (
          <span key={i} className="text-xs font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
            {p}
          </span>
        ))}
        {remaining > 0 && (
          <span className="text-xs text-gray-400 self-center">+{remaining}</span>
        )}
      </div>
    );
  }

  // Single LOB — color-coded badge
  const map: Record<string, { label: string; cls: string }> = {
    gl: { label: "GL", cls: "bg-violet-100 text-violet-700" },
    general_liability: { label: "GL", cls: "bg-violet-100 text-violet-700" },
    cyber: { label: "Cyber", cls: "bg-blue-100 text-blue-700" },
    property: { label: "Property", cls: "bg-amber-100 text-amber-700" },
    commercial_property: { label: "Property", cls: "bg-amber-100 text-amber-700" },
    "d&o": { label: "D&O", cls: "bg-pink-100 text-pink-700" },
    do: { label: "D&O", cls: "bg-pink-100 text-pink-700" },
    workers_comp: { label: "WC", cls: "bg-teal-100 text-teal-700" },
    bop: { label: "BOP", cls: "bg-indigo-100 text-indigo-700" },
    umbrella: { label: "Umbrella", cls: "bg-purple-100 text-purple-700" },
    multi_line: { label: "Multi", cls: "bg-gray-100 text-gray-700" },
    other: { label: "Other", cls: "bg-gray-100 text-gray-600" },
  };
  const key = lob.toLowerCase().replace(/ /g, "_");
  const cfg = map[key] || { label: lob, cls: "bg-gray-100 text-gray-600" };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    listSubmissions(50)
      .then((d) => setSubmissions(d.submissions))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = submissions.filter((s) =>
    s.insured_name.toLowerCase().includes(search.toLowerCase()) ||
    s.lob.toLowerCase().includes(search.toLowerCase()) ||
    s.queue.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display text-black">Submissions</h1>
        <div className="relative">
          <Search className="w-4 h-4 text-ink-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search company, LOB, queue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 w-72 text-sm"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

        {/* Column headers */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-4 px-6 py-3 border-b border-gray-100 bg-gray-50/60">
          {["Company", "Line of Business", "Risk Appetite", "Recommended Action", "Date Added", ""].map(h => (
            <span key={h} className="text-xs text-gray-400 font-medium uppercase tracking-wider">{h}</span>
          ))}
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400 animate-pulse">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              {search ? "No matching submissions" : "No submissions yet"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((sub) => (
              <Link
                key={sub.id}
                href={`/dashboard/submissions/${sub.id}`}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-4 px-6 py-4 items-center hover:bg-gray-50/80 transition-colors group"
              >
                {/* Company — name + status only, no date */}
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate group-hover:text-gray-700">
                    {sub.insured_name || "Unknown"}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                    {sub.status === "complete"
                      ? <CheckCircle2 className="w-3 h-3 text-green-500" />
                      : sub.status === "error"
                      ? <XCircle className="w-3 h-3 text-red-400" />
                      : <Clock className="w-3 h-3 text-gray-300 animate-pulse" />
                    }
                    {sub.status}
                  </div>
                </div>

                {/* LOB */}
                <div><LobBadge lob={sub.lob} /></div>

                {/* Risk Appetite ring */}
                <div><ScoreRing score={sub.appetite_score} /></div>

                {/* Recommended Action */}
                <div><ActionPill status={sub.appetite_status} queue={sub.queue} /></div>

                {/* Date Added — own column */}
                <div className="text-xs text-gray-500">
                  {new Date(sub.created_at).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                  <span className="block text-gray-300 mt-0.5">
                    {sub.processing_time?.toFixed(0)}s
                  </span>
                </div>

                {/* Arrow */}
                <div className="flex justify-end">
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}