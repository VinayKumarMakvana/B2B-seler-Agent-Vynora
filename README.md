# Vynora Autonomous BDM

Vynora is a production-grade Autonomous Business Development Management (BDM) application. It replaces legacy, brittle n8n automation pipelines with a highly durable, type-safe, and fail-closed architecture built on **NestJS**, **PostgreSQL**, and **Next.js**.

## 11-Phase Architecture

Vynora autonomously manages the complete B2B sales lifecycle across 11 distinct phases:

1. **Core Persistence:** Transactional PostgreSQL database utilizing `FOR UPDATE SKIP LOCKED` for reliable, distributed background job processing.
2. **Discovery Engine:** Identifies and de-duplicates high-value leads via inbound webhooks.
3. **Response Parsing:** AI-driven intent classification mapping raw text to strict state transitions.
4. **Outreach Engine:** AI-drafted cold emails utilizing targeted pain-points and one-shot prompting.
5. **Follow-Up Automation:** Intelligent scheduling with strict spam-prevention limits (Max 3 follow-ups).
6. **Command Dashboard:** A premium Next.js UI providing a Human-in-the-Loop CRM and Approvals Inbox.
7. **Sales Engine:** Deterministic pricing calculations merged with AI-drafted proposal scopes.
8. **Negotiation Engine:** Strict Margin Protection logic forcing the AI to cut deliverables if a client requests a budget reduction.
9. **Closing Handoff:** Terminal state handling (`CLOSED_WON` / `CLOSED_LOST`).
10. **Payment Security:** Cryptographically verified webhook handlers (e.g., Stripe `invoice.payment_succeeded`).
11. **Delivery Provisioning:** Automated handoff from the sales pipeline to the fulfillment team.

## Safety & The "No-Invention Principle"

Unlike generic LLM wrappers, Vynora is built with strict safety guarantees:
- **Fail Closed:** Any failure in AI JSON parsing or cryptographic signature verification results in an immediate halt and a logged exception. The system never guesses.
- **The No-Invention Principle:** The AI is strictly forbidden from inventing prices, timelines, or company facts. Pricing is calculated via a 100% deterministic backend service.
- **Human in the Loop (HitL):** All AI-generated outreach and revised proposals are staged in a `PENDING` state and require explicit human approval via the Dashboard before dispatch.

## Tech Stack

- **Backend:** NestJS (TypeScript), TypeORM
- **Database:** PostgreSQL 15
- **Frontend:** Next.js 14, React, Vanilla CSS (Glassmorphism design system)
- **AI Integration:** Ollama (Local LLM support, default: `qwen3:4b`)

## Local Development & Deployment

The application is fully Dockerized for immediate local testing or production deployment.

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (if running outside of Docker)

### Quick Start (Docker)

```bash
# Clone the repository
git clone https://github.com/your-org/vynora.git
cd vynora

# Build and start the entire stack (DB, Backend, Frontend)
docker-compose up -d --build
```

- **Frontend Dashboard:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:3001](http://localhost:3001)

### Local Development (Without Docker)

If you prefer to run the Node servers locally against a Dockerized Postgres:

1. **Start the Database**
```bash
docker-compose up -d db
```

2. **Start the Backend**
```bash
cd backend
npm install
npm run start:dev
```

3. **Start the Frontend**
```bash
cd frontend
npm install
npm run dev
```

## AI Requirements

The backend assumes access to an Ollama instance. If running via `docker-compose`, the backend expects Ollama to be available on your host machine at `http://host.docker.internal:11434`. 

Ensure you have pulled the required model:
```bash
ollama pull qwen3:4b
```

## Continuous Integration

This repository includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that automatically runs the backend test suite (verifying deterministic pricing and security logic) and attempts a production build for both the frontend and backend on every Pull Request.
