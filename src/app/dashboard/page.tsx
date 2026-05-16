"use client";
import { useEffect, useState } from "react";
import { listSubmissions } from "@/lib/api";
import type { SubmissionListItem } from "@/types";
import Link from "next/link";
import {
  FileText, Clock, AlertTriangle,
  ArrowRight, Upload, CheckCircle2, XCircle, Search,
} from "lucide-react";

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

// ── LOB Badge ─────────────────────────────────────────────────────────────────

function LobBadge({ lob }: { lob: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    gl: { label: "GL", cls: "bg-violet-100 text-violet-700" },
    general_liability: { label: "GL", cls: "bg-violet-100 text-violet-700" },
    cyber: { label: "Cyber", cls: "bg-blue-100 text-blue-700" },
    property: { label: "Property", cls: "bg-amber-100 text-amber-700" },
    "d&o": { label: "D&O", cls: "bg-pink-100 text-pink-700" },
    do: { label: "D&O", cls: "bg-pink-100 text-pink-700" },
    workers_comp: { label: "WC", cls: "bg-teal-100 text-teal-700" },
    bop: { label: "BOP", cls: "bg-indigo-100 text-indigo-700" },
    multi_line: { label: "Multi", cls: "bg-gray-100 text-gray-700" },
    other: { label: "Other", cls: "bg-gray-100 text-gray-600" },
  };
  const key = lob.toLowerCase().replace(/ /g, "_");
  const cfg = map[key] || { label: lob.replace(/_/g, " ").toUpperCase(), cls: "bg-gray-100 text-gray-600" };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${cfg.cls}`}>
      {cfg.label}
    </span>
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

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: any; color: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [submissions, setSubmissions] = useState<SubmissionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    listSubmissions(20)
      .then(d => setSubmissions(d.submissions))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const completed = submissions.filter(s => s.status === "complete");
  const avgTime = completed.length > 0
    ? completed.reduce((a, b) => a + b.processing_time, 0) / completed.length
    : 0;

  const filtered = submissions.filter(s =>
    !search || s.insured_name?.toLowerCase().includes(search.toLowerCase())
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const day = new Date().toLocaleDateString("en-US", { weekday: "long" });

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pb-16">

      {/* ── Greeting ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting} 👋</h1>
          <p className="text-sm text-gray-400 mt-0.5">Happy {day}</p>
        </div>
        <Link href="/dashboard/upload"
          className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-700 transition-colors">
          <Upload className="w-4 h-4" /> New Submission
        </Link>
      </div>

      {/* ── Stats — no winnability ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Submissions" value={submissions.length} icon={FileText} color="text-violet-500" />
        <StatCard label="Avg Processing" value={`${avgTime.toFixed(0)}s`} icon={Clock} color="text-amber-500" />
        <StatCard label="Referrals" value={submissions.filter(s => s.referral_required).length} icon={AlertTriangle} color="text-orange-500" />
      </div>

      {/* ── Submissions Table ── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">All Submissions</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for a case..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 w-48"
              />
            </div>
            <Link href="/dashboard/upload"
              className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
              + Add Case
            </Link>
          </div>
        </div>

        {/* Column headers — Company, LOB, Risk Appetite, Recommended Action, Date Added */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-2 border-b border-gray-50 bg-gray-50/60">
          {["Company", "Line of Business", "Risk Appetite", "Recommended Action", "Date Added"].map(h => (
            <span key={h} className="text-xs text-gray-400 font-medium uppercase tracking-wider">{h}</span>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400 animate-pulse">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm mb-4">
              {search ? "No submissions match your search" : "No submissions yet"}
            </p>
            {!search && (
              <Link href="/dashboard/upload" className="text-sm text-gray-900 font-medium underline underline-offset-2">
                Upload your first submission
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(sub => (
              <Link key={sub.id} href={`/dashboard/submissions/${sub.id}`}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 items-center px-6 py-4 hover:bg-gray-50/80 transition-colors group">

                {/* Company */}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate group-hover:text-gray-700">
                    {sub.insured_name || "Unknown Company"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                    {sub.status === "complete"
                      ? <CheckCircle2 className="w-3 h-3 text-green-500" />
                      : sub.status === "error"
                      ? <XCircle className="w-3 h-3 text-red-400" />
                      : <Clock className="w-3 h-3 text-gray-300 animate-pulse" />
                    }
                    {new Date(sub.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {" · "}{sub.processing_time?.toFixed(0)}s
                  </p>
                </div>

                {/* LOB */}
                <div><LobBadge lob={sub.lob} /></div>

                {/* Risk Appetite ring */}
                <div><ScoreRing score={sub.appetite_score} /></div>

                {/* Recommended Action */}
                <div><ActionPill status={sub.appetite_status} queue={sub.queue} /></div>

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