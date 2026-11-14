"""
app/services/llm_service.py — LLM interaction layer.

Supports three backends:
  - "google"  → Gemini Pro via langchain-google-genai
  - "openai"  → GPT-4o-mini via langchain-openai
  - "mock"    → Realistic hard-coded responses (no API key needed)
"""

from __future__ import annotations

import logging
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)


# ── Mock responses ────────────────────────────────────────────────────────────

_MOCK_RESPONSES: dict[str, str] = {
    "LABOUR": """**Your Rights:** As an employee in India, you have the right to receive your salary on time. Under the Payment of Wages Act, 1936, your employer is legally obligated to pay you within 7-10 days after the end of the wage period. Withholding wages without valid reason is illegal.

**Relevant Law:**
- **Payment of Wages Act, 1936, Section 5** — Wages must be paid before the 7th day (or 10th day for establishments with 1000+ workers) after the end of the wage period.
- **Payment of Wages Act, 1936, Section 15** — Any employee whose wages are delayed or withheld can file a complaint before the Authority under this Act.
- **Industrial Disputes Act, 1947, Section 33C** — Allows recovery of money due from an employer.

**What You Can Do:**
1. Send a written demand to your employer (keep a copy).
2. File a complaint with the **Labour Commissioner** in your district.
3. File an application before the **Authority under the Payment of Wages Act** (usually the Labour Court).
4. If your employer is not complying, file a complaint with the police under relevant IPC sections for criminal breach of trust.

**Where to Get Help:**
- **NALSA Helpline: 15100** (free legal aid)
- **Labour Commissioner Office** in your district
- **Labour Court** in your jurisdiction
- District Legal Services Authority (DLSA)""",

    "WOMEN_RIGHTS": """**Your Rights:** Indian law provides strong protections for women against domestic violence, sexual harassment, and gender-based discrimination.

**Relevant Law:**
- **Protection of Women from Domestic Violence Act, 2005, Section 12** — Any aggrieved woman can present an application to a Magistrate for relief including protection orders, residence orders, and monetary relief.
- **Protection of Women from Domestic Violence Act, 2005, Section 18** — Courts can issue Protection Orders preventing the abuser from contacting or approaching you.
- **Indian Penal Code, Section 498A** — Cruelty by husband or his relatives is punishable with up to 3 years imprisonment.
- **Sexual Harassment of Women at Workplace Act, 2013** — Protects women from harassment at their workplace.

**What You Can Do:**
1. Contact the **Protection Officer** in your district (appointed under the DV Act).
2. File an FIR at the nearest police station.
3. Contact the **Women Helpline: 181** for immediate assistance.
4. File a complaint with the **Internal Complaints Committee (ICC)** at your workplace (for workplace harassment).
5. Approach a Magistrate's Court directly under Section 12 of the DV Act.

**Where to Get Help:**
- **Women Helpline: 181** (24/7)
- **Police Emergency: 112**
- **NALSA Helpline: 15100** (free legal aid)
- **National Commission for Women: 7827170170**""",

    "CONSUMER": """**Your Rights:** As a consumer in India, you have the right to be protected against defective goods, deficient services, and unfair trade practices.

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
- **NALSA Helpline: 15100** (free legal aid)""",

    "CRIMINAL": """**Your Rights:** Every person in India has fundamental rights during arrest and criminal proceedings, guaranteed by the Constitution and the Code of Criminal Procedure.

**Relevant Law:**
- **Code of Criminal Procedure, 1973 (CrPC), Section 41** — Police can only arrest without a warrant in specific circumstances.
- **CrPC, Section 50** — Police must inform the arrested person of the grounds of arrest and their right to bail.
- **CrPC, Section 57** — An arrested person cannot be held for more than 24 hours without being produced before a Magistrate.
- **Article 22 of the Constitution** — Guarantees the right to be informed of grounds of arrest and to consult a lawyer.
- **Legal Services Authorities Act, 1987** — Guarantees free legal aid to persons in custody.

**What You Can Do:**
1. You have the right to remain silent — you need not answer questions that may incriminate you.
2. Demand to know the grounds of your arrest.
3. You can contact a lawyer immediately after arrest.
4. If detained beyond 24 hours without being produced before a Magistrate, file a **Habeas Corpus** petition in the High Court.
5. For false FIR, you can file a complaint to the **Superintendent of Police** or approach the **High Court**.

**Where to Get Help:**
- **NALSA Helpline: 15100** (free legal aid — mandatory for persons in custody)
- **Police Control Room: 112**
- **National Human Rights Commission: 14433**""",

    "PROPERTY": """**Your Rights:** Indian property laws protect your rights over land, residential property, and inheritance.

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
- Revenue Department / Tehsildar for land records""",

    "CONSTITUTIONAL": """**Your Rights:** The Constitution of India guarantees fundamental rights to every citizen that cannot be taken away by any law or government action.

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
- High Court / Supreme Court through PILs""",

    "GENERAL": """**Your Rights:** As an Indian citizen, you are protected by numerous laws that safeguard your rights and wellbeing.

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
- Local lawyers and legal aid clinics""",
}


