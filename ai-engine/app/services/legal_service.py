"""
app/services/legal_service.py — Retrieval and search across legal provisions.
"""

from typing import List, Dict, Any, Optional

# Verified baseline statutory provisions for grounded RAG
LEGAL_KNOWLEDGE_BASE = [
    {
        "act": "Payment of Wages Act",
        "year": 1936,
        "section": "Section 5",
        "title": "Time of payment of wages",
        "category": "LABOUR",
        "text": "Wages must be paid before the expiry of the 7th day (or 10th day if over 1000 employees) after the wage period ends.",
        "simplified": "Your employer cannot withhold salary past the 7th or 10th of the following month. Withholding pay beyond this is an actionable legal violation.",
        "remedy": "File a claim with the Labour Commissioner Authority under Section 15.",
    },
    {
        "act": "Payment of Wages Act",
        "year": 1936,
        "section": "Section 15",
        "title": "Claims arising out of deductions from wages or delay in payment",
        "category": "LABOUR",
        "text": "Where any deduction has been made from wages or payment has been delayed, the worker or trade union official may apply to the Authority for payment plus compensation up to ten times the withheld amount.",
        "simplified": "You can recover all unpaid wages along with statutory penalty compensation up to 10x the delayed amount through the Labour Court / Authority.",
        "remedy": "File an application before District Labour Court / DLSA.",
    },
    {
        "act": "Protection of Women from Domestic Violence Act",
        "year": 2005,
        "section": "Section 3",
        "title": "Definition of domestic violence",
        "category": "WOMEN_RIGHTS",
        "text": "Domestic violence includes physical abuse, sexual abuse, verbal and emotional abuse, and economic abuse (deprivation of financial resources).",
        "simplified": "Domestic violence covers physical harm, verbal abuse, threats, or depriving a woman of maintenance or financial support.",
        "remedy": "Call 112 / 181 or contact the District Protection Officer.",
    },
    {
        "act": "Protection of Women from Domestic Violence Act",
        "year": 2005,
        "section": "Section 12 & 18",
        "title": "Application to Magistrate and Protection Orders",
        "category": "WOMEN_RIGHTS",
        "text": "An aggrieved person or Protection Officer may apply to the Magistrate for Protection Orders prohibiting acts of domestic violence, entering the workplace, or alienating shared household assets.",
        "simplified": "The Magistrate can pass urgent interim orders barring the abuser from entering your residence or workplace within 3 days of complaint.",
        "remedy": "File an application under Section 12 before the Judicial Magistrate with free legal representation from DLSA.",
    },
    {
        "act": "Consumer Protection Act",
        "year": 2019,
        "section": "Section 35",
        "title": "Complaint to District Commission",
        "category": "CONSUMER",
        "text": "A complaint regarding defective goods, deficiency of service, unfair contract, or misleading advertisement may be filed before the District Commission electronically via e-Daakhil or physically.",
        "simplified": "You can file an official complaint against a seller or company online without a lawyer to get a refund, replacement, and compensation.",
        "remedy": "File online complaint on https://edaakhil.nic.in or National Consumer Helpline 1915.",
    },
    {
        "act": "Right of Children to Free and Compulsory Education Act",
        "year": 2009,
        "section": "Section 3 & 12",
        "title": "Right of child to free and compulsory education",
        "category": "CHILDREN",
        "text": "Every child between 6 to 14 years has the right to free education in a neighbourhood school, including a 25% quota in private unaided schools for economically weaker sections (EWS).",
        "simplified": "Every child aged 6-14 is guaranteed free schooling. Private schools must reserve 25% of seats for disadvantaged and EWS children.",
        "remedy": "Approach the District Education Officer (DEO) or State Commission for Protection of Child Rights.",
    },
    {
        "act": "Constitution of India",
        "year": 1950,
        "section": "Article 39A",
        "title": "Equal justice and free legal aid",
        "category": "CONSTITUTIONAL",
        "text": "The State shall secure that the operation of the legal system promotes justice on a basis of equal opportunity, and shall provide free legal aid by suitable legislation or schemes.",
        "simplified": "No citizen should be denied justice due to poverty. The government is constitutionally bound to provide free lawyers through NALSA.",
        "remedy": "Call NALSA National Legal Helpline at 15100.",
    },
]

class LegalService:
    @staticmethod
    def get_provisions_by_intent(intent: str, limit: int = 3) -> List[Dict[str, Any]]:
        matches = [p for p in LEGAL_KNOWLEDGE_BASE if p.get("category") == intent]
        if not matches:
            # Fallback to constitutional & labour
            matches = LEGAL_KNOWLEDGE_BASE[:limit]
        return matches[:limit]

legal_service = LegalService()
