import apiClient from './client'
import type {
  BeneficiaryCategory,
  EligibilityInput,
  EligibilityResult,
  GovernmentScheme,
  LegalSituation,
} from '@/types'

const BENEFICIARY_MAP: Record<BeneficiaryCategory, string> = {
  general: 'GENERAL',
  sc_st: 'SC_ST',
  obc: 'GENERAL',
  woman: 'WOMEN',
  senior_citizen: 'SENIOR_CITIZEN',
  disabled: 'DISABILITY',
  worker: 'INDUSTRIAL_WORKMAN',
  bpl: 'GENERAL',
  minor: 'CHILD',
}

const SITUATION_MAP: Record<LegalSituation, string> = {
  labour: 'LABOUR',
  wages: 'LABOUR',
  domestic_violence: 'WOMEN',
  family: 'WOMEN',
  consumer: 'CONSUMER',
  criminal: 'CRIMINAL',
  property: 'PROPERTY',
  land: 'PROPERTY',
  other: 'GENERAL',
}

function toBackendRequest(input: EligibilityInput) {
  return {
    income: input.annualIncome,
    state: input.state,
    category: SITUATION_MAP[input.situation] ?? 'GENERAL',
    beneficiaryType: BENEFICIARY_MAP[input.category] ?? 'GENERAL',
    age: input.age,
  }
}

function toFrontendResult(payload: any): EligibilityResult {
  const rawSchemes: any[] = payload.schemes ?? []

  const schemes: GovernmentScheme[] = rawSchemes.map((scheme, index) => ({
    id: scheme.id ?? `scheme-${index}`,
    name: scheme.name,
    description: scheme.description ?? '',
    eligibilityCriteria: scheme.eligibilityCriteria ?? [],
    benefits: scheme.benefits ?? [],
    officialLink: scheme.officialLink ?? scheme.officialUrl ?? 'https://nalsa.gov.in',
    ministry: scheme.ministry ?? scheme.authority ?? 'Government of India',
    applicableStates: scheme.applicableStates ?? [],
  }))

  const derivedSteps = rawSchemes
    .map((scheme) => scheme.applicationProcess)
    .filter((step): step is string => Boolean(step))

  return {
    legalAidEligible: payload.legalAidEligible ?? payload.eligible ?? false,
    legalAidReason: payload.legalAidReason ?? payload.reason ?? '',
    schemes,
    nextSteps: payload.nextSteps ?? derivedSteps,
  }
}

export const eligibilityApi = {
  checkEligibility: async (input: EligibilityInput): Promise<EligibilityResult> => {
    const { data } = await apiClient.post<any>('/eligibility', toBackendRequest(input))
    return toFrontendResult(data?.data ?? data)
  },
}
