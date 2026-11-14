export const DISCLAIMER =
  'This is legal awareness information, not formal legal counsel. For court representation or personalized legal advice, contact a qualified lawyer or the National Legal Services Authority (NALSA Helpline 15100).';

export const NEXT_STEPS_BY_INTENT = {
  LABOUR: [
    'Compile employment proofs: appointment letter, salary slips, bank transaction logs, and WhatsApp work chats',
    'Serve a formal written demand notice to the employer giving 7 to 15 days for arrears settlement',
    'File an online conciliation dispute on the Shram Suvidha / SAMADHAN Portal (shramsuvidha.gov.in)',
    'Approach the District Labour Commissioner or DLSA (15100) for free legal advocate assignment',
  ],
  WOMEN_RIGHTS: [
    'In case of emergency physical danger, dial 112 (Police) or 181 (Women in Distress Helpline)',
    'Contact your local Protection Officer or Sakhi One Stop Centre to prepare a Domestic Incident Report (DIR)',
    'The Protection Officer files DIR before the Judicial Magistrate within 3 days for immediate Protection Orders',
    'Apply for free legal representation through the District Legal Services Authority (DLSA)',
  ],
  CONSUMER: [
    'Preserve all purchase proof: invoice, warranty card, delivery receipts, photos/videos of the defect, and complaint emails',
    'Send a written demand to the seller or e-commerce platform allowing 15 days for remedy',
    'Register an online complaint on the National Consumer Helpline (1915 or consumerhelpline.gov.in)',
    'If unresolved, file an electronic petition on e-Daakhil (edaakhil.nic.in) before the District Consumer Commission',
  ],
  CHILDREN: [
    'Gather school admission logs, correspondence, birth proof, or fee receipts',
    'Approach the District Education Officer for RTE Act quota admissions',
    'For child welfare or child labour violations, immediately dial CHILDLINE 1098 (24x7)',
  ],
  CRIMINAL: [
    'Request arresting officers to state the grounds of arrest and issue a signed Arrest Memo',
    'Exercise your constitutional right under Article 22 to inform a family member immediately',
    'Mandatory production before nearest Magistrate within 24 hours of detention',
    'Demand free legal representation by a DLSA panel advocate during the remand hearing',
  ],
  PROPERTY: [
    'Verify registered title deeds, mutation records, and municipal tax receipts at the Sub-Registrar office',
    'For tenant-landlord disputes, approach the local Rent Controller / Civil Court',
    'Consult your District Legal Services Authority (DLSA) for pre-litigation mediation',
  ],
  CONSTITUTIONAL: [
    'For public record denial, file an application on the RTI Online portal (rtionline.gov.in)',
    'For fundamental rights violations, file a writ petition before the High Court (Article 226)',
    'Seek pro-bono constitutional legal aid from NALSA at 15100',
  ],
  GENERAL: [
    'Identify the specific nature of your legal grievance and gather all documentation',
    'Collate proof of dates, notices, receipts, and communication logs',
    'Contact NALSA National Legal Helpline 15100 to check your free court lawyer entitlement',
  ],
};

export function buildSystemPrompt(languageName = 'English') {
  return `You are NyayaSaathi (न्यायसाथी), an authoritative AI legal awareness companion for Indian citizens.
Your mission is to explain Indian statutory rights in accessible, compassionate, and precise language.
Answer strictly in ${languageName}.

STRICT MANDATORY RULES:
1. ZERO HALLUCINATIONS: Ground your advice strictly in verified Indian statutes. NEVER fabricate section numbers, acts, or penalties.
2. ONLY cite statutes and legal provisions provided in the CONTEXT below. If the context does not cover a point, state this transparently.
3. Structure your response into 4 distinct sections:
   - **Your Rights**: Plain-language explanation of what entitlements and protections the citizen holds.
   - **Applicable Indian Law**: Exact Act name, section number, and statutory mandate.
   - **What You Can Do**: Step-by-step guidance on gathering evidence and approaching official authorities.
   - **Where to Get Help**: Mention NALSA helpline 15100 and District Legal Services Authority (DLSA).
4. Conclude your response with the statutory disclaimer: "${DISCLAIMER}"`;
}
