"use client";
import { useEffect, useState } from "react";
import { listSubmissions } from "@/lib/api";
import type { SubmissionListItem } from "@/types";
import Link from "next/link";
import { FileText, ArrowRight, Search } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = { accept: "badge-accept", review: "badge-review", decline: "badge-decline", refer: "badge-refer" };
  return <span className={cls[status] || "badge bg-ink-800 text-ink-400"}>{status}</span>;
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { listSubmissions(50).then((d) => setSubmissions(d.submissions)).catch(console.error).finally(() => setLoading(false)); }, []);

  const filtered = submissions.filter((s) =>
    s.insured_name.toLowerCase().includes(search.toLowerCase()) ||
    s.lob.toLowerCase().includes(search.toLowerCase()) ||
    s.queue.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display text-black">Submissions</h1>
        <div className="relative"><Search className="w-4 h-4 text-ink-500 absolute left-3 top-1/2 -translate-y-1/2" /><input type="text" placeholder="Search company, LOB, queue..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9 w-72 text-sm" /></div>
      </div>
      <div className="card overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_80px_80px_80px_120px_40px] gap-4 px-5 py-3 border-b border-ink-800/50 text-xs text-ink-500 uppercase tracking-wider">
          <div>Company</div><div>LOB</div><div>Appetite</div><div>Win %</div><div>Priority</div><div>Queue</div><div></div>
        </div>
        {loading ? <div className="p-8 text-center text-ink-500 text-sm animate-subtle-pulse">Loading...</div>
        : filtered.length === 0 ? <div className="p-12 text-center"><FileText className="w-8 h-8 text-ink-700 mx-auto mb-3" /><p className="text-ink-400 text-sm">{search ? "No matching submissions" : "No submissions yet"}</p></div>
        : <div className="divide-y divide-ink-800/30">{filtered.map((sub) => (
            <Link key={sub.id} href={`/dashboard/submissions/${sub.id}`} className="grid grid-cols-[1fr_120px_80px_80px_80px_120px_40px] gap-4 px-5 py-4 items-center hover:bg-ink-800/20 transition-colors">
              <div><div className="text-sm text-black font-medium truncate">{sub.insured_name || "Unknown"}</div><div className="text-xs text-ink-500 mt-0.5">{new Date(sub.created_at).toLocaleDateString()} · {sub.processing_time.toFixed(0)}s</div></div>
              <div className="text-xs text-ink-400">{sub.lob.replace(/_/g, " ")}</div>
              <StatusBadge status={sub.appetite_status} />
              <div className="text-sm text-black font-mono">{Math.round(sub.winnability * 100)}%</div>
              <div className="text-sm text-black font-mono">{Math.round(sub.priority * 100)}%</div>
              <div className="text-xs text-ink-400 truncate">{sub.queue}</div>
              <ArrowRight className="w-4 h-4 text-ink-600" />
            </Link>
          ))}</div>}
      </div>
    </div>
  );
}
