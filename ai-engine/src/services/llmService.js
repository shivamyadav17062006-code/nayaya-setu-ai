import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';

export const MOCK_RESPONSES = {
  LABOUR: `**Your Rights:** As an employee in India, you have the right to receive your salary on time. Under the Payment of Wages Act, 1936 (the active operative statute) and the Code on Wages, 2019 (enacted modern framework), your employer is legally obligated to pay you within 7-10 days after the end of the wage period. Withholding wages without valid reason is illegal.

**Relevant Law:**
- **Payment of Wages Act, 1936, Section 5** — Wages must be paid before the 7th day (or 10th day for establishments with 1000+ workers) after the end of the wage period. (Code on Wages 2019, Section 16 provides a 7-day standard across establishments).
- **Payment of Wages Act, 1936, Section 15** — Any employee whose wages are delayed or withheld can file a formal claim before the Payment of Wages Authority for back-pay plus compensation up to 10 times the amount.
- **Industrial Disputes Act, 1947, Section 33C** — Allows recovery of earned money due from an employer via recovery certificate executed as land revenue arrears.

**What You Can Do:**
1. Send a written demand notice to your employer (keep proof of delivery).
2. File a complaint with the **Labour Commissioner** in your district or via Shram Suvidha portal.
3. File a formal application before the **Authority under the Payment of Wages Act** (Assistant Labour Commissioner).
4. If your employer is deliberately misappropriating deducted wages or PF, file a complaint with the police under Section 316 of the Bharatiya Nyaya Sanhita, 2023 for criminal breach of trust (formerly IPC 405/406).

**Where to Get Help:**
- **NALSA Helpline: 15100** (24x7 free legal aid)
- **Labour Commissioner Office** in your district
- **Labour Court / Payment of Wages Authority** in your jurisdiction
- **District Legal Services Authority (DLSA)** for a free panel lawyer`,

  WOMEN_RIGHTS: `**Your Rights:** Indian law provides robust statutory and constitutional protections for women against domestic violence, matrimonial cruelty, and sexual harassment.

**Relevant Law:**
- **Protection of Women from Domestic Violence Act, 2005, Section 12** — Aggrieved women can apply to a Judicial Magistrate for protection orders, residence orders, and monetary relief.
- **Protection of Women from Domestic Violence Act, 2005, Section 18** — Court can issue immediate Protection Orders restraining the abuser.
- **Bharatiya Nyaya Sanhita, 2023 (BNS), Section 85** — Cruelty towards a woman by her husband or relatives is a non-bailable criminal offense punishable with up to 3 years imprisonment and fine (formerly IPC Section 498A; offenses committed prior to 1 July 2024 remain governed by IPC 498A under Section 358 BNS savings).
- **Sexual Harassment of Women at Workplace (POSH) Act, 2013** — Mandatory Internal Complaints Committee (ICC) and protection from workplace harassment.

**What You Can Do:**
1. Contact the **Protection Officer** in your district (appointed under the DV Act).
2. Approach Sakhi One Stop Centre or file an FIR / Zero FIR at any police station under Section 173 BNSS.
3. Contact the **Women Helpline: 181** or **Police Emergency: 112** for immediate physical safety.
4. File a complaint with the **Internal Complaints Committee (ICC)** at your workplace.
5. Approach a Judicial Magistrate directly under Section 12 of the DV Act with free legal aid.

**Where to Get Help:**
- **Women Helpline: 181** (24/7)
- **Police Emergency: 112**
- **NALSA Helpline: 15100** (24x7 free legal aid)
- **National Commission for Women: 7827170170**`,

  CONSUMER: `**Your Rights:** As a consumer in India, you have the right to be protected against defective goods, deficient services, and unfair trade practices.

**Relevant Law:**
- **Consumer Protection Act, 2019, Section 2(7)** — Defines "consumer" broadly to include both goods and services.
- **Consumer Protection Act, 2019, Section 35** — Any consumer can file a complaint before the District Consumer Disputes Redressal Commission.
- **Consumer Protection Act, 2019, Section 2(46)** — "Unfair trade practice" is widely defined to protect consumer interests.
- **Consumer Protection (E-Commerce) Rules, 2020** — Specifically protects consumers in online transactions.

**What You Can Do:**
1. First send a written complaint/legal notice to the seller/service provider.
2. File a complaint on the **National Consumer Helpline portal**: consumerhelpline.gov.in
3. File a case in the **District Consumer Disputes Redressal Commission** (for claims up to ₹50 lakhs — no court fee for small claims).
4. For defective products, you can claim repair, replacement, or refund.

**Where to Get Help:**
- **National Consumer Helpline: 1800-11-4000** (toll-free)
- **Consumer Helpline SMS: 8800001915**
- **Online portal**: consumerhelpline.gov.in
- **NALSA Helpline: 15100** (free legal aid)`,

  CRIMINAL: `**Your Rights:** Every person in India has fundamental and statutory rights during arrest and criminal proceedings, guaranteed by the Constitution of India and the Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS).

**Relevant Law:**
- **Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS), Section 35** — Police cannot arrest arbitrarily; for offenses punishable up to seven years, police must ordinarily issue a formal Notice of Appearance (formerly CrPC Section 41 & 41A).
- **BNSS, Section 47** — Police must inform the arrested person forthwith of full particulars of the offense and, in bailable offenses, their right to release on bail (formerly CrPC Section 50).
- **BNSS, Section 58 & Article 22(2) of the Constitution** — An arrested individual cannot be detained in police custody for more than 24 hours (excluding journey time) without being produced before the nearest Judicial Magistrate (formerly CrPC Section 57).
- **BNSS, Section 173** — Mandates registration of Zero FIR regardless of territorial police station boundaries.
- **BNSS, Section 531** — All pending criminal trials, investigations, appeals, and inquiries initiated prior to 1 July 2024 remain governed by the Code of Criminal Procedure, 1973.
- **Legal Services Authorities Act, 1987, Section 12** — Guarantees 100% free legal aid to all persons in custody, including panel advocate representation during remand hearings.

**What You Can Do:**
1. Exercise your right to remain silent — you are protected against self-incrimination under Article 20(3).
2. Demand to know the exact grounds of arrest and request a signed Arrest Memo with witness signature.
3. Inform a nominated family member or friend immediately under Section 48 BNSS.
4. If detained beyond 24 hours without Magistrate production, file a **Habeas Corpus** petition or inform the Duty Magistrate.
5. Demand free legal representation by a DLSA panel advocate before signing any statement.

**Where to Get Help:**
- **NALSA Helpline: 15100** (24x7 free legal aid — mandatory for custody)
- **Police Control Room: 112**
- **National Human Rights Commission: 14433**
- Front Office of your District Legal Services Authority (DLSA)`,

  PROPERTY: `**Your Rights:** Indian property laws protect your rights over land, residential property, and inheritance.

**Relevant Law:**
- **Transfer of Property Act, 1882** — Governs sale, mortgage, lease, and transfer of property.
- **Rent Control Act** (varies by state) — Protects tenants from arbitrary eviction and excessive rent.
- **Hindu Succession Act, 1956 / Muslim Personal Law** — Governs inheritance rights.
- **Registration Act, 1908** — Makes registration of property documents mandatory.
- **Land Acquisition Act, 2013** — Governs government acquisition of private land with compensation.

**What You Can Do:**
1. Ensure all property transactions are in writing and registered with the **Sub-Registrar**.
2. For tenant-landlord disputes, approach the **Rent Controller** in your city.
3. For inheritance disputes, file a civil suit in the appropriate **Civil Court**.
4. For encroachment, file a complaint with the **local authorities** (tehsildar/collector).
5. Keep all documents (title deed, mutation records, tax receipts) safely.

**Where to Get Help:**
- **NALSA Helpline: 15100** (free legal aid)
- District Legal Services Authority (DLSA)
- Sub-Registrar Office for property registrations
- Revenue Department / Tehsildar for land records`,

  CONSTITUTIONAL: `**Your Rights:** The Constitution of India guarantees fundamental rights to every citizen that cannot be taken away by any law or government action.

**Relevant Law:**
- **Article 14** — Right to Equality: The State shall not deny any person equality before the law.
- **Article 19** — Right to Freedom: Includes freedom of speech, expression, assembly, and movement.
- **Article 21** — Right to Life and Personal Liberty: No person shall be deprived of their life or liberty except according to procedure established by law.
- **Right to Information Act, 2005, Section 6** — Every citizen can request information from any public authority.
- **Article 32** — Right to Constitutional Remedies: You can directly approach the Supreme Court if fundamental rights are violated.

**What You Can Do:**
1. For RTI: File an RTI application directly to the Public Information Officer (PIO) of the relevant government department.
2. For fundamental rights violations: File a **Writ Petition** in the High Court (Article 226) or Supreme Court (Article 32).
3. For discrimination complaints: Approach the **National Human Rights Commission (NHRC)**.
4. For state-level issues: Approach the **State Human Rights Commission**.

**Where to Get Help:**
- **NALSA Helpline: 15100** (free legal aid)
- **National Human Rights Commission: 14433**
- **Central Information Commission** (for RTI appeals)
- High Court / Supreme Court through PILs`,

  GENERAL: `**Your Rights:** As an Indian citizen, you are protected by numerous laws that safeguard your rights and wellbeing.

**Relevant Law:** Based on the information provided, I'll need more specific details to cite exact legal provisions. Indian law covers many areas including labour rights, consumer protection, property rights, criminal law, and fundamental constitutional rights.

**What You Can Do:**
1. Identify the specific nature of your legal issue.
2. Consult with a lawyer or legal aid organization for personalized guidance.
3. Contact NALSA for free legal assistance if you cannot afford a lawyer.
4. Document all relevant facts, dates, and communications related to your issue.
5. Approach the appropriate court or authority based on the nature of your complaint.

**Where to Get Help:**
- **NALSA Helpline: 15100** (National Legal Services Authority — free legal aid)
- **District Legal Services Authority (DLSA)** in your district
- **High Court Legal Services Committee**
- Local lawyers and legal aid clinics`,
};

