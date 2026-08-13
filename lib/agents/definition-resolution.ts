import { getAgentDefinition } from "@/lib/agents/registry";
import type { Agent } from "@/types/agent";
import type { AgentType } from "@/lib/agents/types";

const validTypes = new Set<AgentType>(["sales", "marketing", "research", "operations", "finance", "legal"]);

/** Resolves the employee policy from persisted agent configuration. Legacy agents safely default to Research. */
export function resolveAgentDefinition(agent: Agent) {
  const configuredType = (agent.configuration as Record<string, unknown>)?.agent_type;
  const type = typeof configuredType === "string" && validTypes.has(configuredType as AgentType) ? configuredType as AgentType : "research";
  return getAgentDefinition(type);
}
