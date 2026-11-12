// ─── Core entity types ────────────────────────────────────────────────────────

export type Language = {
  code: string
  name: string
  nativeName: string
  script?: string
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', script: 'Devanagari' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', script: 'Tamil' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', script: 'Bengali' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', script: 'Telugu' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', script: 'Devanagari' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', script: 'Gujarati' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', script: 'Kannada' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', script: 'Malayalam' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', script: 'Gurmukhi' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', script: 'Odia' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', script: 'Bengali' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', script: 'Nastaliq' },
]

// ─── Chat types ───────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'system'

export interface Citation {
  id: string
  actName: string
  sectionNumber?: string
  year?: number
  url?: string
}

export interface RelatedRight {
  id: string
  title: string
  categoryId: string
}

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
  citations?: Citation[]
  relatedRights?: RelatedRight[]
  actionUrl?: string
  language?: string
  isStreaming?: boolean
}

export interface ChatSession {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
  messages: ChatMessage[]
  language: string
}

export interface ChatRequest {
  message: string
  sessionId?: string
  language: string
}

export interface ChatResponse {
  sessionId: string
  message: ChatMessage
}

// ─── Rights types ─────────────────────────────────────────────────────────────

export interface RightCategory {
  id: string
  name: string
  nameHi?: string
  slug: string
  description: string
  descriptionHi?: string
  icon: string
  color: string
  sectionCount: number
  beneficiaryTypes: string[]
}

export interface LegalSection {
  id: string
  categoryId: string
  actName: string
  sectionNumber: string
  year?: number
  title: string
  titleHi?: string
  simplifiedText: string
  simplifiedTextHi?: string
  originalText?: string
  beneficiaryTypes: string[]
  applicableStates: string[] // empty = all India
  isConstitutional: boolean
  tags: string[]
  complaintUrl?: string
}

// ─── Workflow types ───────────────────────────────────────────────────────────

export interface WorkflowCategory {
  id: string
  title: string
  titleHi?: string
  description: string
  icon: string
  color: string
  tags: string[]
}

export interface WorkflowStep {
  id: string
  stepNumber: number
  title: string
  titleHi?: string
  description: string
  descriptionHi?: string
  requiredDocuments: string[]
  authorityName: string
  officialLink?: string
  timeLimitDays?: number
  tips?: string[]
}

export interface Workflow {
  id: string
  categoryId: string
  title: string
  titleHi?: string
  description: string
  totalSteps: number
  estimatedDays: number
  steps: WorkflowStep[]
}

// ─── Legal Aid types ──────────────────────────────────────────────────────────

export interface AidProvider {
  id: string
  name: string
  type: 'NALSA' | 'SLSA' | 'DLSA' | 'NGO' | 'BAR_ASSOCIATION' | 'GOVERNMENT'
  state: string
  district?: string
  address: string
  phone: string[]
  email?: string
  website?: string
  servicesOffered: string[]
  eligibilityCriteria?: string
  workingHours?: string
  languages: string[]
}

export interface NalsaEligibilityResult {
  eligible: boolean
  reason: string
  conditions: string[]
  nextSteps: string[]
}

// ─── Eligibility types ────────────────────────────────────────────────────────

export type BeneficiaryCategory =
  | 'general'
  | 'sc_st'
  | 'obc'
  | 'woman'
  | 'senior_citizen'
  | 'disabled'
  | 'worker'
  | 'bpl'
  | 'minor'

export type LegalSituation =
  | 'labour'
  | 'criminal'
  | 'family'
  | 'consumer'
  | 'property'
  | 'domestic_violence'
  | 'wages'
  | 'land'
  | 'other'

export interface EligibilityInput {
  state: string
  annualIncome: number
  category: BeneficiaryCategory
  situation: LegalSituation
  age?: number
  gender?: 'male' | 'female' | 'other'
}

export interface GovernmentScheme {
  id: string
  name: string
  nameHi?: string
  description: string
  eligibilityCriteria: string[]
  benefits: string[]
  officialLink: string
  ministry: string
  applicableStates: string[]
}

export interface EligibilityResult {
  legalAidEligible: boolean
  legalAidReason: string
  schemes: GovernmentScheme[]
  nextSteps: string[]
  nearbyAidProviders?: AidProvider[]
}

// ─── API Response wrappers ───────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ApiError {
  message: string
  code?: string
  details?: Record<string, string>
}

// ─── UI State types ───────────────────────────────────────────────────────────

export interface FilterState {
  state: string
  district: string
  beneficiaryType: string
  searchQuery: string
}

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli',
  'Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
]

export const BENEFICIARY_TYPES = [
  { value: 'worker', label: 'Workers & Labourers' },
  { value: 'woman', label: 'Women' },
  { value: 'sc_st', label: 'SC/ST' },
  { value: 'obc', label: 'OBC' },
  { value: 'disabled', label: 'Persons with Disability' },
  { value: 'senior', label: 'Senior Citizens' },
  { value: 'consumer', label: 'Consumers' },
  { value: 'tenant', label: 'Tenants' },
  { value: 'farmer', label: 'Farmers' },
  { value: 'minor', label: 'Children & Minors' },
]
