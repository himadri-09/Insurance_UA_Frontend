"use client";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { uploadSubmission } from "@/lib/api";
import type { SubmissionOutput, SubmissionFormData, CompanyFormData, IncidentFormData } from "@/types";
import { Upload, FileText, X, Loader2, CheckCircle2, AlertCircle, Building2, FileSearch, MapPin, AlertTriangle, Camera, Clock, ChevronDown, ChevronUp } from "lucide-react";

const STAGES = [
  { key: "classifying", label: "Classifying documents" },
  { key: "extracting", label: "Extracting business data" },
  { key: "retrieving", label: "Searching knowledge base" },
  { key: "scoring", label: "Evaluating appetite & scoring" },
  { key: "generating", label: "Generating risk brief" },
];

const FILE_CATEGORIES = [
  { key: "acord", label: "ACORD Form", accept: ".pdf", icon: FileText, desc: "Standard insurance application" },
  { key: "broker", label: "Broker Submission", accept: ".pdf", icon: FileSearch, desc: "Cover letter & narrative" },
  { key: "loss_run", label: "Loss Runs", accept: ".pdf", icon: AlertTriangle, desc: "Claims history" },
  { key: "legal", label: "Legal / Fire NOC", accept: ".pdf", icon: FileText, desc: "Legal complaints, Fire NOC" },
  { key: "prior", label: "Prior Insurance", accept: ".pdf", icon: FileText, desc: "Expiring policy, dec pages" },
  { key: "photos", label: "Incident Photos", accept: ".png,.jpg,.jpeg,.tiff", icon: Camera, desc: "Property or damage photos" },
];

const ENTITY_TYPES = ["LLC", "Corporation", "S-Corp", "Sole Proprietorship", "Partnership", "Non-Profit"];
const FUNDING_STAGES = ["Bootstrapped", "Seed", "Series A", "Series B", "Series C+", "Public", "N/A"];

