// lib/security/policy-engine.ts
import { AgentTool } from '@/lib/agents/types';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface SecurityPolicyResult {
  allowed: boolean;
  risk: RiskLevel;
  reason: string;
  requiresApproval: boolean;
}

// Evaluates a tool action before it executes
export function evaluateAction(tool: AgentTool, _input: unknown): SecurityPolicyResult {
  const risk = tool.riskLevel;

  if (risk === 'high') {
    return {
      allowed: true,
      risk: 'high',
      reason: 'High risk action detected. Approval required before execution.',
      requiresApproval: true,
    };
  }

  if (risk === 'medium') {
    return {
      allowed: true,
      risk: 'medium',
      reason: 'Medium risk action. Proceeding but logging for audit.',
      requiresApproval: false,
    };
  }

  return {
    allowed: true,
    risk: 'low',
    reason: 'Low risk action. Auto-approved.',
    requiresApproval: false,
  };
}