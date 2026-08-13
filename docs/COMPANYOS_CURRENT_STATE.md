# CompanyOS AI current state

Audit date: 2026-08-13. Scope: repository source, API routes, Supabase migrations, UI, runtime, security, browser, memory, workflow, and test/build configuration. This document describes repository evidence only; it does not confirm that migrations or Supabase Realtime are enabled in a deployed environment.

## Classification legend

- **REAL** — implemented with a concrete backend/provider and used by the product path.
- **PARTIAL** — implemented, but incomplete, unsafe for production, or not fully connected.
- **MOCK** — deterministic/sample/in-memory behaviour that must not represent business execution.
- **CONTRACT_ONLY** — types, interfaces, or schema exist without a production implementation.
- **MISSING** — no implementation was found.
- **BROKEN** — implementation violates the master specification or a security/control invariant.

## Capability inventory

| Capability | State | Evidence and audit conclusion |
| --- | --- | --- |
| Next.js, React, TypeScript, Tailwind foundation | REAL | Next.js 16 production build completes successfully. |
| Supabase authentication/session refresh | REAL | Server, browser, and proxy helpers use Supabase SSR and protect dashboard routes. |
| Workspace data model | REAL | `profiles`, `workspaces`, and `workspace_members` migrations exist with RLS policies. |
| Workspace isolation | PARTIAL | Most routes derive a workspace from the authenticated session and RLS scopes queries. `getCurrentWorkspaceContext` selects the first membership with no active-workspace selection; service-level role checks are therefore not a complete multi-workspace authorization model. |
| RLS schema foundations | REAL | Migrations enable RLS and add workspace predicates for runtime, memory, workflows, usage, browser sessions, and canvas layouts. Deployment/application status is unverified. |
| Agent, task, run, step, tool-call entities | REAL | Persisted tables, indexes, types, and scoped service queries exist. |
| Canonical run state machine | PARTIAL | `lib/agents/state-machine.ts` declares valid transitions and `agent-runtime.ts` conditionally updates statuses. Generic `updateAgentRun` still accepts arbitrary status changes and is used by orchestration. |
| Agent orchestrator | PARTIAL | Persists plan, first step, tool call, result, and events. It only executes `plan.steps[0]` within an HTTP request and does not continue a multi-step run. |
| Planner | MOCK | Deterministic planner returns calculator only for a text heuristic, otherwise synthetic `workspace_search`; it does not reason with a configured model or real knowledge. |
| Executor/verifier | PARTIAL | Tool execution and basic result verification run; no durable next-step/recovery loop exists. |
| Execution limits | PARTIAL | Database limits and pre-step/pre-tool checks exist. No queue worker owns duration, retry, cost, or browser-action enforcement across a long-lived run. |
| Model providers | PARTIAL | Gemini and OpenAI HTTP providers are concrete server-side adapters. Provider calls have no timeout/retry/circuit-breaker instrumentation and no integration test. |
| Model routing | MOCK | Default routing selects the mock provider; fallback returns a mock model name. `model-gateway` is not the single path used by runtime execution. |
| Controlled tool registry | PARTIAL | Zod validation, role checks, timeouts, redaction, and an allowlist exist. Only calculator is fully local/real; HTTP and web search depend on server-only configuration. |
| Workspace search | MOCK | Explicitly returns synthetic development-only results. |
| HTTP request and web search | PARTIAL | HTTP is GET-only and host-allowlisted; web search is provider-gated. Neither provides an end-to-end production integration or usage/audit wiring. |
| SaaS, CRM, email, calendar, documents | MISSING | No production adapters were found. |
| PII and secret detection/redaction | PARTIAL | PAN, Aadhaar, Indian phone, email, credit-card-like strings, and several secret patterns are detected and redacted. Coverage, false-positive handling, encryption, and structured redaction policy are incomplete. |
| Policy and permission checks | PARTIAL | Risk tiers and agent permission checks exist. Workspace-configured policies, agent-specific permission persistence, and policy evaluation for all actions do not. |
| Approval persistence | REAL | Approval records, approve/reject routes, server-side decision logic, and events are persisted. |
| Approval enforcement | BROKEN | The control route permits a member to call `resume` from `waiting_approval`, bypassing approval. It also permits client-triggered `complete` and `fail`, allowing false completion/failure claims. |
| Human takeover | PARTIAL | Persisted control-session records and pause/take-over endpoints exist. No connected browser provider allows actual human browser control. |
| Browser runtime | CONTRACT_ONLY | Provider/controller contracts, URL filtering, and guarded observe/action logic exist; no browser provider is connected. Session manager is process-local. |
| Browser session persistence | PARTIAL | Table and projected nodes exist, but provider/session lifecycle is not connected to persisted records. |
| Memory persistence | PARTIAL | Workspace-scoped company, department, agent, and task memory records exist with RLS. Runtime planning/execution does not retrieve or use it. |
| Memory abstractions | BROKEN | Multiple incompatible memory implementations remain: persistent service, compatibility wrappers, a contract, and two in-memory stores. |
| Workflow definition and persistence | PARTIAL | Workflow graph validation, workflow/run tables, and persisted schedule records exist. |
| Workflow execution | MISSING | No workflow executor evaluates conditions, branches, approvals, retries, or verification. |
| Scheduling | CONTRACT_ONLY | Schedules can be stored and claimed, but no durable queue/cron worker invokes claims or starts runs. |
| Realtime execution presence/events | PARTIAL | `RunExecutionCanvas` uses authenticated Supabase Realtime and presence. `AgentRunLivePanel` still polls every four seconds. Live deployment configuration is unverified. |
| Canvas | PARTIAL | Canvas nodes are projected from persisted runtime records and layout table exists. Interactive graph layout/state write path and all requested node/edge semantics are not fully connected. |
| AI employees | PARTIAL | Sales, Marketing, Research, Operations, Finance, and Legal are configurations in one `AgentDefinition` registry. Their registered tools/workflows are mostly unavailable or not executable. |
| Company intelligence | CONTRACT_ONLY | Brand visibility is a score summarizer only. No AI visibility, competitor, market, or agent-readiness data collection pipeline exists. |
| Structured execution events | PARTIAL | `agent_events`, steps, tool calls, and approvals establish a trace. Client event insertion undermines audit integrity. |
| Audit log | MISSING | `lib/audit/event-logger.ts` only creates an in-memory object; no `audit_logs` migration/table or canonical writer exists. |
| Usage and incident recording | PARTIAL | `usage_events` and `incident_events` tables plus helper functions exist, but runtime does not consistently record usage/costs/metrics. |
| Observability dashboard/alerts | MISSING | No metrics aggregation, tracing backend, alerting, or operational dashboard was found. |
| Billing, SSO, queues, backups, retention | CONTRACT_ONLY | Provider interfaces and production checklist exist; integrations do not. |
| Test coverage | PARTIAL | Five unit tests cover legacy pure approval helpers only. Runtime, RLS, authorization, tools, redaction, realtime, and workflows lack tests. |

