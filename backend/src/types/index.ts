// NyayaSaathi — Shared TypeScript Types

// ---- API Response Shapes ----

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ---- Chat ----

export interface ChatRequest {
  message: string;
  language?: string;
  sessionId?: string;
}

export interface ChatResponse {
  answer: string;
  sessionId: string;
  language: string;
  sources?: LegalSourceRef[];
  suggestedActions?: SuggestedAction[];
}

export interface LegalSourceRef {
  actTitle: string;
  sectionNumber: string;
  sectionTitle?: string;
  url?: string;
}

export interface SuggestedAction {
  label: string;
  type: 'WORKFLOW' | 'AID' | 'ELIGIBILITY' | 'RIGHTS';
  payload: Record<string, string>;
}

// ---- AI Engine Proxy ----

export interface AIEngineQueryRequest {
  query: string;
  language: string;
  session_id: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface AIEngineQueryResponse {
  answer: string;
  sources: LegalSourceRef[];
  language: string;
}

// ---- Rights ----

export interface RightCategoryWithCount {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string | null;
  sectionCount: number;
}

export interface RightCategoryDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string | null;
  sections: SectionSummary[];
}

export interface SectionSummary {
  id: string;
  sectionNumber: string;
  title?: string | null;
  simplifiedText: string;
  act: {
    id: string;
    title: string;
    year: number;
    jurisdiction: string;
    state?: string | null;
    sourceUrl: string;
  };
}

// ---- Legal Aid ----

export interface AidQuery {
  state?: string;
  category?: string;
  district?: string;
  type?: string;
}

// ---- Eligibility ----

export interface EligibilityRequest {
  income: number;        // Annual income in INR
  state: string;
  category: string;     // e.g. "LABOUR", "WOMEN", "GENERAL"
  beneficiaryType: string; // e.g. "SC_ST", "WOMEN", "CHILD", "GENERAL"
  age?: number;
}

export interface EligibilityResult {
  eligible: boolean;
  schemes: EligibilityScheme[];
  reason: string;
  referralLink?: string;
}

export interface EligibilityScheme {
  name: string;
  authority: string;
  description: string;
  benefits: string[];
  eligibilityCriteria: string[];
  applicationProcess: string;
  officialUrl: string;
  contactInfo?: string;
}

// ---- Auth ----

export interface RegisterRequest {
  email?: string;
  phone?: string;
  name?: string;
  state?: string;
  language?: string;
  password: string;
}

export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserPublic;
}

export interface UserPublic {
  id: string;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  state?: string | null;
  language: string;
  role: string;
}

// ---- JWT ----

export interface JwtPayload {
  userId: string;
  email?: string;
  phone?: string;
  role: string;
  iat?: number;
  exp?: number;
}

// ---- Express augmentation ----

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
