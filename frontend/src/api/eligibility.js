import apiClient from "./client";

function getSessionId() {
  if (typeof window === "undefined") return "guest-session";
  let sessionId = localStorage.getItem("nyayasaathi_session_id");
  if (!sessionId) {
    sessionId = "sess_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
    localStorage.setItem("nyayasaathi_session_id", sessionId);
  }
  return sessionId;
}

export const eligibilityApi = {
  checkEligibility: async (input) => {
    const sessionId = getSessionId();
    const payload = {
      annualIncome: input.annualIncome !== undefined && input.annualIncome !== "" ? Number(input.annualIncome) : null,
      income: input.annualIncome !== undefined && input.annualIncome !== "" ? Number(input.annualIncome) : null,
      state: input.state || "Delhi",
      courtLevel: input.courtLevel || "SUBORDINATE_COURT",
      category: input.category || "GENERAL",
      beneficiaryType: input.category || "GENERAL",
      circumstances: input.circumstances || (input.situation ? [input.situation] : []),
      age: input.age !== undefined && input.age !== "" ? Number(input.age) : null,
      gender: input.gender || null,
      situation: input.situation || null,
      userConsent: Boolean(input.userConsent),
      sessionId,
    };

    const { data } = await apiClient.post("/eligibility", payload, {
      headers: { "x-session-id": sessionId },
    });

    const res = data?.data ?? data;
    return {
      status: res.status || (res.eligible ? "POTENTIALLY_ELIGIBLE" : "POTENTIALLY_NOT_ELIGIBLE"),
      legalAidEligible: res.status === "POTENTIALLY_ELIGIBLE" || Boolean(res.eligible),
      eligible: res.status === "POTENTIALLY_ELIGIBLE" || Boolean(res.eligible),
      isStatutoryExempt: Boolean(res.isStatutoryExempt),
      statutoryClause: res.statutoryClause || null,
      explanation: res.explanation || res.reason || "",
      legalAidReason: res.explanation || res.reason || "",
      criteriaBreakdown: res.criteriaBreakdown || {},
      schemes: res.schemes || [],
      recommendedProviders: res.recommendedProviders || [],
      disclaimer: res.disclaimer || "",
      helpline: res.helpline || "15100",
      referralLink: res.referralLink || "https://nalsa.gov.in",
      nextSteps: res.schemes?.map((s) => s.applicationProcess).filter(Boolean) || [
        "Visit your District Court and approach the DLSA Front Office.",
        "Carry copies of your ID proof and relevant legal papers.",
        "Alternatively, dial toll-free 15100 to request panel lawyer allocation.",
      ],
    };
  },

  getIncomeLimits: async (state) => {
    try {
      const { data } = await apiClient.get("/eligibility/income-limits", {
        params: state ? { state } : {},
      });
      return data?.data || [];
    } catch {
      return [];
    }
  },

  getSavedAssessments: async () => {
    const sessionId = getSessionId();
    try {
      const { data } = await apiClient.get("/eligibility/assessments", {
        headers: { "x-session-id": sessionId },
      });
      return data?.data || [];
    } catch {
      return [];
    }
  },
};

export default eligibilityApi;