def sanitize_api_key(key: Optional[str]) -> Optional[str]:
    """Return key if it is a real key, or None if empty or a placeholder."""
    if not key:
        return None
    val = key.strip()
    if (
        val == ""
        or val.startswith("your-")
        or val.startswith("[YOUR-")
        or val.startswith("<")
        or val == "your-gemini-api-key"
        or len(val) < 15
    ):
        return None
    return val


def _get_mock_response(intent: str, question: str, language: str) -> str:
    """Return a realistic mock legal response based on classified intent."""
    base = _MOCK_RESPONSES.get(intent, _MOCK_RESPONSES["GENERAL"])
    return base


# ── LLM Service ───────────────────────────────────────────────────────────────

class LLMService:
    def __init__(self) -> None:
        self._chain = None

    def _build_chain(self):
        """Build the LangChain LLM chain based on configured provider."""
        from langchain_core.messages import SystemMessage, HumanMessage  # type: ignore

        provider = settings.LLM_PROVIDER

        if provider == "google":
            api_key = sanitize_api_key(settings.GOOGLE_API_KEY) or sanitize_api_key(settings.GEMINI_API_KEY)
            if not api_key:
                logger.warning(
                    "[LLMService] Gemini API key not configured or contains placeholder. "
                    "Operating in grounded statutory mock mode."
                )
                return None

            from langchain_google_genai import ChatGoogleGenerativeAI  # type: ignore

            llm = ChatGoogleGenerativeAI(
                model=settings.GEMINI_MODEL,
                google_api_key=api_key,
                temperature=0.3,
                convert_system_message_to_human=True,
            )
        elif provider == "openai":
            from langchain_openai import ChatOpenAI  # type: ignore

            llm = ChatOpenAI(
                model="gpt-4o-mini",
                api_key=settings.OPENAI_API_KEY,
                temperature=0.3,
            )
        else:
            return None  # Mock mode

        return llm

    async def generate_response(
        self,
        system_prompt: str,
        user_prompt: str,
        language: str = "en",
        intent: str = "GENERAL",
        question: str = "",
    ) -> str:
        """
        Generate a legal response from the LLM.

        Falls back to mock responses if provider is "mock" or if the LLM call fails.
        """
        if settings.LLM_PROVIDER == "mock":
            logger.info("[MOCK LLM] Returning mock legal response")
            return _get_mock_response(intent, question, language)

        try:
            if self._chain is None:
                self._chain = self._build_chain()

            from langchain_core.messages import SystemMessage, HumanMessage  # type: ignore

            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt),
            ]

            import asyncio

            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, lambda: self._chain.invoke(messages)
            )
            return response.content

        except Exception as exc:
            logger.warning(f"LLM call failed, falling back to mock: {exc}")
            return _get_mock_response(intent, question, language)

    async def generate_raw(self, prompt: str) -> str:
        """
        Generate a raw response from the LLM (no system prompt wrapping).
        Used for tasks like intent classification.
        """
        if settings.LLM_PROVIDER == "mock":
            return '{"intent": "GENERAL", "confidence": 0.5, "reasoning": "mock mode"}'

        try:
            if self._chain is None:
                self._chain = self._build_chain()

            from langchain_core.messages import HumanMessage  # type: ignore
            import asyncio

            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, lambda: self._chain.invoke([HumanMessage(content=prompt)])
            )
            return response.content

        except Exception as exc:
            logger.warning(f"LLM raw call failed: {exc}")
            return '{"intent": "GENERAL", "confidence": 0.5, "reasoning": "error"}'


# Singleton instance
llm_service = LLMService()
