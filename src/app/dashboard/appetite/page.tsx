"use client";
import { useState, useRef } from "react";
import { ingestAppetiteGuide } from "@/lib/api";
import { BookOpen, Upload, FileText, X, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

const DOC_TYPES = [
  { value: "policy_wording", label: "Policy Wording (CGL, CP, WC, etc.)" },
  { value: "underwriting_guide", label: "Underwriting Guidelines" },
  { value: "claims_guide", label: "Claims Handling Guide" },
  { value: "endorsement", label: "Endorsements" },
  { value: "reference", label: "General Reference" },
];

const LOB_OPTIONS = [
  { value: "commercial", label: "Commercial (Multi-line)" },
  { value: "general_liability", label: "General Liability" },
  { value: "property", label: "Commercial Property" },
  { value: "workers_comp", label: "Workers Comp" },
  { value: "commercial_auto", label: "Commercial Auto" },
  { value: "cyber", label: "Cyber" },
  { value: "umbrella", label: "Umbrella / Excess" },
  { value: "bop", label: "Business Owners Policy" },
];

export default function AppetitePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [docType, setDocType] = useState("reference");
  const [lob, setLob] = useState("commercial");
  const [insurer, setInsurer] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ files_processed: number; chunks_indexed: number } | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (files.length === 0) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await ingestAppetiteGuide(files, lob, insurer.trim() || "default", docType);
      setResult(res); setFiles([]);
    } catch (err: any) { setError(err.message || "Ingestion failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8"><h1 className="text-2xl font-display text-ink-50">Knowledge Base</h1><p className="text-sm text-ink-400 mt-1">Upload policy wordings, UW guides, and claims references for the retrieval layer</p></div>
      <div className="card p-6 space-y-5">
        <div><label className="label">Carrier / Insurer</label><input type="text" value={insurer} onChange={(e) => setInsurer(e.target.value)} className="input-sm" placeholder="e.g. Hartford, Zurich, Travelers" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Document Type</label><select value={docType} onChange={(e) => setDocType(e.target.value)} className="input-sm">{DOC_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}</select></div>
          <div><label className="label">Line of Business</label><select value={lob} onChange={(e) => setLob(e.target.value)} className="input-sm">{LOB_OPTIONS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}</select></div>
        </div>
        <div>
          <label className="label">PDF Documents</label>
          <div onClick={() => inputRef.current?.click()} className="card p-8 text-center cursor-pointer hover:border-ink-600 transition-colors">
            <BookOpen className="w-6 h-6 text-ink-600 mx-auto mb-2" /><p className="text-sm text-ink-400">Click to upload policy / guideline PDFs</p>
            <input ref={inputRef} type="file" multiple accept=".pdf" onChange={(e) => e.target.files && setFiles((prev) => [...prev, ...Array.from(e.target.files!)])} className="hidden" />
          </div>
        </div>
        {files.length > 0 && <div className="space-y-2">{files.map((f, i) => (
          <div key={i} className="flex items-center gap-3 bg-ink-800/30 rounded-lg px-3 py-2">
            <FileText className="w-4 h-4 text-ink-500" /><span className="flex-1 text-sm text-ink-300 truncate">{f.name}</span>
            <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="text-ink-600 hover:text-ink-300"><X className="w-3.5 h-3.5" /></button>
          </div>
        ))}</div>}
        <button onClick={handleSubmit} disabled={loading || files.length === 0} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Indexing...</> : <><Upload className="w-4 h-4" /> Index {files.length || ""} document{files.length !== 1 ? "s" : ""}</>}
        </button>
        {result && <div className="flex items-start gap-3 bg-accent-green/5 border border-accent-green/20 rounded-lg p-4"><CheckCircle2 className="w-4 h-4 text-accent-green mt-0.5" /><div><p className="text-sm text-accent-green font-medium">Ingestion complete</p><p className="text-xs text-ink-400 mt-1">{result.files_processed} file(s), {result.chunks_indexed} chunks indexed</p></div></div>}
        {error && <div className="flex items-start gap-3 bg-accent-red/5 border border-accent-red/20 rounded-lg p-4"><AlertCircle className="w-4 h-4 text-accent-red mt-0.5" /><div><p className="text-sm text-accent-red font-medium">Failed</p><p className="text-xs text-ink-400 mt-1">{error}</p></div></div>}
      </div>
    </div>
  );
}
