# NyayaSaathi — Rights Discovery REST API Specification

## Base Path
All endpoints are mounted under:
```
/api/rights-discovery
```

---

## 1. GET `/api/rights-discovery/metadata`
Retrieves lists of available beneficiary groups, rights categories, and Indian States/UTs.

### Response `200 OK`
```json
{
  "success": true,
  "data": {
    "beneficiaries": [
      {
        "id": "uuid",
        "name": "Workers",
        "slug": "workers",
        "description": "Industrial workmen, daily wagers, and employees...",
        "icon": "Briefcase"
      }
    ],
    "categories": [
      {
        "id": "uuid",
        "name": "Labour Rights",
        "slug": "labour",
        "description": "Wages, overtime, safety standards...",
        "icon": "Briefcase"
      }
    ],
    "states": [
      "MAHARASHTRA", "DELHI", "KARNATAKA", "TAMIL NADU", "..."
    ]
  }
}
```

---

## 2. POST `/api/rights-discovery/classify`
Classifies citizen situation text and generates dynamic follow-up questions.

### Request Body
```json
{
  "situation": "My employer in Mumbai has withheld my salary for 3 months.",
  "context": {
    "state": "MAHARASHTRA",
    "beneficiaryCategory": "workers"
  }
}
```

### Response `200 OK`
```json
{
  "success": true,
  "data": {
    "detectedDomains": ["LABOUR_WAGES"],
    "suggestedBeneficiaries": ["workers"],
    "followUpQuestions": [
      {
        "id": "wage_timeframe",
        "question": "Did the delay or deduction happen within the last 12 months?",
        "explanation": "Under Section 15(2) of the Payment of Wages Act, 1936, claims are normally filed within a 12-month limitation period.",
        "options": ["Yes, within 12 months", "No, more than a year ago", "Not sure / Ongoing"]
      }
    ]
  }
}
```

---

## 3. POST `/api/rights-discovery/discover`
Executes hybrid pgvector semantic search and relational statutory analysis.

### Request Body
```json
{
  "situation": "My employer has withheld my salary for 3 months and is threatening termination.",
  "context": {
    "state": "MAHARASHTRA",
    "beneficiaryCategory": "workers",
    "answers": {
      "wage_timeframe": "Yes, within 12 months",
      "written_proof": "Yes, have payslips/messages"
    }
  },
  "userConsent": true
}
```

### Response `200 OK`
```json
{
  "success": true,
  "data": {
    "sessionToken": "d4e287fa-9b93-4e4b-9c60-843818e6924b",
    "detectedDomains": ["LABOUR_WAGES"],
    "situationSummary": "My employer has withheld my salary for 3 months...",
    "applicableRights": [
      {
        "id": "sec-uuid",
        "title": "Time of payment of wages",
        "actTitle": "Payment of Wages Act",
        "actYear": 1936,
        "sectionNumber": "Section 5",
        "jurisdiction": "CENTRAL",
        "whyApplicable": "Applies directly because your situation describes delayed or withheld earned wages...",
        "conditions": ["Claim must typically be filed within 12 months..."],
        "exceptions": [],
        "simplifiedExplanation": "Your employer is required by law to disburse earned wages on or before the 7th day...",
        "originalStatutoryText": "The wages of every person employed upon or in any railway...",
        "officialSourceUrl": "https://www.indiacode.nic.in/handle/123456789/2367",
        "verificationStatus": "PUBLISHED",
        "verificationDate": "2026-11-14T22:30:00.000Z"
      }
    ],
    "beneficiaryEntitlements": [
      {
        "title": "100% Free Court Representation (Section 12, Legal Services Authorities Act, 1987)",
        "description": "You are legally entitled to free legal aid regardless of income...",
        "authority": "District Legal Services Authority (DLSA) / NALSA",
        "helpline": "15100 (24x7 Toll-Free)",
        "portalUrl": "https://nalsa.gov.in"
      }
    ],
    "recommendedRemedies": [
      {
        "id": "rem-uuid",
        "title": "Section 15 Claim with Compensation up to 10x",
        "remedyType": "AUTHORITY",
        "description": "File formal claim before the Labour Commissioner...",
        "authority": "Authority under Section 15, Payment of Wages Act",
        "timeLimit": "12 months from due date",
        "officialUrl": "https://shramsuvidha.gov.in",
        "steps": [
          "Collect payslips, bank statements, appointment letters...",
          "Issue a formal written demand notice to employer...",
          "File Form A application under Section 15...",
          "Request maximum statutory compensation (up to 10x)..."
        ]
      }
    ],
    "actionSteps": [
      "Preserve and organize all relevant documents...",
      "Send a formal written demand notice...",
      "File claim before designated Labour Commissioner...",
      "Contact NALSA Helpline 15100 for free court advocate appointment..."
    ],
    "helplines": [
      { "name": "NALSA 24x7 Legal Aid Helpline", "number": "15100" },
      { "name": "National Emergency Response System", "number": "112" }
    ],
    "confidence": "HIGH",
    "confidenceExplanation": "Strong match: Verified statutory sections and active legal remedies directly govern the facts described.",
    "missingInfoNote": "Verification of exact documentary dates and contracts will confirm precise statutory limitation deadlines.",
    "disclaimer": "Statutory Notice: NyayaSaathi is a Know Your Rights legal awareness platform..."
  }
}
```

---

## 4. GET `/api/rights-discovery/session/:token`
Retrieves a previously saved discovery session for resuming.

---

## 5. DELETE `/api/rights-discovery/session/:token`
Permanently purges a saved discovery query (User Privacy Erasure).
