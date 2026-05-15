"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSubmission } from "@/lib/api";
import type { SubmissionOutput } from "@/types";
import { marked } from 'marked';
import { ArrowLeft, FileText, AlertTriangle, CheckCircle2, XCircle, MessageSquare, Building2, TrendingUp, Clock, BookOpen, Loader2 } from "lucide-react";
import Link from "next/link";

function ScoreRing({ value, label, color }: { value: number; label: string; color: string }) {
  const pct = Math.round(value * 100);
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="6" />
        <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="score-ring" transform="rotate(-90 50 50)" />
        <text x="50" y="46" textAnchor="middle" dominantBaseline="central" style={{fontSize: "18px", fontWeight: "bold", fill: "black"}}>{pct}%</text>
        <text x="50" y="64" textAnchor="middle" style={{fontSize: "10px", fill: "#666666", fontWeight: "600"}}>{label}</text>
      </svg>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { cls: string; icon: any }> = {
    accept: { cls: "badge-accept", icon: CheckCircle2 }, review: { cls: "badge-review", icon: Clock },
    decline: { cls: "badge-decline", icon: XCircle }, refer: { cls: "badge-refer", icon: AlertTriangle },
  };
  const c = config[status] || config.review;
  return <span className={`${c.cls} flex items-center gap-1.5 px-3 py-1`}><c.icon className="w-3 h-3" />{status}</span>;
}

