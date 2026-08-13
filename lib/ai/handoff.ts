export type AgentHandoff = {
  sourceAgentId: string;
  destinationAgentId: string;
  reason: string;
  context: Record<string, unknown>;
  workspaceId: string;
  taskId?: string | null;
  runId?: string | null;
  requestedBy?: string | null;
  authorizedAt?: string | null;
};

export function createAgentHandoff(input: Omit<AgentHandoff, "authorizedAt">): AgentHandoff {
  return {
    ...input,
    authorizedAt: new Date().toISOString(),
  };
}
