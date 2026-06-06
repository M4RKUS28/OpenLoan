import axios from "axios";
import { getOptionalToken } from "./auth";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
});

// Attach a bearer token when the user is signed in. The marketplace is browsable
// while signed out, so a missing token is fine — we simply omit the header.
api.interceptors.request.use(async (config) => {
  const token = await getOptionalToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Only bounce to sign-in for protected calls; public GETs never 401.
      window.location.href = "/signin";
    }
    return Promise.reject(err);
  },
);

// ── Types ───────────────────────────────────────────────────────────────────

export type TradeType = "import" | "export" | "wholesale" | "distribution";
export type LoanStatus =
  | "pending_approval"
  | "open"
  | "funded"
  | "repaid"
  | "closed"
  | "rejected";
export type RiskGrade = "A" | "B" | "C" | "D" | "E";

export interface CompanySummary {
  id: string;
  name: string;
  industry: string;
  country: string;
  city?: string | null;
  website?: string | null;
  logo_url?: string | null;
}

export interface Company extends CompanySummary {
  owner_user_id: string;
  description?: string | null;
  founded_year?: number | null;
  employees?: number | null;
  annual_revenue?: number | null;
  registration_no?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyUpsert {
  name: string;
  industry?: string;
  country?: string;
  city?: string | null;
  description?: string | null;
  website?: string | null;
  founded_year?: number | null;
  employees?: number | null;
  annual_revenue?: number | null;
  registration_no?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
}

export interface LoanSummary {
  id: string;
  title: string;
  goods?: string | null;
  purpose?: string | null;
  trade_type: string;
  industry: string;
  amount: number;
  currency: string;
  term_days: number;
  interest_rate: number;
  funded_amount: number;
  status: LoanStatus;
  risk_score?: number | null;
  risk_grade?: RiskGrade | null;
  auction_deadline?: string | null;
  created_at: string;
  company: CompanySummary;
  bid_count: number;
  best_rate?: number | null;
}

export interface ScoreFactor {
  key: string;
  label: string;
  description: string;
  score: number;
  weight: number;
}

export interface ScoreBreakdown {
  score: number;
  grade: RiskGrade;
  factors: ScoreFactor[];
}

export interface LoanDocument {
  id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  category?: string | null;
  created_at: string;
  download_url: string;
}

export interface Bid {
  id: string;
  loan_id: string;
  lender_user_id: string;
  lender_name: string;
  amount: number;
  interest_rate: number;
  message?: string | null;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  created_at: string;
}

export interface LoanDetail extends LoanSummary {
  description?: string | null;
  origin_country?: string | null;
  destination_country?: string | null;
  owner_user_id: string;
  updated_at: string;
  score: ScoreBreakdown;
  documents: LoanDocument[];
  bids: Bid[];
}

export interface MyBid {
  bid: Bid;
  loan: LoanSummary;
}

export interface LoanCreate {
  title: string;
  description?: string;
  purpose?: string;
  trade_type: string;
  industry?: string;
  goods?: string;
  origin_country?: string;
  destination_country?: string;
  amount: number;
  currency?: string;
  term_days: number;
  interest_rate: number;
}

export interface MarketplaceFilters {
  search?: string;
  status?: string;
  industry?: string;
  trade_type?: string;
  risk_grade?: string;
  sort?: string;
  offset?: number;
  limit?: number;
}

// ── Companies ────────────────────────────────────────────────────────────────

export const companiesApi = {
  me: () => api.get<Company | null>("/companies/me"),
  upsert: (body: CompanyUpsert) => api.put<Company>("/companies", body),
  get: (id: string) => api.get<Company>(`/companies/${id}`),
};

// ── Loans / marketplace ──────────────────────────────────────────────────────

export const loansApi = {
  list: (filters: MarketplaceFilters = {}) =>
    api.get<{ items: LoanSummary[] }>("/loans", { params: filters }),
  industries: () => api.get<{ items: string[] }>("/loans/industries"),
  mine: () => api.get<{ items: LoanSummary[] }>("/loans/mine"),
  get: (id: string) => api.get<LoanDetail>(`/loans/${id}`),
  create: (body: LoanCreate) => api.post<LoanDetail>("/loans", body),
  approve: (id: string) => api.post<LoanSummary>(`/loans/${id}/approve`),
  reject: (id: string) => api.post<LoanSummary>(`/loans/${id}/reject`),
  bids: (id: string) => api.get<{ items: Bid[] }>(`/loans/${id}/bids`),
  placeBid: (id: string, body: { amount: number; interest_rate: number; message?: string }) =>
    api.post<Bid>(`/loans/${id}/bids`, body),
  acceptBid: (id: string, bidId: string) =>
    api.post<LoanDetail>(`/loans/${id}/bids/${bidId}/accept`),
};

export const bidsApi = {
  mine: () => api.get<MyBid[]>("/bids/mine"),
};

// ── Files (also used for loan documents) ─────────────────────────────────────

export interface FileRecord {
  id: string;
  user_id: string;
  filename: string;
  object_name: string;
  content_type: string;
  size_bytes: number;
  loan_id?: string | null;
  category?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UploadIntent {
  file_id: string;
  upload_url: string;
  object_name: string;
}

export const filesApi = {
  initiateUpload: (
    filename: string,
    content_type: string,
    opts: { loan_id?: string; category?: string } = {},
  ) => api.post<UploadIntent>("/files/upload/initiate", { filename, content_type, ...opts }),
  confirmUpload: (file_id: string, size_bytes: number) =>
    api.post<FileRecord>(`/files/upload/${file_id}/confirm`, { size_bytes }),
  delete: (file_id: string) => api.delete(`/files/${file_id}`),
};

// Direct-to-storage upload, optionally attached to a loan deal.
export async function uploadFileDirect(
  file: File,
  opts: { loan_id?: string; category?: string } = {},
): Promise<FileRecord> {
  const { data: intent } = await filesApi.initiateUpload(file.name, file.type, opts);
  await axios.put(intent.upload_url, file, { headers: { "Content-Type": file.type } });
  const { data: record } = await filesApi.confirmUpload(intent.file_id, file.size);
  return record;
}