export class LLMService {
  constructor() {
    this.client = null;
    if (config.geminiApiKey) {
      try {
        this.client = new GoogleGenAI({ apiKey: config.geminiApiKey });
      } catch (err) {
        console.warn('[LLMService] GoogleGenAI init warning:', err.message);
      }
    }
  }

  get isConfigured() {
    return Boolean(this.client && config.geminiApiKey);
  }

  getMockResponse(intent) {
    return MOCK_RESPONSES[intent] || MOCK_RESPONSES.GENERAL;
  }

  async generateResponse({ systemPrompt, userPrompt, language = 'en', intent = 'GENERAL', question = '' }) {
    if (config.llmProvider === 'mock' || !this.client || !config.geminiApiKey) {
      console.log(`[LLMService] Generating grounded statutory response (mode: mock/fallback, intent: ${intent})`);
      return this.getMockResponse(intent);
    }

    try {
      const response = await this.client.models.generateContent({
        model: config.geminiModel,
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
        ],
        config: {
          temperature: 0.3,
        },
      });

      if (response && response.text) {
        return response.text;
      }
      return this.getMockResponse(intent);
    } catch (err) {
      console.warn(`[LLMService] Gemini call failed (${err.message}). Falling back to grounded response.`);
      return this.getMockResponse(intent);
    }
  }

  async generateRaw(prompt) {
    if (config.llmProvider === 'mock' || !this.client || !config.geminiApiKey) {
      return JSON.stringify({ intent: 'GENERAL', confidence: 0.5, reasoning: 'mock fallback' });
    }

    try {
      const response = await this.client.models.generateContent({
        model: config.geminiModel,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      return response.text || '';
    } catch (err) {
      console.warn(`[LLMService] Gemini raw call failed: ${err.message}`);
      return JSON.stringify({ intent: 'GENERAL', confidence: 0.5, reasoning: 'fallback' });
    }
  }
}

export const llmService = new LLMService();
