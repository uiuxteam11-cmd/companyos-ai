# CompanyOS AI gap analysis

## Production blockers

### P0 — approval and audit integrity are bypassable

The `control` route allows `resume` from `waiting_approval`; a workspace member can therefore continue a high-risk action without an approval decision. The same route lets a member mark a running task as `completed` or `failed`, despite the specification requiring verified server-owned state transitions. The events route additionally accepts client-authored execution events.

Impact: high-risk actions and audit evidence cannot be trusted. Do not enable external tools, browser execution, or autonomous workflows until this is corrected.

Required end state:

- Only the approval service can transition `waiting_approval -> running`.
- Only the executor/verifier can transition to `completed` or `failed`.
- Human control may only pause, cancel, take over, and return control; it must not fabricate an outcome.
- Client event creation must be removed or reduced to clearly-labelled user annotations with a restricted schema.

### P0 — no durable execution worker

The orchestrator executes one planned step in an HTTP request. There is no queue, lease/claim, idempotency key, persistent worker, retry scheduler, or state recovery. The in-memory `ExecutionJobRunner` is not eligible for production.

Impact: a restart, timeout, duplicate request, or long-running task cannot be recovered safely. The product cannot make the claim that AI employees execute business work reliably.

### P1 — agent execution is not genuinely multi-step

`orchestrateRun` persists a plan but reads only its first step and immediately marks the run completed after its first verified tool result. It cannot express observation → next decision → next tool action, branches, partial completion, or approved continuation.

### P1 — mock defaults can reach legacy execution

`workspace/ai-execution.ts` defaults to provider `mock`; `model-router.ts` defaults simple/general routing to a mock model. The active run route uses the newer orchestrator, but legacy execution code remains available and should not survive as a production path.

### P1 — audit/observability is incomplete

There is no persisted `audit_logs` table or canonical audit writer. Agent events are useful runtime history but are not a hardened audit system, are not uniformly redacted before persistence, and currently accept client insertions. Usage/incident helpers are largely unused.

### P1 — multi-tenancy needs an explicit workspace selection model

The current context function selects the first membership for a user. A user in multiple workspaces has no active-workspace claim, cookie, URL, or server-verified selection. RLS reduces cross-workspace exposure, but application authorization and UX are ambiguous.

### P2 — browser and business-tool execution are contracts, not capabilities

Browser interfaces, action guards, and URL filtering are good foundations, but no provider is connected. CRM, email, calendar, document, and SaaS adapters are absent. The UI must continue to avoid presenting these as active capabilities.

### P2 — workflow and scheduler execution are missing

Workflow records and a compare-and-set schedule claim exist, but no worker processes a workflow graph or invokes schedule claims. Conditions, branches, retries, approvals, and verification are data-model concepts only.

### P2 — intelligence is isolated but not implemented

The existing brand visibility utility is a pure score summary. This correctly remains separate from execution, but AI visibility, competitors, agent readiness, and market intelligence collection/analysis are absent.

## Duplicate or competing abstractions

| Domain | Competing implementations | Recommended canonical implementation | Action |
| --- | --- | --- | --- |
| Agent execution | `lib/agents/orchestrator.ts`; legacy `lib/workspace/ai-execution.ts`; `lib/agents/executor.ts` | `orchestrator` plus a future durable worker | Retire legacy direct-provider execution from production exports; keep executor only if it owns a concrete worker step. |
| Run state writes | `agent-runtime.ts` transition helpers; generic `updateAgentRun` | A single server-only transition repository backed by `state-machine.ts` | Prevent arbitrary status updates; encode actor/reason/expected state in every transition. |
| Model selection | `model-gateway.ts`; `ai/model-router.ts`; direct provider registry | `model-gateway.ts` as the sole production entry point | Make it select configured non-mock providers and log a redacted decision. |
| Tool boundary | `lib/tools/registry.ts`; `lib/ai/tools/tool-registry.ts` | `lib/tools/registry.ts` public facade, `lib/ai/tools` internal implementation | Keep the split only if all agents call the facade; otherwise consolidate names/modules. |
| Approval logic | `approvals/approval-service.ts`; `ai/approvals.ts`; `governance/approval-engine.ts` | `approvals/approval-service.ts` | Keep legacy pure helpers only as test fixtures or remove after replacing tests. |
| Memory | `memory/memory-service.ts`; `company-memory.ts`; `memory-retrieval.ts`; `memory-store.ts`; `ai/memory.ts`; `agents/memory.ts` | `memory/memory-service.ts` and a single retrieval service | Remove in-memory stores from runtime imports and treat compatibility wrappers as temporary. |
| Realtime/presence | Supabase Realtime in `RunExecutionCanvas`; `collaboration/presence.ts`; `ai/multiplayer.ts` | Supabase Realtime adapter | Replace polling in the run panel and retire process-local multiplayer registry. |
| Browser sessions | persisted `browser_sessions`; in-memory `session-manager.ts` | provider-backed persisted session service | Do not allow process-local map to be used once a provider is connected. |
| Audit events | `agent_events`; `audit/event-logger.ts` | new persisted `audit_logs` service, linked to execution records | Use events for timeline UX and audit logs for immutable governance evidence. |

## Security gaps

- RLS policies are present in migrations but need automated two-workspace integration tests against a real Supabase project.
- Tool input is redacted before the persisted tool-call record, but event payloads and provider metadata are not centrally passed through the same redaction boundary.
- Raw provider responses are stored in legacy run metadata; this risks retaining sensitive content or model-returned secrets.
- URL filtering blocks common private IPv4 forms, but it does not resolve hostnames and verify resolved addresses, block IPv6 private ranges, or enforce a browser domain policy.
- Browser action policy maps `type` and `select` to an unrelated CRM update risk. A provider integration needs action-specific policy and target-domain context.
- No encrypted secrets store, key rotation, upload validation, retention enforcement, or rate-limit provider is implemented.

## Master-specification gaps by domain

- **Execution:** durable worker, loop, recovery, idempotency, retries, and verified continuation missing.
- **Governance:** approval bypass and client-authored events must be fixed before production.
- **Tools:** production business tools missing; default model routing remains mock-oriented.
- **Browser:** no provider, persisted lifecycle, takeover, screenshot storage, or robust network isolation.
- **Memory:** persistence exists but retrieval/ranking and runtime integration missing.
- **Workflow:** no executor/worker, trigger receiver, or schedule service.
- **Canvas/realtime:** real persisted projection exists, but shared graph editing and all semantic node/edge projections are incomplete.
- **Intelligence:** separated namespace exists but no data pipeline/dashboard.
- **Production:** no queue, distributed rate limiting, metrics, billing, SSO, backups/retention automation, alerts, or load/security test suite.

