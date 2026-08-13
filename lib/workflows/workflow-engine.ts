import type { AgentDefinition } from "@/lib/agents/registry";

export type WorkflowTrigger = "manual" | "schedule" | "webhook" | "event";
export type WorkflowStepKind = "condition" | "agent" | "tool" | "approval" | "verification";

export type WorkflowStep = {
  id: string;
  action: string;
  kind: WorkflowStepKind;
  input?: Record<string, unknown>;
  nextStepId?: string;
  onFailureStepId?: string;
  maxRetries?: number;
  timeoutMs?: number;
};

export type Workflow = {
  id: string;
  name: string;
  trigger: WorkflowTrigger;
  agentType: AgentDefinition["type"];
  steps: WorkflowStep[];
};

export function createWorkflow(name: string, trigger: WorkflowTrigger, agent: AgentDefinition, steps: WorkflowStep[]): Workflow {
  if (!name.trim()) throw new Error("A workflow name is required.");
  if (!steps.length) throw new Error("A workflow needs at least one step.");
  const stepIds = new Set<string>();
  for (const step of steps) {
    if (!step.id || !step.action || stepIds.has(step.id)) throw new Error("Workflow step IDs and actions must be unique and non-empty.");
    if (step.maxRetries !== undefined && (!Number.isInteger(step.maxRetries) || step.maxRetries < 0 || step.maxRetries > 5)) throw new Error("Workflow step retries must be between 0 and 5.");
    if (step.timeoutMs !== undefined && (!Number.isFinite(step.timeoutMs) || step.timeoutMs < 100 || step.timeoutMs > 300_000)) throw new Error("Workflow step timeout must be between 100ms and 5 minutes.");
    stepIds.add(step.id);
  }
  for (const step of steps) {
    if (step.nextStepId && !stepIds.has(step.nextStepId)) throw new Error(`Unknown next step: ${step.nextStepId}.`);
    if (step.onFailureStepId && !stepIds.has(step.onFailureStepId)) throw new Error(`Unknown failure step: ${step.onFailureStepId}.`);
  }
  return { id: crypto.randomUUID(), name, trigger, agentType: agent.type, steps };
}
