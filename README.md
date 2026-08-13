# CompanyOS AI

CompanyOS AI is a secure enterprise operating system for AI employees and AI-enabled teams. This Phase 1 foundation creates the multi-tenant platform base for authentication, workspace membership, a dashboard shell, and database security patterns that later phases can build on.

## Technology stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Supabase Auth
- Zod validation
- Vercel deployment target
- npm package manager

## Local setup

1. Install dependencies:
   npm install
2. Copy the example environment file:
   cp .env.example .env.local
3. Add your Supabase values.
4. Start the local development server:
   npm run dev

## Environment variables

Create .env.local with the following values:

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

Do not expose a service role key in the browser. Keep any privileged keys server-only.

## Supabase setup

1. Create a new Supabase project.
2. Add your project URL and anon key to .env.local.
3. Run the migration under supabase/migrations.
4. Confirm the `auth.users` trigger and row-level security policies are active.

## Database migration instructions

From the project root:

1. Open your Supabase SQL editor.
2. Run the migration in `supabase/migrations/202608120001_initial_schema.sql`.
3. Validate that the tables and policies were created in the `public` schema.

## Development commands

- npm install
- npm run dev
- npm run build
- npm run lint
- npm start

## Architecture overview

User -> Authentication -> Workspace -> Workspace membership -> Dashboard shell -> Database foundation

## Agent runtime status

CompanyOS now has a persisted MVP agent execution loop:

`Queued task -> Planner -> Persisted step -> Security/policy-bound tool -> Verification -> Persisted result`

The current planner deliberately uses only safe, allowlisted internal tools:

- `workspace_search`
- `calculator`

`workspace_search` is currently synthetic development-only data and must not be presented as a real knowledge result. `http_request` and `web_search` are provider-gated: they fail safely until their server-only configuration is set.

Runs are persisted in Supabase and progress through `queued`, `planning`, `running`, `waiting_approval`, `paused`, `completed`, `failed`, or `cancelled`. Tool calls and agent events are recorded when the control-plane migration has been applied.

Before using agent tools, apply these migrations in order:

1. `202608120001_initial_schema.sql`
2. `202608120002_phase2_workspace_permissions.sql`
3. `202608120003_agent_runtime_foundation.sql`
4. `202608130001_agent_control_plane.sql`
5. `202608130002_human_control_and_memory.sql`
6. `202608130003_production_foundations.sql`
7. `202608130004_run_execution_limits.sql`
8. `202608130005_critical_risk_and_browser_sessions.sql`
9. `202608130006_approval_memory_workflows.sql`
10. `202608130007_realtime_canvas_state.sql`

## Current Phase 1 limitations

- Browser automation is not connected to a provider yet.
- External web search, CRM, email, calendar, and document providers are not connected yet.
- Memory is persisted with company, department, agent, and task scopes. Workflow definitions, runs, and schedules are persisted with workspace RLS; a durable queue worker is still required to execute scheduled work in production.
- Supabase Realtime now synchronizes persisted execution changes and authenticated viewer presence for each run canvas. Rich Liveblocks document editing, billing, and enterprise SSO remain future work.
- The run canvas API projects only persisted run, event, tool-call, and approval data; a collaborative canvas renderer is still pending.

## Future architecture phases

Phase 3: Real external tools behind the same permission, policy, verification, and audit boundary.
Phase 4: Browser sessions, approvals, and execution-backed canvas controls.
