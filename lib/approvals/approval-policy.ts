import type { ActionRisk } from "@/lib/security/policy-engine";

export function requiresApproval(risk: ActionRisk, workspaceAllowsAutonomy = false): boolean {
  return risk === "high" && !workspaceAllowsAutonomy;
}
