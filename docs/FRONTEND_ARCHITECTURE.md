# NyayaSaathi (न्यायसाथी) Frontend Architecture

## 1. Architecture Overview & Tech Stack

NyayaSaathi is built as a Single Page Application (SPA) utilizing modern JavaScript ES Modules (`.js`, `.jsx`).

- **Framework**: React 18
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3.4 with `@tailwindcss/typography`
- **Routing**: React Router DOM v6 (`BrowserRouter`, `Routes`, `Route`, `useLocation`)
- **Animation**: Framer Motion (`AnimatePresence`)
- **Internationalization**: `i18next` & `react-i18next` (English, Hindi, Marathi)
- **Icons**: `lucide-react`
- **Notifications**: `react-hot-toast`
- **HTTP Client**: Axios with centralized authorization interceptors (`apiClient`)
- **Automated E2E Testing**: Playwright (Headless Chromium)

---

## 2. Directory Structure & Layer Responsibilities

```
frontend/src/
├── api/                  # Backend REST API client adapters
│   ├── aid.js            # Legal aid provider directory & DLSA lookups
│   ├── auth.js           # JWT authentication & profile operations
│   ├── caseLaw.js        # Court judgments & precedent API
│   ├── chat.js           # AI chat messaging & session management
│   ├── client.js         # Base Axios client with auth interceptor
│   ├── constitution.js   # Constitutional articles & parts
│   ├── eligibility.js    # NALSA Sec 12 eligibility engine
│   ├── kms.js            # Admin Knowledge Management System API
│   ├── legislation.js    # Central Acts & subordinate legislation
│   ├── rights.js         # Know Your Rights categories & sections
│   ├── rightsDiscovery.js# Guided situation RAG discovery
│   ├── speech.js         # Bhashini ASR, TTS, and NMT client
│   ├── states.js         # State Acts & UT legislation
│   └── workflows.js      # Complaint Action Navigator workflows
├── components/           # Reusable UI component library
│   ├── aid/              # Aid provider cards & district pickers
│   ├── auth/             # Auth modal (Email/Phone login & registration)
│   ├── chat/             # Chat bubbles, citation badges, typing dots
│   ├── layout/           # Navbar, Footer, and Page wrappers
│   ├── rights/           # Category cards & expandable section cards
│   ├── ui/               # Button, Card, Badge, Spinner, AccessibilityToolbar
│   └── workflow/         # Step cards, checklists, stepper navigation
├── hooks/                # Custom React hooks (useChat, etc.)
├── i18n/                 # Localization configuration & dictionaries
│   └── locales/          # en.json, hi.json, mr.json
├── pages/                # Top-level view routes
│   ├── admin/LegalKMS.jsx# Admin Knowledge Management Console
│   ├── AidFinder.jsx     # Legal Aid Provider Directory
│   ├── CaseLawExplorer.jsx # Precedent & Case Law Browser
│   ├── Chat.jsx          # AI Legal Assistant
│   ├── ConstitutionExplorer.jsx # Constitution of India
│   ├── Dashboard.jsx     # Citizen Personal Dashboard
│   ├── DocumentAssistant.jsx # Statutory Legal Document Generator
│   ├── Eligibility.jsx   # Free Legal Aid Eligibility Engine
│   ├── Home.jsx          # Landing Page
│   ├── LegislationCatalogue.jsx # Central Acts & Rules
│   ├── Navigator.jsx     # Legal Action Navigator
│   ├── NotFound.jsx      # 404 Route
│   ├── Profile.jsx       # Citizen Profile & Jurisdiction Preferences
│   ├── Rights.jsx        # Know Your Rights Library
│   ├── RightsCategory.jsx# Detailed Provisions View
│   ├── RightsDiscovery.jsx # Guided Situation Wizard
│   └── StateExplorer.jsx # State & UT Legislation Explorer
├── App.jsx               # Application root, routing & main landmark
├── main.jsx              # React DOM entry point
└── index.css             # Tailwind base, utilities, font scaling & contrast
```

---

## 3. Application Routing Table

| Route | View Component | Protected? | Purpose |
|---|---|---|---|
| `/` | `Home` | Public | Citizen landing page, quick search, modules overview, NALSA helpline |
| `/chat` | `Chat` | Public / Session | AI Legal Assistant with voice input, citations, and TTS read aloud |
| `/dashboard` | `Dashboard` | Authenticated / Local Session | Personal dashboard: active workflows, saved assessments, bookmarks |
| `/profile` | `Profile` | Authenticated | Name, state of residence, preferred language, data deletion |
| `/documents` | `DocumentAssistant` | Public | Statutory legal notice and RTI application generator with live preview |
| `/rights` | `Rights` | Public | Know Your Rights category directory and search |
| `/rights/discover` | `RightsDiscovery` | Public | Guided 4-step situation analysis matching legal remedies |
| `/rights/:categoryId` | `RightsCategory` | Public | Detailed statutory provisions with multilingual tabs and bookmarks |
| `/navigator` | `Navigator` | Public / Session | Step-by-step grievance workflows with document checklists |
| `/aid-finder` | `AidFinder` | Public | Legal aid provider directory with district/state filters |
| `/eligibility` | `Eligibility` | Public / Session | NALSA Section 12 free lawyer qualification assessment |
| `/constitution` | `ConstitutionExplorer`| Public | Complete Constitution of India articles, parts, and schedules |
| `/legislation` | `LegislationCatalogue`| Public | Central Acts, Rules, Regulations, and Amendments |
| `/states` | `StateExplorer` | Public | 36 States & UT legislation and local rules tracker |
| `/case-law` | `CaseLawExplorer` | Public | Supreme Court and High Court landmark judgments |
| `/admin/kms` | `LegalKMS` | **Admin Only** | Ingestion batches, review queue, act modifications, audit logs |

---

## 4. State Management & Offline Resilience

1. **User Authentication**:
   - JWT tokens stored in `localStorage.getItem("nyayasaathi_token")`.
   - User profile stored in `localStorage.getItem("nyayasaathi_user")`.
   - Cached profile immediately read on boot; fresh profile fetched asynchronously from `/api/auth/me`.
2. **Session Persistence**:
   - Chat conversations and session IDs stored under `nyayasaathi_session_id` and `nyayasaathi_sessions`.
   - Workflow step progress saved both to PostgreSQL (when connected) and local state.
   - Saved statutory bookmarks stored under `nyayasaathi_saved_rights`.
3. **Language & Accessibility**:
   - Active language key stored under `nyayasaathi_lang`.
   - Dynamic class toggles on `document.documentElement`: `.font-size-sm`, `.font-size-md`, `.font-size-lg`, `.font-size-xl`, and `.high-contrast`.

---

## 5. Security & Boundary Enforcement

- **Zero Credentials in Bundles**: The frontend contains zero database passwords, Supabase service-role keys, or Bhashini secrets.
- **Admin Isolation**: Ordinary citizens navigating to `/admin/kms` receive an immediate role check rejection (`currentUser.role !== 'ADMIN'`), blocking administrative access.
- **External Portal Protection**: Navigation to third-party government websites (e-Daakhil, Cybercrime portal, Shram Suvidha) is wrapped in confirmation modals warning citizens about leaving the secure NyayaSaathi sandbox.
