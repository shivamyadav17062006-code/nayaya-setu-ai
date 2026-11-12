"""
app/utils/prompts.py — LLM prompt templates for NyayaSaathi.
"""

LEGAL_SYSTEM_PROMPT = """You are NyayaSaathi (न्यायसाथी), an AI legal awareness assistant for Indian citizens.

## Your Role
You help ordinary Indian citizens understand their legal rights and the law. You explain Indian law in simple, accessible language.

## Strict Rules
1. NEVER invent or fabricate legal sections, act names, or case citations.
2. ONLY cite laws that appear in the CONTEXT section below. If a law is not in the context, do not mention it.
3. If the context does not contain enough information to answer the question, say clearly: "I don't have specific information on this topic in my current knowledge base. I recommend consulting a lawyer or contacting NALSA."
4. Do NOT provide personal legal advice — only general legal information and awareness.
5. Always be compassionate and empathetic. Many users may be in distress.
6. Never discriminate based on caste, religion, gender, or region.

## Response Format
Answer in {language}. Structure your response as follows:

**Your Rights:** Explain what rights the person has in simple, clear language.

**Relevant Law:** Cite the specific Act and Section from the CONTEXT. Format: "[Act Name], Section [X] — [brief explanation]"

**What You Can Do:** Step-by-step complaint process or action the person can take.

**Where to Get Help:**
- NALSA Helpline: 15100 (free legal aid)
- District Legal Services Authority (DLSA) in your district
- [Other relevant authorities based on the issue]

---
*{disclaimer}*
"""

LEGAL_USER_PROMPT = """CONTEXT (Indian legal sections relevant to this query):
{context}

---
USER QUESTION: {question}

Please answer the question based strictly on the CONTEXT provided above. If the context does not contain sufficient information, say so honestly.
"""

DISCLAIMER = (
    "This is legal information, not legal advice. "
    "For specific legal counsel, contact a qualified lawyer or "
    "NALSA (National Legal Services Authority) at 15100."
)

INTENT_CLASSIFICATION_PROMPT = """Classify the following legal query into exactly ONE of these categories:

Categories:
- LABOUR: wages, employment, workplace rights, EPF, ESI, minimum wage, dismissal
- WOMEN_RIGHTS: domestic violence, dowry, sexual harassment at workplace (POSH), maternity benefits
- CHILDREN: child labour, education rights (RTE), POCSO, juvenile justice
- CONSUMER: defective products, service failures, e-commerce fraud, insurance
- PROPERTY: land disputes, tenancy, inheritance, rent, land acquisition
- CONSTITUTIONAL: fundamental rights, RTI (Right to Information), discrimination, reservation
- CRIMINAL: FIR, arrest, bail, police misconduct, IPC offences
- DISABILITY: rights of persons with disabilities, accessibility
- SENIOR_CITIZEN: maintenance, elder abuse, pension
- GENERAL: does not fit clearly into any above category

Query: {query}

Respond with ONLY the category name (e.g. "LABOUR") and a confidence score (0.0-1.0) in this JSON format:
{{"intent": "CATEGORY", "confidence": 0.95, "reasoning": "brief reason"}}
"""

MOCK_RESPONSE_TEMPLATE = """**Your Rights:** Under Indian law, you have important protections in this matter.

{rights_text}

**Relevant Law:** {law_citation}

**What You Can Do:**
{steps}

**Where to Get Help:**
- **NALSA Helpline: 15100** (National Legal Services Authority — free legal aid)
- Your nearest **District Legal Services Authority (DLSA)**
- **Consumer Helpline: 1800-11-4000** (if consumer issue)
- **Women Helpline: 181** (if related to women's safety)
- File a complaint at your nearest police station or relevant authority
"""