export default function SubmissionDetailPage() {
  const params = useParams();
  const [data, setData] = useState<SubmissionOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"brief" | "details" | "evidence">("brief");

  useEffect(() => { if (params.id) getSubmission(params.id as string).then(setData).catch(console.error).finally(() => setLoading(false)); }, [params.id]);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 text-black animate-spin" /></div>;
  if (!data) return <div className="text-center py-16"><p className="text-gray-600">Submission not found</p><Link href="/dashboard/submissions" className="btn-secondary mt-4 inline-block">Back</Link></div>;

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="min-w-0 flex-1">
          <Link href="/dashboard/submissions" className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-2"><ArrowLeft className="w-3 h-3" /> Back</Link>
          <h1 className="text-2xl font-bold text-black">{data.company?.name || "Unknown Company"}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <StatusBadge status={data.appetite_assessment.status} />
            <span className="text-xs text-gray-600">{data.line_of_business.replace(/_/g, " ")}</span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-600">Queue: {data.recommended_queue}</span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-600">{data.processing_time_seconds.toFixed(1)}s</span>
          </div>
        </div>
        {data.referral_required && <div className="badge-refer flex items-center gap-1.5 px-3 py-1.5 whitespace-nowrap"><AlertTriangle className="w-3.5 h-3.5" />Referral Required</div>}
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 overflow-x-auto">
        <div className="card p-5 flex items-center justify-center min-w-max sm:min-w-0">
          <div className="text-center"><div className="text-3xl font-bold text-black mb-1">{data.appetite_assessment.score}/5</div><div className="text-xs text-gray-600 uppercase tracking-wider">Appetite</div></div>
        </div>
        <div className="card p-5 flex items-center justify-center min-w-max sm:min-w-0"><ScoreRing value={data.winnability_score} label="Winnability" color="#000000" /></div>
        <div className="card p-5 flex items-center justify-center min-w-max sm:min-w-0"><ScoreRing value={data.priority_score} label="Priority" color="#666666" /></div>
        <div className="card p-5 min-w-max sm:min-w-0">
          <div className="text-xs text-gray-600 uppercase tracking-wider mb-3">Missing Info</div>
          {data.missing_information.length > 0 ? (
            <div className="space-y-1.5">{data.missing_information.map((m, i) => (
              <div key={i} className="text-xs text-gray-700 flex items-start gap-1.5"><AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />{m.replace(/_/g, " ")}</div>
            ))}</div>
          ) : <div className="text-xs text-gray-700 flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> All key fields found</div>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-300 overflow-x-auto">
        {[
          { key: "brief", label: "Risk Brief", icon: FileText },
          { key: "details", label: "Business Details", icon: Building2 },
          { key: "evidence", label: "Evidence & Citations", icon: BookOpen },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? "border-black text-black font-semibold" : "border-transparent text-gray-600 hover:text-gray-900"}`}>
            <tab.icon className="w-3.5 h-3.5" />{tab.label}
          </button>
        ))}
      </div>

      {/* Brief Tab */}
      {activeTab === "brief" && (
        <div className="flex flex-col gap-6">
          <div className="card p-6 w-full">
            <div
              className="brief-content prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: marked.parse(data.risk_brief_markdown || '*No brief generated*') as string }}
            />
          </div>
          {(data.broker_questions.length > 0 || data.referral_required) && (
            <div className="space-y-4">
              {data.broker_questions.length > 0 && (
                <div className="card p-5">
                  <div className="flex items-center gap-2 mb-3"><MessageSquare className="w-4 h-4" /><h3 className="text-sm font-medium text-black">Broker Follow-ups</h3></div>
                  <div className="space-y-2.5">{data.broker_questions.map((q, i) => <div key={i} className="text-xs text-gray-700 bg-gray-100 rounded-lg p-3 break-words">{q}</div>)}</div>
                </div>
              )}
              <div className="card p-5">
                <h3 className="text-sm font-medium text-black mb-3">Appetite Reasons</h3>
                <div className="space-y-2">{data.appetite_assessment.reasons.map((r, i) => <div key={i} className="text-xs text-gray-700 break-words">{r}</div>)}</div>
              </div>
              {data.referral_required && data.referral_note && (
                <div className="card p-5 border-gray-400">
                  <div className="flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4" /><h3 className="text-sm font-medium text-black">Referral Note</h3></div>
                  <p className="text-xs text-gray-700 leading-relaxed break-words">{data.referral_note}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Details Tab */}
      {activeTab === "details" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-x-auto">
          <div className="card p-5 min-w-0">
            <h3 className="text-sm font-medium text-black mb-3 flex items-center gap-2"><Building2 className="w-4 h-4" /> Company</h3>
            <div className="space-y-2 text-sm overflow-x-auto">
              {data.company && Object.entries(data.company).filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2"><span className="text-black text-xs uppercase tracking-wider shrink-0">{k.replace(/_/g, " ")}</span><span className="text-gray-800 text-xs font-mono text-right break-words">{String(v)}</span></div>
              ))}
            </div>
          </div>
          <div className="card p-5 min-w-0">
            <h3 className="text-sm font-medium text-black mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Scoring</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-black text-xs">Winnability</span><span className="text-gray-800 font-mono text-xs">{Math.round(data.winnability_score * 100)}%</span></div>
              <div className="flex justify-between"><span className="text-black text-xs">Priority</span><span className="text-gray-800 font-mono text-xs">{Math.round(data.priority_score * 100)}%</span></div>
              <div className="flex justify-between"><span className="text-black text-xs">Queue</span><span className="text-gray-800 text-xs">{data.recommended_queue}</span></div>
              <div className="flex justify-between"><span className="text-black text-xs">Referral</span><span className="text-gray-800 text-xs">{data.referral_required ? "Yes" : "No"}</span></div>
            </div>
            {data.referral_reasons.length > 0 && <div className="mt-3 pt-3 border-t border-gray-300"><div className="text-xs text-black mb-1.5">Referral reasons:</div>{data.referral_reasons.map((r, i) => <div key={i} className="text-xs text-gray-800 break-words">{r}</div>)}</div>}
          </div>
          {data.errors.length > 0 && (
            <div className="card p-5 col-span-1 sm:col-span-2 border-red-300">
              <h3 className="text-sm font-medium text-black mb-3">Processing Errors</h3>
              {data.errors.map((e, i) => <div key={i} className="text-xs text-gray-700 mb-1 break-words">{e}</div>)}
            </div>
          )}
        </div>
      )}

      {/* Evidence Tab */}
      {activeTab === "evidence" && (
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-sm font-medium text-black mb-4">
              Retrieved Evidence ({data.appetite_assessment?.rule_results?.length || 0} rules applied)
            </h3>
            {data.appetite_assessment?.reasons?.length > 0 ? (
              <div className="space-y-3">
                {data.appetite_assessment.reasons.map((r: string, i: number) => (
                  <div key={i} className="bg-gray-100 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-1.5"><BookOpen className="w-3 h-3" />Rule {i + 1}</div>
                    <p className="text-xs text-gray-700">{r}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No rules applied</p>
            )}
          </div>

          {data.broker_questions.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-medium text-black mb-4">
                Information Gaps Identified ({data.broker_questions.length})
              </h3>
              <div className="space-y-3">
                {data.broker_questions.map((q: string, i: number) => (
                  <div key={i} className="bg-gray-100 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-1.5"><AlertTriangle className="w-3 h-3" />Follow-up {i + 1}</div>
                    <p className="text-xs text-gray-700">{q}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card p-5">
            <h3 className="text-sm font-medium text-black mb-4">
              Document Citations ({data.citations.length})
            </h3>
            {data.citations.length === 0 ? (
              <p className="text-sm text-gray-600">No inline citations extracted from brief</p>
            ) : (
              <div className="space-y-3">
                {data.citations.map((c: any, i: number) => (
                  <div key={i} className="bg-gray-100 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-1.5"><BookOpen className="w-3 h-3" />{c.source_doc}{c.page && ` · p.${c.page}`}</div>
                    {c.quote && <p className="text-xs text-gray-700 italic">{c.quote}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}