# CompanyOS AI

CompanyOS AI is an enterprise AI workforce platform for creating, running, monitoring, and governing AI agents.

The MVP focuses on:

- AI agent identity, roles, tools, memory, and execution state
- human-in-the-loop approvals for sensitive actions
- browser and page-reading infrastructure with safe failure modes
- AI visibility / SEO analysis for brand intelligence
- collaborative multiplayer observability through Liveblocks when configured
- security controls for PII redaction, policy checks, and auditability

## What the product does

- Lets teams launch AI agents for research, operations, marketing, finance, legal, and sales work
- Surfaces execution status, run history, approvals, and audit events
- Supports a browser-task abstraction for controlled navigation and page reading
- Provides an AI visibility scan that compares a brand against a competitor and returns actionable recommendations
- Offers a shared command-canvas experience for live collaboration when Liveblocks credentials are available

## Architecture overview

- `app/` contains the Next.js App Router UI and API routes
- `lib/agents/` contains agent definitions, planning, execution state, and approval helpers
- `lib/browser/` contains browser runtime contracts and guarded navigation helpers
- `lib/memory/` contains company memory helpers and retrieval formatting
- `lib/security/` contains PII masking and policy checks
- `lib/tools/` exposes the governed tool registry used by the agent runtime
- `lib/workflows/` contains workflow execution and scheduling foundations
- `supabase/migrations/` contains the database schema used by the runtime

## Key routes

- `/api/agent` plans and executes a lightweight agent task
- `/api/approve` resolves pending approval requests
- `/api/chat` streams chat responses with PII masking
- `/api/cron/daily-research` runs a scheduled research job
- `/api/seo` returns structured AI visibility analysis

## Setup

1. Install dependencies:

   `npm install`

2. Copy `.env.example` to `.env.local` and fill in the required values.

3. Start the dev server:

   `npm run dev`

## Validation

- `npm run lint`
- `npm run build`
- `npm test`

## Environment variables

### Required for production

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`

### Required for scheduled cron use

- `CRON_SECRET`

### Required only for browser / collaboration / optional integrations

- `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WEB_SEARCH_ENDPOINT`
- `WEB_SEARCH_API_KEY`
- `COMPANYOS_HTTP_ALLOWED_HOSTS`
- `COMPANYOS_DAILY_RESEARCH_WORKSPACE_ID`

### Optional provider settings

- `GEMINI_MODEL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_BASE_URL`
- `GEMINI_BASE_URL`
- `RATE_LIMIT_PROVIDER`
- `QUEUE_PROVIDER`
- `OBSERVABILITY_PROVIDER`
- `BILLING_PROVIDER`
- `SSO_PROVIDER`

## Deployment to Vercel

- Connect the repository to Vercel
- Add the required environment variables in the Vercel project settings
- Use the default build command: `npm run build`
- Use the default start command: `npm run start`
- Configure the cron secret for `/api/cron/daily-research`

## Optional integrations

- Supabase for persistence, auth, and realtime state
- Liveblocks for multiplayer presence and collaboration
- Gemini for chat, SEO, and research generation
- OpenAI for alternate model routing
- Web search endpoint for external search tooling

## Current MVP limitations

- Browser automation is represented through the guarded browser abstraction and may need a concrete provider to execute real page actions.
- Company memory currently returns a structured in-memory fallback when persistence is not connected.
- Approval resolution is in-memory for the MVP and does not yet survive process restarts.
- The cron research route requires a valid secret and Gemini key before it can run.
