# CompanyOS AI architecture

CompanyOS is a human-controlled AI workforce platform. Its execution path is:

`Human Command + AI Workforce -> Agent Orchestrator -> Planner + Policy -> Tool Router -> Browser / APIs / Knowledge -> Security Gateway -> Model Gateway -> Execution -> Verification -> Human Approval -> Audit + Events -> Postgres / Memory / Realtime`

## Code map

- **Human control and AI workforce:** `components/agents`, `lib/agents/registry.ts`
- **Orchestration, planning, execution, verification:** `lib/agents`
- **AI employees:** `lib/agents/registry.ts` defines Sales, Marketing, Research, Operations, Finance, and Legal as reusable `AgentDefinition` configurations
- **Tools:** `lib/tools/registry.ts` is the public agent-tool boundary over the validated, role-checked `lib/ai/tools` registry
- **Browser, APIs, knowledge:** `lib/browser`, future tool implementations in `lib/tools`
- **Security gateway:** `lib/gateways/security-gateway.ts` composes PII and secret scanning/redaction, permissions, and risk policy before an action proceeds
- **Model gateway:** `lib/gateways/model-gateway.ts` selects only registered server-side Gemini, OpenAI, or future providers
- **Human control, approval, and audit:** `lib/control`, `lib/approvals`, `lib/audit`, persisted `agent_control_sessions`, and `agent_events`
- **Memory:** `lib/memory/memory-service.ts` persists company, department, agent, and task memory behind workspace RLS, with owner, source, content, and visibility metadata
- **Workflows:** `lib/workflows/workflow-engine.ts`, `workflow-service.ts`, and `scheduler.ts` validate workflow graphs and persist runs and schedules; a durable worker claims due schedules from Postgres
- **Persistence and realtime foundations:** Supabase migrations, authenticated Supabase Realtime execution/presence channels in `RunExecutionCanvas`, `lib/collaboration`, and `lib/canvas`

Browser and collaboration modules are provider-neutral contracts. `BrowserProvider` creates workspace/agent/task/run-owned sessions; `GuardedBrowserController` enforces validated domains, action/time limits, human-control blocking, observe -> action -> observe verification, and audit events. Browser execution remains disabled until a browser automation provider is connected; no UI should report browser actions as live before then.

The run canvas is not a simulated diagram: task, agent, tool, browser, approval, and result nodes are projected from workspace-scoped records. Supabase Realtime refreshes that persisted projection for authenticated viewers, and `canvas_layouts` stores shared presentation state.

## Execution limits

Every persisted agent run has database-backed limits for steps, duration, tool calls, retries, browser actions, and cost. The orchestrator checks limits before each planned step and tool call, then pauses and emits a `RUN_LIMIT_REACHED` event rather than continuing indefinitely.
