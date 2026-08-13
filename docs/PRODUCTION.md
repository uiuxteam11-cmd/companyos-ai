# CompanyOS production checklist

## Required managed services

- **Rate limiting:** use a distributed store such as Upstash Redis. `MemoryRateLimiter` is development-only.
- **Queues/workers:** use a durable server-side queue (for example, Vercel Queues, Inngest, Trigger.dev, or a managed cloud queue). Browser and long-running agent work must not run in a request lifecycle.
- **Billing:** connect a provider such as Stripe through `BillingProvider`; never handle card data in this application.
- **Enterprise SSO:** configure Supabase Auth SAML/OIDC or an approved identity provider via `SsoProvider`.
- **Monitoring:** export structured application, queue, browser, and model metrics to a managed observability provider; alert on failed runs, approval backlog, rate-limit spikes, and security incidents.

## Vercel deployment

1. Apply all Supabase migrations in order through `202608130007_realtime_canvas_state.sql`, then enable Supabase Realtime for the project.
2. Add production environment variables in Vercel; do not expose server secrets with `NEXT_PUBLIC_` prefixes.
3. Set a production Supabase redirect allowlist and verify RLS with two isolated test workspaces.
4. Configure a distributed rate limiter, queue worker, monitoring alerts, and backup/point-in-time recovery before enabling external tools.
5. Run `npm test`, `npm run lint`, and `npm run build` from CI before deployment.

## Retention, backups, and incidents

- Define retention periods for prompts, tool inputs, screenshots, browser sessions, audit events, and memory. Store only redacted content in operational logs.
- Enable Supabase backups/PITR and test restore procedures quarterly.
- Incident process: contain (disable affected tool/provider), preserve redacted evidence, assess workspace impact, rotate exposed secrets, notify customers when required, and document corrective action.

## Security and load testing

- Test RLS cross-workspace access, tool allowlists, SSRF protection, approval bypass attempts, secret redaction, and authorization boundaries in CI.
- Load test queue workers and tool endpoints in a non-production workspace. Establish SLOs for task latency, tool success, error rate, approval wait time, and cost per completed task before setting capacity targets.
