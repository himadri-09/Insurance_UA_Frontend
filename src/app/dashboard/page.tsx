"use client";
import { useEffect, useState } from "react";
import { listSubmissions } from "@/lib/api";
import type { SubmissionListItem } from "@/types";
import Link from "next/link";
import { FileText, TrendingUp, Clock, AlertTriangle, ArrowRight, Upload } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = { accept: "badge-accept", review: "badge-review", decline: "badge-decline", refer: "badge-refer" };
  return <span className={cls[status] || "badge bg-ink-800 text-ink-400"}>{status}</span>;
}

export default function DashboardPage() {
  const [submissions, setSubmissions] = useState<SubmissionListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { listSubmissions(10).then((d) => setSubmissions(d.submissions)).catch(console.error).finally(() => setLoading(false)); }, []);

  const completed = submissions.filter((s) => s.status === "complete");
  const avgTime = completed.length > 0 ? completed.reduce((a, b) => a + b.processing_time, 0) / completed.length : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-display text-black font-bold">Dashboard</h1><p className="text-sm text-gray-600 mt-1">Commercial insurance submission triage</p></div>
        <Link href="/dashboard/upload" className="btn-primary flex items-center gap-2"><Upload className="w-4 h-4" />New Submission</Link>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Submissions", value: submissions.length, icon: FileText, color: "text-accent" },
          { label: "Avg Processing", value: `${avgTime.toFixed(0)}s`, icon: Clock, color: "text-accent-warm" },
          { label: "Avg Winnability", value: completed.length > 0 ? `${Math.round((completed.reduce((a, b) => a + b.winnability, 0) / completed.length) * 100)}%` : "—", icon: TrendingUp, color: "text-accent-green" },
          { label: "Referrals", value: submissions.filter((s) => s.referral_required).length, icon: AlertTriangle, color: "text-accent-purple" },
        ].map((stat) => (
          <div key={stat.label} className="card p-5"><div className="flex items-center gap-3 mb-3"><stat.icon className={`w-4 h-4 ${stat.color}`} /><span className="text-xs text-black uppercase tracking-wider">{stat.label}</span></div><div className="text-2xl font-display text-black font-bold">{stat.value}</div></div>
        ))}
      </div>
      <div className="card">
        <div className="px-5 py-4 border-b border-ink-800/50 flex items-center justify-between"><h2 className="text-sm font-medium text-black">Recent Submissions</h2><Link href="/dashboard/submissions" className="text-xs text-accent hover:text-accent/80 flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link></div>
        {loading ? <div className="p-8 text-center text-ink-500 text-sm animate-subtle-pulse">Loading...</div>
        : submissions.length === 0 ? <div className="p-12 text-center"><FileText className="w-8 h-8 text-ink-700 mx-auto mb-3" /><p className="text-ink-400 text-sm mb-4">No submissions yet</p><Link href="/dashboard/upload" className="btn-primary text-sm">Upload your first submission</Link></div>
        : <div className="divide-y divide-ink-800/40">{submissions.map((sub) => (
            <Link key={sub.id} href={`/dashboard/submissions/${sub.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-ink-800/30 transition-colors">
              <div className="flex-1 min-w-0"><div className="text-sm text-black font-medium truncate">{sub.insured_name || "Unknown Company"}</div><div className="text-xs text-gray-600 mt-0.5">{sub.lob} · {new Date(sub.created_at).toLocaleDateString()}</div></div>
              <StatusBadge status={sub.appetite_status} />
              <div className="text-sm text-gray-700 font-mono w-16 text-right">{Math.round(sub.winnability * 100)}%</div>
              <div className="text-xs text-gray-600 w-16 text-right">{sub.processing_time.toFixed(0)}s</div>
              <ArrowRight className="w-4 h-4 text-ink-600" />
            </Link>
          ))}</div>}
      </div>
    </div>
  );
}
