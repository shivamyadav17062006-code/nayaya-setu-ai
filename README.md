# NyayaSaathi — Digital Assistant for Legal Awareness

**NyayaSaathi** (meaning "Justice Companion" in Hindi) is an AI-powered legal awareness platform designed to make Indian law accessible to every citizen — in their own language, using simple, jargon-free explanations.

## 🎯 Mission

Bridging the legal knowledge gap for millions of Indians who cannot afford lawyers or navigate complex legal systems, particularly marginalized communities including workers, women, tribal communities, and persons with disabilities.

## 🏗️ Architecture

```
nyayasaathi/
├── frontend/          # React + Vite + TypeScript (PWA)
├── backend/           # Node.js + Express + Prisma + PostgreSQL
└── ai-engine/         # Python + FastAPI + LangChain + pgvector
```

## ✨ Features

- 🤖 **AI Legal Chatbot** — Multilingual legal Q&A powered by Gemini/GPT-4
- 📜 **Know Your Rights** — Searchable database of Indian laws, simplified
- 🗺️ **Legal Aid Finder** — NALSA/SLSA/NGO legal aid locator by state
- 📋 **Complaint Workflows** — Step-by-step guides for filing complaints
- ✅ **Eligibility Checker** — NALSA legal aid eligibility assessment
- 🌐 **Multilingual** — Hindi, Marathi, Tamil, Telugu, Kannada, Bengali via BHASHINI

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- Docker & Docker Compose
- Python ≥ 3.11 (for ai-engine)

### 1. Clone & Install
```bash
git clone <repo-url>
cd nyayasaathi
cp .env.example .env
# Fill in your environment variables
npm install
```

### 2. Start Database
```bash
npm run docker:up
```

### 3. Run Migrations & Seed
```bash
npm run db:migrate
npm run db:seed
```

### 4. Start Development Servers
```bash
npm run dev
```

The backend will be available at `http://localhost:4000` and frontend at `http://localhost:5173`.

## 🗄️ Database Schema

The PostgreSQL database (with pgvector extension) contains:
- **LegalAct** / **LegalSection** — full text of Indian laws
- **RightCategory** / **Beneficiary** — categorization system
- **LegalAidProvider** — NALSA, SLSA, DLSA, NGO directory
- **ComplaintWorkflow** / **ComplaintStep** — guided workflows
- **Translation** — multilingual content via BHASHINI
- **Conversation** / **Message** — chat session persistence
- **User** — optional user accounts

## 🌐 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/chat` | AI legal chatbot |
| GET | `/api/rights` | List right categories |
| GET | `/api/rights/:slug` | Rights by category |
| GET | `/api/rights/search?q=` | Full-text search |
| GET | `/api/aid?state=&category=` | Legal aid finder |
| GET | `/api/workflows` | List workflows |
| GET | `/api/workflows/:category` | Workflow with steps |
| POST | `/api/eligibility` | NALSA eligibility check |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |

## 📄 License

MIT — Free to use, modify and distribute for legal awareness purposes.

## 🤝 Contributing

Pull requests welcome. Please read CONTRIBUTING.md for guidelines.
