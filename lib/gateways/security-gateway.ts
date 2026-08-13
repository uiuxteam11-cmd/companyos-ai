import { detectPii } from "@/lib/security/pii-detector";
import { detectSecrets } from "@/lib/security/secret-detector";
import { redactSensitiveContent } from "@/lib/security/pii-redactor";
import { hasAgentPermission, type AgentPermission } from "@/lib/security/permissions";
import { evaluateActionRisk, type ActionRisk, type PolicyDecision } from "@/lib/security/policy-engine";

export type SecurityGatewayInput = { action: string; content?: string; grantedPermissions: AgentPermission[]; requiredPermission?: AgentPermission; riskOverride?: ActionRisk };
export type SecurityGatewayDecision = { allowed: boolean; policy: PolicyDecision; piiCount: number; secretCount: number; redactedContent?: string; reason?: string };

/** Mandatory pre-execution boundary. It assesses permission, risk, and PII but never executes tools. */
export function evaluateSecurityGateway(input: SecurityGatewayInput): SecurityGatewayDecision {
  const piiMatches = input.content ? detectPii(input.content) : [];
  const secretMatches = input.content ? detectSecrets(input.content) : [];
  const evaluatedPolicy = evaluateActionRisk(input.action);
  const policy: PolicyDecision = input.riskOverride ? {
    risk: input.riskOverride,
    requiresApproval: input.riskOverride === "high" || input.riskOverride === "critical" || evaluatedPolicy.requiresApproval,
    reason: input.riskOverride === "high" || input.riskOverride === "critical" ? `This tool is classified as ${input.riskOverride} risk and requires human approval.` : evaluatedPolicy.reason,
  } : evaluatedPolicy;
  const allowed = !input.requiredPermission || hasAgentPermission(input.grantedPermissions, input.requiredPermission);
  return { allowed, policy, piiCount: piiMatches.length, secretCount: secretMatches.length, redactedContent: input.content ? redactSensitiveContent(input.content) : undefined, reason: allowed ? undefined : `Agent lacks the ${input.requiredPermission} permission.` };
}
