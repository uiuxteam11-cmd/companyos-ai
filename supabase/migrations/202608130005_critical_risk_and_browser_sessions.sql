-- Critical-risk policy and browser-session ownership hardening.

alter table public.tool_calls drop constraint if exists tool_calls_risk_level_check;
alter table public.tool_calls add constraint tool_calls_risk_level_check check (risk_level in ('low', 'medium', 'high', 'critical'));
alter table public.approvals drop constraint if exists approvals_risk_level_check;
alter table public.approvals add constraint approvals_risk_level_check check (risk_level in ('low', 'medium', 'high', 'critical'));

alter table public.browser_sessions
  add constraint browser_sessions_workspace_agent_task_run_unique unique (workspace_id, agent_id, task_id, run_id);