## API and authorization assessment

All agent/workspace routes reviewed authenticate through Supabase and obtain workspace context server-side. The scoped service queries and RLS policies are a sound foundation.

Two routes violate the authoritative-control requirement:

1. `POST /api/agents/:agentId/runs/:runId/control` permits `resume` while `waiting_approval` and permits `complete` and `fail` for a member. These are execution-state decisions that must be restricted to server runtime and approval flow.
2. `POST /api/agents/:agentId/runs/:runId/events` permits a client to create arbitrary event types/messages/payloads. This makes the purported audit trail mutable by users and permits fake execution activity.

## Database assessment

Implemented schema tables include `profiles`, `workspaces`, `workspace_members`, `agents`, `agent_tasks`, `agent_runs`, `agent_events`, `agent_steps`, `tool_calls`, `approvals`, `browser_sessions`, `agent_memory`, `workflows`, `workflow_runs`, `workflow_schedules`, `usage_events`, `incident_events`, `agent_control_sessions`, and `canvas_layouts`.

`audit_logs` is absent despite the master specification. Important composite indexes for common workspace/run queries are uneven: several tables have individual workspace and run indexes, but the audit should add query-specific composite indexes after real workload measurement. RLS is declared in migrations, but this repository cannot prove the migrations have been applied to the target Supabase project.

## Build and test evidence

- `npm run lint` — passed.
- `npm run build` — passed; production compilation and TypeScript validation completed.
- `npm test` — passed: 5/5 tests. Node emitted a `MODULE_TYPELESS_PACKAGE_JSON` warning because the test file is reparsed as ESM.

