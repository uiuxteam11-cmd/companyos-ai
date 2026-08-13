import { evaluateActionRisk } from "@/lib/security/policy-engine";

export function requiresHumanApproval(action: string) {
  return evaluateActionRisk(action).requiresApproval;
}
