"use client";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { SubmissionPDFDocument } from "./SubmissionPDF";
import { Download } from "lucide-react";
import type { SubmissionOutput } from "@/types";

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

interface Props {
  data: SubmissionOutput;
  ruleResults: RuleResult[];
  filename: string;
}

export function PDFDownloadButton({ data, ruleResults, filename }: Props) {
  return (
    <PDFDownloadLink
      document={<SubmissionPDFDocument data={data} ruleResults={ruleResults} />}
      fileName={filename}
    >
      {({ loading }) => (
        <button
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-3.5 h-3.5" />
          {loading ? "Preparing…" : "Export PDF"}
        </button>
      )}
    </PDFDownloadLink>
  );
}
