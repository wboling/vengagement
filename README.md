# Vengagement

Third-party vendor risk management platform built for law firms and enterprise legal teams.

Multi-tenant · Next.js 15 · Neon PostgreSQL · Vercel

---

## Features

- **Vendor Registry** — track vendors with criticality levels, data handling flags, contract details, and contacts. Bulk CSV import supported.
- **Document Management** — upload BAAs, NDAs, MSAs, DPAs, SOC 2 reports, ISO certs, and more. Expiry tracking and manual review workflow.
- **AI Document Review** — automated analysis of legal documents via Anthropic Claude, OpenAI, or Azure OpenAI. Flags risk issues and missing clauses.
- **Questionnaire Library** — built-in SIG Lite, SIG Core, DPA, and Security Assessment templates. Visual builder for custom questionnaires. Guest (vendor) access via tokenized links — no account required.
- **Vendor Lifecycle Workflow** — new vendor request → configurable approval steps (Security Review, Legal Review, Executive Approval) → document collection → vendor creation.
- **Risk Scoring** — composite weighted risk score (0–100) based on data sensitivity, criticality, compliance posture, contractual status, and questionnaire results.
- **Reports** — generate Vendor Summary, Risk Report, Document Status, Questionnaire Status, Compliance Matrix, and Audit Package in XLSX, CSV, or PDF.
- **Exempt Vendor Support** — major cloud providers (AWS, Azure, Google) can be marked exempt with trust center references.
- **Multi-tenant** — full tenant isolation. Each organization manages its own vendors, users, and settings. Platform admin console for tenant management.
- **Configurable per Tenant** — SMTP relay, AI provider/key, notification preferences, lifecycle workflow steps, questionnaire guest access.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript)
- **Styling**: Tailwind CSS v4
- **Database**: Neon (serverless PostgreSQL) via Prisma 6
- **File Storage**: Vercel Blob
- **Auth**: Custom JWT sessions (HTTP-only cookies), bcrypt, MFA via email codes
- **AI**: Anthropic Claude, OpenAI GPT, Azure OpenAI
- **Reports**: ExcelJS (XLSX), minimal PDF generation, CSV

---

## Setup

### 1. Clone and install

```bash
git clone <repo>
cd vengagement
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in at minimum:

- `DATABASE_URL` — Neon connection string (from [console.neon.tech](https://console.neon.tech))
- `NEXT_PUBLIC_APP_URL` — `http://localhost:3000` locally; your Vercel URL in production

### 3. Initialize the database

```bash
# Push schema to Neon
npm run db:push

# Seed with demo tenant and built-in questionnaire templates
npm run db:seed
```

Seed creates:
- Tenant: **Acme Legal LLP**
- Platform Admin: `admin@acmelegal.com` / `Admin1234!`
- Company Admin: `vendor.admin@acmelegal.com` / `Admin1234!`
- 6 demo vendors (including exempt AWS and Microsoft)
- Built-in questionnaire templates (SIG Lite, SIG Core, DPA, Security Assessment)

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables (at minimum `DATABASE_URL` and `NEXT_PUBLIC_APP_URL`)
4. Deploy

For file uploads, [create a Vercel Blob store](https://vercel.com/docs/storage/vercel-blob) and add `BLOB_READ_WRITE_TOKEN`.

---

## Project Structure

```
src/
  app/
    (app)/          # Authenticated app pages
      dashboard/
      vendors/
      documents/
      questionnaires/
      lifecycle/
      reports/
      users/
      settings/
    (auth)/         # Login, password reset
    admin/          # Platform admin console
    api/            # API routes
    q/[token]/      # Public guest questionnaire
  components/
    layout/         # Sidebar, TopBar, ClientLayout
    ui/             # Card, Button, Badge, Modal, Toast
  lib/
    auth/           # Session management, auth context
    ai/             # Document review pipeline
    db/             # Prisma client
    data-questionnaires.ts  # Built-in SIG/DPA templates
    risk-calculator.ts      # Weighted risk scoring
    email.ts                # nodemailer with layered config
    utils.ts
prisma/
  schema.prisma
  seed.ts
```

---

## User Roles

| Role | Capabilities |
|------|-------------|
| `admin` | Platform-wide access, tenant management |
| `company_admin` | All tenant operations, user management, lifecycle approvals |
| `responder` | Upload documents, assign questionnaires, update vendors |
| `viewer` | Read-only access |

---

## AI Document Review

Enable in **Settings → AI Configuration**. Supports:

- **Anthropic Claude** (recommended) — set provider to `claude`, enter API key
- **OpenAI GPT** — set provider to `openai`
- **Azure OpenAI** — set provider to `azure-openai`, enter base URL

AI review is triggered when uploading a document with "Trigger AI Review" checked. The review runs asynchronously and returns: summary, key provisions, risk flags (critical/high/medium/low), missing clauses, and recommendations.