function Section({ title, icon: Icon, children, defaultOpen = true }: { title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-5 py-4 border-b border-ink-800/50 hover:bg-ink-800/20 transition-colors">
        <Icon className="w-4 h-4 text-accent" /><h3 className="text-sm font-medium text-black flex-1 text-left">{title}</h3>
        {open ? <ChevronUp className="w-4 h-4 text-ink-500" /> : <ChevronDown className="w-4 h-4 text-ink-500" />}
      </button>
      {open && <div className="p-5">{children}</div>}
    </div>
  );
}

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [company, setCompany] = useState<CompanyFormData>({ name: "", registration_number: "", description: "", entity_type: "", funding_stage: "", headcount: null, year_established: null, annual_revenue: null, annual_payroll: null, naics_code: "" });
  const [businessDesc, setBusinessDesc] = useState("");
  const [propertyDesc, setPropertyDesc] = useState("");
  const [incidents, setIncidents] = useState<IncidentFormData[]>([]);
  const [processing, setProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SubmissionOutput | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<any>(null);

  const addFiles = (category: string, newFiles: FileList) => {
    setFiles((prev) => ({ ...prev, [category]: [...(prev[category] || []), ...Array.from(newFiles)] }));
  };

  const removeFile = (category: string, idx: number) => {
    setFiles((prev) => ({ ...prev, [category]: (prev[category] || []).filter((_, i) => i !== idx) }));
  };

  const addIncident = () => { setIncidents((prev) => [...prev, { date: "", time: "", location: "", description: "" }]); };
  const updateIncident = (idx: number, field: keyof IncidentFormData, value: string) => {
    setIncidents((prev) => prev.map((inc, i) => i === idx ? { ...inc, [field]: value } : inc));
  };
  const removeIncident = (idx: number) => { setIncidents((prev) => prev.filter((_, i) => i !== idx)); };

  const allFiles = Object.values(files).flat();
  const hasData = allFiles.length > 0 || company.name || businessDesc;

  const handleSubmit = async () => {
    if (!hasData) return;
    setProcessing(true); setError(""); setCurrentStage(0); setElapsed(0);

    const start = Date.now();
    timerRef.current = setInterval(() => setElapsed(Math.round((Date.now() - start) / 1000)), 1000);
    const stageTimer = setInterval(() => setCurrentStage((prev) => Math.min(prev + 1, STAGES.length - 1)), 8000);

    try {
      const formData: SubmissionFormData = { company, business_description: businessDesc, property_description: propertyDesc, incidents };
      const output = await uploadSubmission(allFiles, formData);
      setResult(output); setCurrentStage(STAGES.length);
    } catch (err: any) { setError(err.message || "Processing failed"); }
    finally { setProcessing(false); clearInterval(timerRef.current); clearInterval(stageTimer); }
  };

  if (result) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-accent-green mx-auto mb-4" />
          <h2 className="text-xl font-display text-ink-50 mb-2">Submission Processed</h2>
          <p className="text-sm text-ink-400 mb-1">{result.company?.name || "Submission"} — {result.line_of_business}</p>
          <p className="text-sm text-ink-500 mb-6">Completed in {result.processing_time_seconds.toFixed(1)}s</p>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="card p-4"><div className="text-xs text-ink-500 uppercase tracking-wider mb-1">Appetite</div><div className="text-2xl font-display text-ink-50">{result.appetite_assessment.score}/5</div></div>
            <div className="card p-4"><div className="text-xs text-ink-500 uppercase tracking-wider mb-1">Winnability</div><div className="text-2xl font-display text-accent-green">{Math.round(result.winnability_score * 100)}%</div></div>
            <div className="card p-4"><div className="text-xs text-ink-500 uppercase tracking-wider mb-1">Priority</div><div className="text-2xl font-display text-accent-warm">{Math.round(result.priority_score * 100)}%</div></div>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => router.push(`/dashboard/submissions/${result.submission_id}`)} className="btn-primary">View Full Brief</button>
            <button onClick={() => { setResult(null); setFiles({}); setCurrentStage(0); setElapsed(0); }} className="btn-secondary">New Submission</button>
          </div>
        </div>
      </div>
    );
  }

  if (processing) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3"><Loader2 className="w-5 h-5 text-accent animate-spin" /><span className="text-sm text-ink-200">Processing submission...</span></div>
            <span className="font-mono text-sm text-ink-500">{elapsed}s</span>
          </div>
          <div className="space-y-3">
            {STAGES.map((stage, i) => (
              <div key={stage.key} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${i < currentStage ? "bg-accent-green/20 text-accent-green" : i === currentStage ? "bg-accent/20 text-accent animate-subtle-pulse" : "bg-ink-800 text-ink-600"}`}>
                  {i < currentStage ? <CheckCircle2 className="w-3.5 h-3.5" /> : i === currentStage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>{i + 1}</span>}
                </div>
                <span className={`text-sm ${i <= currentStage ? "text-ink-200" : "text-ink-600"}`}>{stage.label}</span>
              </div>
            ))}
          </div>
        </div>
        {error && <div className="card p-4 mt-4 border-accent-red/30 bg-accent-red/5 flex items-start gap-3"><AlertCircle className="w-4 h-4 text-accent-red mt-0.5" /><div><p className="text-sm text-accent-red font-medium">Processing failed</p><p className="text-xs text-ink-400 mt-1">{error}</p></div></div>}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-display text-ink-50">New Submission</h1>
        <p className="text-sm text-ink-400 mt-1">Submit commercial insurance documents and business details for AI triage</p>
      </div>

      <div className="space-y-4">
        {/* Company Details */}
        <Section title="Company Details" icon={Building2}>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Company Name *</label><input value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} className="input-sm" placeholder="Acme Corp" /></div>
            <div><label className="label">Registration / EIN</label><input value={company.registration_number} onChange={(e) => setCompany({ ...company, registration_number: e.target.value })} className="input-sm" placeholder="XX-XXXXXXX" /></div>
            <div><label className="label">Entity Type</label><select value={company.entity_type} onChange={(e) => setCompany({ ...company, entity_type: e.target.value })} className="input-sm"><option value="">Select...</option>{ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className="label">NAICS Code</label><input value={company.naics_code} onChange={(e) => setCompany({ ...company, naics_code: e.target.value })} className="input-sm" placeholder="541512" /></div>
            <div><label className="label">Annual Revenue ($)</label><input type="number" value={company.annual_revenue || ""} onChange={(e) => setCompany({ ...company, annual_revenue: e.target.value ? Number(e.target.value) : null })} className="input-sm" placeholder="5000000" /></div>
            <div><label className="label">Annual Payroll ($)</label><input type="number" value={company.annual_payroll || ""} onChange={(e) => setCompany({ ...company, annual_payroll: e.target.value ? Number(e.target.value) : null })} className="input-sm" placeholder="2000000" /></div>
            <div><label className="label">Headcount</label><input type="number" value={company.headcount || ""} onChange={(e) => setCompany({ ...company, headcount: e.target.value ? Number(e.target.value) : null })} className="input-sm" placeholder="50" /></div>
            <div><label className="label">Year Established</label><input type="number" value={company.year_established || ""} onChange={(e) => setCompany({ ...company, year_established: e.target.value ? Number(e.target.value) : null })} className="input-sm" placeholder="2015" /></div>
            <div><label className="label">Funding Stage</label><select value={company.funding_stage} onChange={(e) => setCompany({ ...company, funding_stage: e.target.value })} className="input-sm"><option value="">Select...</option>{FUNDING_STAGES.map((f) => <option key={f} value={f}>{f}</option>)}</select></div>
          </div>
          <div className="mt-4"><label className="label">Company Description</label><input value={company.description} onChange={(e) => setCompany({ ...company, description: e.target.value })} className="input-sm" placeholder="Brief description of what the company does" /></div>
        </Section>

        {/* Business Description */}
        <Section title="Business Description" icon={FileText} defaultOpen={false}>
          <label className="label">Describe the business operations, products/services, and risk profile</label>
          <textarea value={businessDesc} onChange={(e) => setBusinessDesc(e.target.value)} className="input-sm min-h-[120px]" placeholder="Describe the business operations in detail — what they do, how they operate, key risk exposures..." />
        </Section>

        {/* Property Details */}
        <Section title="Property Details" icon={MapPin} defaultOpen={false}>
          <label className="label">Describe properties, locations, equipment being insured</label>
          <textarea value={propertyDesc} onChange={(e) => setPropertyDesc(e.target.value)} className="input-sm min-h-[120px]" placeholder="List properties with addresses, construction type, year built, square footage, sprinkler status, alarm systems..." />
        </Section>

        {/* Incident Details */}
        <Section title="Incident Details" icon={Clock} defaultOpen={false}>
          {incidents.map((inc, i) => (
            <div key={i} className="grid grid-cols-4 gap-3 mb-3 items-end">
              <div><label className="label">Date</label><input type="date" value={inc.date} onChange={(e) => updateIncident(i, "date", e.target.value)} className="input-sm" /></div>
              <div><label className="label">Time</label><input type="time" value={inc.time} onChange={(e) => updateIncident(i, "time", e.target.value)} className="input-sm" /></div>
              <div><label className="label">Location</label><input value={inc.location} onChange={(e) => updateIncident(i, "location", e.target.value)} className="input-sm" placeholder="Address" /></div>
              <div className="flex gap-2"><div className="flex-1"><label className="label">Description</label><input value={inc.description} onChange={(e) => updateIncident(i, "description", e.target.value)} className="input-sm" placeholder="What happened" /></div><button onClick={() => removeIncident(i)} className="p-2 text-ink-600 hover:text-accent-red"><X className="w-4 h-4" /></button></div>
            </div>
          ))}
          <button onClick={addIncident} className="btn-secondary text-sm">+ Add Incident</button>
        </Section>

        {/* File Uploads */}
        <Section title="Document Uploads" icon={Upload}>
          <div className="grid grid-cols-2 gap-4">
            {FILE_CATEGORIES.map((cat) => (
              <div key={cat.key} className="card p-4">
                <div className="flex items-center gap-2 mb-3"><cat.icon className="w-4 h-4 text-ink-500" /><span className="text-sm text-black font-medium">{cat.label}</span></div>
                <p className="text-xs text-ink-500 mb-3">{cat.desc}</p>
                <label className="block cursor-pointer">
                  <div className="border border-dashed border-ink-700 rounded-lg p-3 text-center hover:border-ink-500 transition-colors">
                    <Upload className="w-4 h-4 text-ink-600 mx-auto mb-1" /><span className="text-xs text-ink-500">Click to upload</span>
                  </div>
                  <input type="file" multiple accept={cat.accept} onChange={(e) => e.target.files && addFiles(cat.key, e.target.files)} className="hidden" />
                </label>
                {(files[cat.key] || []).map((f, i) => (
                  <div key={i} className="flex items-center gap-2 mt-2 bg-ink-800/30 rounded px-2 py-1.5">
                    <FileText className="w-3 h-3 text-ink-500" /><span className="flex-1 text-xs text-ink-300 truncate">{f.name}</span>
                    <button onClick={() => removeFile(cat.key, i)} className="text-ink-600 hover:text-ink-300"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Section>

        {/* Submit */}
        <button onClick={handleSubmit} disabled={!hasData} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
          <Upload className="w-4 h-4" /> Process Submission ({allFiles.length} file{allFiles.length !== 1 ? "s" : ""})
        </button>
      </div>
    </div>
  );
}
