import { createClient } from "./supabase";
import type { SubmissionOutput, SubmissionListItem, SubmissionFormData } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return { Authorization: `Bearer ${session.access_token}` };
}

export async function uploadSubmission(
  files: File[],
  formData?: SubmissionFormData
): Promise<SubmissionOutput> {
  const headers = await getAuthHeaders();
  const body = new FormData();

  for (const file of files) {
    body.append("files", file);
  }

  if (formData) {
    body.append("form_data", JSON.stringify(formData));
  }

  const res = await fetch(`${API_URL}/api/submissions`, {
    method: "POST",
    headers,
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Upload failed: ${res.status}`);
  }
  return res.json();
}

export async function listSubmissions(
  limit = 20, offset = 0
): Promise<{ submissions: SubmissionListItem[]; count: number }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/submissions?limit=${limit}&offset=${offset}`, { headers });
  if (!res.ok) throw new Error(`Failed to list submissions: ${res.status}`);
  return res.json();
}

export async function getSubmission(id: string): Promise<SubmissionOutput> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/submissions/${id}`, { headers });
  if (!res.ok) throw new Error(`Failed to get submission: ${res.status}`);
  const data = await res.json();
  if (data.result_json && typeof data.result_json === "string") return JSON.parse(data.result_json);
  if (data.result_json && typeof data.result_json === "object") return data.result_json;
  return data;
}

export async function ingestAppetiteGuide(
  files: File[], lob: string, insurer: string, docType: string
): Promise<{ status: string; files_processed: number; chunks_indexed: number }> {
  const headers = await getAuthHeaders();
  const body = new FormData();
  for (const file of files) body.append("files", file);
  body.append("lob", lob);
  body.append("insurer", insurer);
  body.append("doc_type", docType);

  const res = await fetch(`${API_URL}/api/appetite/ingest`, { method: "POST", headers, body });
  if (!res.ok) throw new Error(`Ingestion failed: ${res.status}`);
  return res.json();
}
