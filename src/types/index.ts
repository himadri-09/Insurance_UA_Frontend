export type AppetiteStatus = "accept" | "review" | "decline" | "refer";
export type SubmissionStatus =
  | "uploaded" | "classifying" | "extracting" | "retrieving"
  | "scoring" | "generating" | "complete" | "error";

export interface SubmissionListItem {
  id: string;
  created_at: string;
  status: SubmissionStatus;
  lob: string;
  insured_name: string;
  appetite_score: number;
  appetite_status: AppetiteStatus;
  winnability: number;
  priority: number;
  queue: string;
  referral_required: boolean;
  processing_time: number;
}

export interface CompanyInfo {
  name: string;
  dba: string;
  registration_number: string;
  entity_type: string;
  description: string;
  naics_code: string;
  sic_code: string;
  industry: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  year_established: number | null;
  years_in_business: number | null;
  funding_stage: string;
  annual_revenue: number | null;
  headcount: number | null;
  annual_payroll: number | null;
}

export interface AppetiteAssessment {
  score: number;
  status: AppetiteStatus;
  reasons: string[];
  rule_results: {
    rule_id: string;
    rule_name: string;
    passed: boolean;
    reason: string;
    severity: string;
  }[];
}

export interface Citation {
  claim: string;
  source_doc: string;
  page: number | null;
  section: string;
  quote: string;
}

export interface SubmissionOutput {
  submission_id: string;
  status: SubmissionStatus;
  line_of_business: string;
  created_at: string;
  company: CompanyInfo;
  extracted_facts: any[];
  missing_information: string[];
  appetite_assessment: AppetiteAssessment;
  winnability_score: number;
  priority_score: number;
  referral_required: boolean;
  referral_reasons: string[];
  recommended_queue: string;
  broker_questions: string[];
  risk_brief_markdown: string;
  referral_note: string;
  citations: Citation[];
  processing_time_seconds: number;
  errors: string[];
}

export interface CompanyFormData {
  name: string;
  registration_number: string;
  description: string;
  entity_type: string;
  funding_stage: string;
  headcount: number | null;
  year_established: number | null;
  annual_revenue: number | null;
  annual_payroll: number | null;
  naics_code: string;
}

export interface IncidentFormData {
  date: string;
  time: string;
  location: string;
  description: string;
}

export interface SubmissionFormData {
  company: CompanyFormData;
  business_description: string;
  property_description: string;
  incidents: IncidentFormData[];
}
