# CompanyOS AI production roadmap

This roadmap is sequenced to preserve the existing Supabase/Next.js architecture and to avoid building UI around untrusted or simulated runtime activity.

## Phase 0 — security and state-integrity remediation

Prerequisite for every external tool, browser provider, or workflow.

- Restrict `waiting_approval -> running` to the approval service after an authorized persisted decision.
- Remove client authority to complete/fail runs; retain only safe human actions (pause, cancel, take over, return control).
- Replace arbitrary client-created agent events with server-owned execution events and optional explicitly-labelled human annotations.
- Make state transition helpers the only writer for agent-run status.
- Add authorization and two-workspace RLS tests for every runtime route.

Definition of done: no client request can bypass approval, falsify completion, or write an unlabelled execution/audit event.

## Phase 1 — canonical runtime stabilization

- Choose `lib/agents/orchestrator.ts` as the only production execution entry point.
- Retire or isolate legacy mock execution, in-memory execution jobs, mock-oriented default routing, and unused competing runtime modules.
- Add an explicit active-workspace server context; never infer an arbitrary first membership.
- Create a persisted `audit_logs` table and a redacting, append-only audit writer linked to workspace, agent, task, run, step, tool call, and approval.
- Establish structured event names, correlation IDs, and redaction rules.

Definition of done: one canonical runtime, tool boundary, approval service, memory service, realtime adapter, and audit writer are documented and enforced.

## Phase 2 — durable multi-step execution worker

- Add a queue/worker provider and persisted job/lease model.
- Claim queued runs idempotently; enforce one active worker per run.
- Execute persisted plan steps in a loop: plan → policy → tool → observation → verifier → next step.
- Persist all state changes, retries, backoff, timeout, partial results, and terminal causes.
- Enforce `max_steps`, duration, tool calls, retries, browser actions, and cost in the worker.

Definition of done: one research task can survive process restarts and reliably complete multiple verified low-risk steps without depending on a browser tab or API request lifecycle.

## Phase 3 — real tool platform

- Preserve the existing schema/permission/risk/timeout/audit tool contract.
- Replace synthetic workspace search with a real workspace knowledge retrieval adapter.
- Productionize one web-search provider and one allowlisted HTTP integration.
- Add one document or CRM integration only after its verification/idempotency model is defined.
- Record tool usage, latency, costs, redacted request/response summaries, and verification outcomes.

Definition of done: tools are concrete, capability-scoped, observable, retriable, and never claim success without a verified result.

## Phase 4 — approvals and human control plane

- Render real pending approvals sourced from persisted records.
- Support authorized approve, reject, pause, cancel, and takeover decisions with immutable audit evidence.
- Resume approved work through the durable worker only.
- Implement workspace policy configuration and agent-level permissions/approval rules.

Definition of done: high and critical actions pause execution, require policy-compliant approval, and safely resume or terminate work.

## Phase 5 — browser provider integration

- Select a managed browser automation provider; do not build a browser engine.
- Persist provider session lifecycle in `browser_sessions` and enforce workspace/agent/task/run ownership.
- Add DNS/IP-aware SSRF defenses, allowlisted domains, download/upload controls, screenshots in object storage, action limits, and observe/action/verify loops.
- Wire actual browser take-over into the human-control session.

Definition of done: a single low-risk browser research workflow is observable, isolated, verifiable, and safe to interrupt.

## Phase 6 — memory and workflows

- Integrate workspace-scoped memory retrieval into planning with visibility, ownership, and source filtering.
- Implement workflow graph execution, branching, approval gates, verification, retries, and failure handling on the durable worker.
- Connect persisted schedules to a server-side cron/queue trigger; do not use a process-local scheduler.

Definition of done: a saved workflow can run manually or on schedule and produces a complete linked execution trace.

## Phase 7 — realtime canvas and employee experience

- Replace remaining polling with the Supabase Realtime adapter.
- Persist/reconcile shared canvas layout edits; render only runtime-backed task, agent, tool, browser, approval, decision, workflow, and result nodes.
- Keep Sales, Marketing, Research, Operations, Finance, and Legal as data-only `AgentDefinition` configurations over the shared runtime.

Definition of done: two authorized users can observe the same persisted run and its true status, intervene safely, and see updates in realtime.

## Phase 8 — company intelligence

- Keep intelligence ingestion, scoring, and recommendations separate from execution runtime.
- Build AI visibility, competitor intelligence, market intelligence, and agent-readiness data pipelines with provenance and refresh dates.
- Allow recommendations to create reviewed agent tasks, not direct autonomous external actions.

Definition of done: intelligence produces traceable recommendations that can be deliberately assigned to governed employees.

## Phase 9 — enterprise hardening

- Distributed rate limiting, queue monitoring, metrics/traces/logging, alerting, backups, retention, incident runbooks, and security testing.
- Usage metering and billing integration.
- SSO, enterprise role model, secret management, encryption strategy, and tenant-isolation load tests.
- Production deployment gates: migration verification, RLS test suite, tool/provider checks, recovery drills, and load testing.

Definition of done: the platform has operational ownership, measurable reliability/security objectives, and no critical mocked or process-local production paths.

## Immediate next action

Start with **Phase 0**. The approval-resume bypass and client-authored execution events are more urgent than adding browser, workflow, or intelligence features.

