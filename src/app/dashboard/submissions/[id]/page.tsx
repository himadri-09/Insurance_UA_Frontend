"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSubmission } from "@/lib/api";
import type { SubmissionOutput } from "@/types";
import { marked } from "marked";
import {
  ArrowLeft, AlertTriangle, CheckCircle2, XCircle,
  MessageSquare, Building2, TrendingUp, Clock, Loader2,
  TrendingDown, Minus, X, ShieldAlert, ShieldCheck,
} from "lucide-react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SignalSource {
  doc: string;
  page: number | null;
  section: string;
}

interface RuleResult {
  rule_id: string;
  rule_name: string;
  passed: boolean;
  reason: string;
  severity: string;
  narrative?: string;
  sources?: SignalSource[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSignalConfig(severity: string) {
  switch (severity) {
    case "decline":
      return {
        icon: TrendingDown,
        iconColor: "text-red-600",
        borderColor: "border-red-200",
        hoverBg: "hover:bg-red-50",
        badgeClass: "bg-red-100 text-red-700",
        badgeLabel: "Decline Signal",
        explanationBg: "bg-red-50 border-red-200",
      };
    case "refer":
      return {
        icon: TrendingDown,
        iconColor: "text-orange-500",
        borderColor: "border-orange-200",
        hoverBg: "hover:bg-orange-50",
        badgeClass: "bg-orange-100 text-orange-700",
        badgeLabel: "Refer Signal",
        explanationBg: "bg-orange-50 border-orange-200",
      };
    case "override":
      return {
        icon: Minus,
        iconColor: "text-blue-500",
        borderColor: "border-blue-200",
        hoverBg: "hover:bg-blue-50",
        badgeClass: "bg-blue-100 text-blue-700",
        badgeLabel: "Mitigating Factor",
        explanationBg: "bg-blue-50 border-blue-200",
      };
    default:
      return {
        icon: TrendingUp,
        iconColor: "text-green-600",
        borderColor: "border-green-200",
        hoverBg: "hover:bg-green-50",
        badgeClass: "bg-green-100 text-green-700",
        badgeLabel: "Positive Signal",
        explanationBg: "bg-green-50 border-green-200",
      };
  }
}

function cleanRuleName(name: string): string {
  return name.replace(/^(DECLINE|REFER|OVERRIDE|POSITIVE):\s*/i, "").trim();
}

function getRecommendedAction(status: string, queue: string): { label: string; cls: string } {
  if (status === "decline" || queue === "decline-review")
    return { label: "Decline", cls: "bg-red-100 text-red-700 border border-red-200" };
  if (queue === "referral-senior-uw")
    return { label: "Refer to Senior Underwriter", cls: "bg-orange-100 text-orange-700 border border-orange-200" };
  if (queue === "large-account")
    return { label: "Follow up with broker", cls: "bg-blue-100 text-blue-700 border border-blue-200" };
  if (status === "accept")
    return { label: "Quote", cls: "bg-green-100 text-green-700 border border-green-200" };
  return { label: "Review", cls: "bg-gray-100 text-gray-700 border border-gray-200" };
}

// ── Appetite Score Ring ───────────────────────────────────────────────────────

function AppetiteScoreRing({ score }: { score: number }) {
  const pct = (score / 5) * 100;
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;
  const color = score >= 4 ? "#16a34a" : score === 3 ? "#d97706" : "#dc2626";
  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      <circle cx="48" cy="48" r={r} fill="none" stroke="#e5e7eb" strokeWidth="7" />
      <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="7"
        strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
        transform="rotate(-90 48 48)"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x="48" y="43" textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: "22px", fontWeight: "700", fill: "#111" }}>{score}</text>
      <text x="48" y="63" textAnchor="middle"
        style={{ fontSize: "8px", fill: "#999", fontWeight: "600", letterSpacing: "0.08em" }}>/ 5 APPETITE</text>
    </svg>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { cls: string; icon: any }> = {
    accept: { cls: "bg-green-100 text-green-700 border border-green-200", icon: CheckCircle2 },
    review: { cls: "bg-yellow-100 text-yellow-700 border border-yellow-200", icon: Clock },
    decline: { cls: "bg-red-100 text-red-700 border border-red-200", icon: XCircle },
    refer: { cls: "bg-orange-100 text-orange-700 border border-orange-200", icon: AlertTriangle },
    refer_with_conditions: { cls: "bg-blue-100 text-blue-700 border border-blue-200", icon: AlertTriangle },
  };
  const c = config[status] || config.review;
  return (
    <span className={`${c.cls} flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium`}>
      <c.icon className="w-3 h-3" />
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ── Signal Card ───────────────────────────────────────────────────────────────

function SignalCard({ signal, onClick }: { signal: RuleResult; onClick: () => void }) {
  const cfg = getSignalConfig(signal.severity);
  const Icon = cfg.icon;
  const preview = signal.narrative || signal.reason;
  return (
    <button
      onClick={onClick}
      className={`text-left w-full rounded-xl border ${cfg.borderColor} bg-white ${cfg.hoverBg} transition-all duration-150 p-4 shadow-sm hover:shadow-md`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.iconColor}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 leading-snug">
            {cleanRuleName(signal.rule_name)}
          </p>
          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2">
            {preview}
          </p>
        </div>
      </div>
    </button>
  );
}

// ── Signal Modal ──────────────────────────────────────────────────────────────

function SignalModal({ signal, onClose }: { signal: RuleResult; onClose: () => void }) {
  const cfg = getSignalConfig(signal.severity);
  const BadgeIcon = signal.passed ? ShieldCheck : ShieldAlert;
  const displayName = cleanRuleName(signal.rule_name);
  const bodyText = signal.narrative || signal.reason;

  const severityContext: Record<string, string> = {
    decline: "Decline trigger — meets criteria for non-acceptance.",
    refer: "Referral trigger — senior underwriter review required before quoting.",
    override: "Mitigating factor — reduces the weight of negative signals.",
    positive: "Positive signal — improves the overall risk profile.",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 pt-5 pb-4 rounded-t-2xl">
          <div className="flex items-start justify-between gap-3">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.badgeClass}`}>
              <BadgeIcon className="w-3 h-3" />
              {cfg.badgeLabel}
            </span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mt-3 leading-snug">{displayName}</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          {signal.sources && signal.sources.length > 0 && (
            <p className="text-xs text-gray-400">
              Sources:{" "}
              {signal.sources.map((s, i) => (
                <span key={i}>
                  {i + 1}.{" "}
                  <span className="text-gray-600 font-medium">{s.doc}</span>
                  {s.page ? `, p.${s.page}` : ""}
                  {s.section ? ` (${s.section})` : ""}
                  {i < (signal.sources?.length ?? 0) - 1 ? "; " : ""}
                </span>
              ))}
            </p>
          )}
          <p className="text-sm text-gray-700 leading-relaxed">{bodyText}</p>
          <div className={`rounded-lg px-3 py-2 border ${cfg.explanationBg}`}>
            <p className="text-xs text-gray-500">
              {severityContext[signal.severity] || "Signal identified during underwriting review."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Section Heading ───────────────────────────────────────────────────────────

function SectionHeading({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      {count !== undefined && (
        <span className="text-xs text-gray-400">{count} found</span>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SubmissionDetailPage() {
  const params = useParams();
  const [data, setData] = useState<SubmissionOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSignal, setSelectedSignal] = useState<RuleResult | null>(null);

  useEffect(() => {
    if (params.id)
      getSubmission(params.id as string)
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
  }, [params.id]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );

  if (!data)
    return (
      <div className="text-center py-16">
        <p className="text-gray-600">Submission not found</p>
        <Link href="/dashboard/submissions" className="mt-4 inline-block text-sm underline">Back</Link>
      </div>
    );

  const ruleResults: RuleResult[] = data.appetite_assessment?.rule_results || [];
  const negativeSignals = ruleResults.filter(r => r.severity === "decline" || r.severity === "refer");
  const positiveSignals = ruleResults.filter(r => r.severity === "positive" || r.severity === "override");
  const action = getRecommendedAction(data.appetite_assessment.status, data.recommended_queue);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-16 space-y-6">

      {selectedSignal && (
        <SignalModal signal={selectedSignal} onClose={() => setSelectedSignal(null)} />
      )}

      {/* ── 1. Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Link href="/dashboard/submissions" className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 mb-2">
            <ArrowLeft className="w-3 h-3" /> Back to Cases
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{data.company?.name || "Unknown Company"}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <StatusBadge status={data.appetite_assessment.status} />
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
              {data.line_of_business.replace(/_/g, " ").toUpperCase()}
            </span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-500">Queue: {data.recommended_queue}</span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-500">{data.processing_time_seconds.toFixed(1)}s</span>
          </div>
        </div>
        <div className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium ${action.cls}`}>
          {action.label}
        </div>
      </div>

      {/* ── 2. Appetite ring + Missing info ── */}
      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-center shadow-sm">
          <AppetiteScoreRing score={data.appetite_assessment.score} />
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-3 font-medium">Missing Info</div>
          {data.missing_information.length > 0 ? (
            <div className="space-y-1.5">
              {data.missing_information.slice(0, 4).map((m, i) => (
                <div key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0 text-amber-500" />
                  {m.replace(/_/g, " ")}
                </div>
              ))}
              {data.missing_information.length > 4 && (
                <p className="text-xs text-gray-400">+{data.missing_information.length - 4} more</p>
              )}
            </div>
          ) : (
            <div className="text-xs text-gray-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-green-500" /> All key fields found
            </div>
          )}
        </div>
      </div>

      {/* ── 3. Risk Details (signal cards) ── */}
      {(ruleResults.length > 0 || data.appetite_assessment.reasons.length > 0) && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Risk Details</h2>
            <span className="text-xs text-gray-400">{ruleResults.length} guideline signals found</span>
          </div>
          <div className="p-6 space-y-6">
            {negativeSignals.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Negative Signals ({negativeSignals.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {negativeSignals.map(signal => (
                    <SignalCard key={signal.rule_id} signal={signal} onClick={() => setSelectedSignal(signal)} />
                  ))}
                </div>
              </div>
            )}
            {positiveSignals.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Positive Signals ({positiveSignals.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {positiveSignals.map(signal => (
                    <SignalCard key={signal.rule_id} signal={signal} onClick={() => setSelectedSignal(signal)} />
                  ))}
                </div>
              </div>
            )}
            {ruleResults.length === 0 && data.appetite_assessment.reasons.length > 0 && (
              <div className="space-y-2">
                {data.appetite_assessment.reasons.map((r, i) => (
                  <div key={i} className="text-xs text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{r}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 4. Risk Brief ── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Risk Brief</h2>
        </div>
        <div className="p-6">
          <div
            className="brief-content prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{
              __html: marked.parse(
                (data.risk_brief_markdown || "*No brief generated*")
                  .replace(/^```markdown\n?/, "").replace(/\n?```$/, "").trim()
              ) as string,
            }}
          />
        </div>
      </div>

      {/* ── 5. Broker Questions ── */}
      {data.broker_questions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Broker Follow-up Questions</h2>
          </div>
          <div className="p-6 space-y-2">
            {data.broker_questions.map((q, i) => (
              <div key={i} className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 flex gap-3">
                <span className="text-gray-400 font-mono text-xs mt-0.5 shrink-0">{i + 1}.</span>
                <span className="leading-relaxed">{q}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 6. Referral Note ── */}
      {data.referral_required && data.referral_note && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-orange-900">Referral Note</h2>
          </div>
          <p className="text-sm text-orange-800 leading-relaxed">{data.referral_note}</p>
        </div>
      )}

      {/* ── 7. Company Details ── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">Company Details</h2>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Company</p>
            <div className="space-y-0">
              {data.company && Object.entries(data.company)
                .filter(([, v]) => v !== null && v !== "" && v !== 0)
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2 py-2 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-400 uppercase tracking-wide shrink-0">{k.replace(/_/g, " ")}</span>
                    <span className="text-xs text-gray-800 font-medium text-right break-words max-w-[60%]">{String(v)}</span>
                  </div>
                ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Scoring</p>
            <div className="space-y-0">
              {[
                { label: "Appetite Score", value: `${data.appetite_assessment.score}/5` },
                { label: "Winnability", value: `${Math.round(data.winnability_score * 100)}%` },
                { label: "Priority", value: `${Math.round(data.priority_score * 100)}%` },
                { label: "Queue", value: data.recommended_queue },
                { label: "Referral Required", value: data.referral_required ? "Yes" : "No" },
              ].map(row => (
                <div key={row.label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-xs text-gray-400 uppercase tracking-wide">{row.label}</span>
                  <span className="text-xs text-gray-800 font-medium">{row.value}</span>
                </div>
              ))}
            </div>
            {data.referral_reasons.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Referral reasons</p>
                {data.referral_reasons.map((r, i) => (
                  <div key={i} className="text-xs text-gray-700 mb-1.5 flex gap-2">
                    <span className="text-orange-400 shrink-0">›</span>{cleanRuleName(r)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 8. Errors (if any) ── */}
      {data.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-red-800 mb-3">Processing Errors</h2>
          {data.errors.map((e, i) => (
            <div key={i} className="text-xs text-red-700 mb-1">{e}</div>
          ))}
        </div>
      )}

    </div>
  );
}