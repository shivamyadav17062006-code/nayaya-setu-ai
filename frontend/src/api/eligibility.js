import apiClient from "./client";
const BENEFICIARY_MAP = {
  general: "GENERAL",
  sc_st: "SC_ST",
  obc: "GENERAL",
  woman: "WOMEN",
  senior_citizen: "SENIOR_CITIZEN",
  disabled: "DISABILITY",
  worker: "INDUSTRIAL_WORKMAN",
  bpl: "GENERAL",
  minor: "CHILD"
};
const SITUATION_MAP = {
  labour: "LABOUR",
  wages: "LABOUR",
  domestic_violence: "WOMEN",
  family: "WOMEN",
  consumer: "CONSUMER",
  criminal: "CRIMINAL",
  property: "PROPERTY",
  land: "PROPERTY",
  other: "GENERAL"
};
function toBackendRequest(input) {
  return {
    income: input.annualIncome,
    state: input.state,
    category: SITUATION_MAP[input.situation] ?? "GENERAL",
    beneficiaryType: BENEFICIARY_MAP[input.category] ?? "GENERAL",
    age: input.age
  };
}
function toFrontendResult(payload) {
  const rawSchemes = payload.schemes ?? [];
  const schemes = rawSchemes.map((scheme, index) => ({
    id: scheme.id ?? `scheme-${index}`,
    name: scheme.name,
    description: scheme.description ?? "",
    eligibilityCriteria: scheme.eligibilityCriteria ?? [],
    benefits: scheme.benefits ?? [],
    officialLink: scheme.officialLink ?? scheme.officialUrl ?? "https://nalsa.gov.in",
    ministry: scheme.ministry ?? scheme.authority ?? "Government of India",
    applicableStates: scheme.applicableStates ?? []
  }));
  const derivedSteps = rawSchemes.map((scheme) => scheme.applicationProcess).filter((step) => Boolean(step));
  return {
    legalAidEligible: payload.legalAidEligible ?? payload.eligible ?? false,
    legalAidReason: payload.legalAidReason ?? payload.reason ?? "",
    schemes,
    nextSteps: payload.nextSteps ?? derivedSteps
  };
}
export const eligibilityApi = {
  checkEligibility: async (input) => {
    const { data } = await apiClient.post("/eligibility", toBackendRequest(input));
    return toFrontendResult(data?.data ?? data);
  }
};
