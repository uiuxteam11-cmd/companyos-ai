export type ActionRisk = "low" | "medium" | "high" | "critical";

export type PolicyDecision = {
  risk: ActionRisk;
  requiresApproval: boolean;
  reason: string;
};

const criticalRiskActions = ["delete_record", "transfer_money", "change_permissions", "production_deploy"];
const highRiskActions = ["send_email", "modify_crm", "upload_external_file", "sign_contract"];
const mediumRiskActions = ["update_crm", "create_record", "generate_document", "create_document", "upload_file"];

export function evaluateActionRisk(action: string): PolicyDecision {
  if (criticalRiskActions.includes(action)) return { risk: "critical", requiresApproval: true, reason: "This action is critical and must be explicitly approved by an authorized human." };
  if (highRiskActions.includes(action)) return { risk: "high", requiresApproval: true, reason: "This action has an external or irreversible impact." };
  if (mediumRiskActions.includes(action)) return { risk: "medium", requiresApproval: false, reason: "This action is logged and subject to workspace policy." };
  return { risk: "low", requiresApproval: false, reason: "Read-only or reversible action." };
}

import type { AgentTool } from "@/lib/agents/types";

export interface SecurityPolicyResult {
  allowed: boolean;
  risk: ActionRisk;
  reason: string;
  requiresApproval: boolean;
}

function evaluateRiskFromTool(tool: Pick<AgentTool, "name" | "riskLevel">): PolicyDecision {
  const mappedDecision = evaluateActionRisk(tool.name);
  const toolRisk = tool.riskLevel ?? mappedDecision.risk;

  if (toolRisk === "critical") {
    return {
      risk: "critical",
      requiresApproval: true,
      reason: "This action is critical and must be explicitly approved by an authorized human.",
    };
  }

  if (toolRisk === "high") {
    return {
      risk: "high",
      requiresApproval: true,
      reason: "This action has an external or irreversible impact.",
    };
  }

  if (toolRisk === "medium") {
    return {
      risk: "medium",
      requiresApproval: false,
      reason: "This action is logged and subject to workspace policy.",
    };
  }

  return mappedDecision;
}

export function evaluateAction(tool: Pick<AgentTool, "name" | "riskLevel">, input: unknown): SecurityPolicyResult {
  void input;
  const decision = evaluateRiskFromTool(tool);
  return {
    allowed: true,
    risk: decision.risk,
    reason: decision.reason,
    requiresApproval: decision.requiresApproval,
  };
}
