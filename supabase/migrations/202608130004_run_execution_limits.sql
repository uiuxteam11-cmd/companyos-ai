-- Bounded agent execution. Limits are owned by the persisted run, not the client.

alter table public.agent_runs
  add column if not exists max_steps integer not null default 20 check (max_steps > 0 and max_steps <= 1000),
  add column if not exists max_duration_seconds integer not null default 900 check (max_duration_seconds > 0 and max_duration_seconds <= 86400),
  add column if not exists max_tool_calls integer not null default 50 check (max_tool_calls > 0 and max_tool_calls <= 5000),
  add column if not exists max_retries integer not null default 3 check (max_retries >= 0 and max_retries <= 20),
  add column if not exists max_browser_actions integer not null default 50 check (max_browser_actions >= 0 and max_browser_actions <= 1000),
  add column if not exists max_cost numeric not null default 5 check (max_cost >= 0),
  add column if not exists accrued_cost numeric not null default 0 check (accrued_cost >= 0),
  add column if not exists retry_count integer not null default 0 check (retry_count >= 0),
  add column if not exists browser_action_count integer not null default 0 check (browser_action_count >= 0);
