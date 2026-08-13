export type SessionParticipantRole = "observer" | "controller" | "approver" | "owner";

export type SessionParticipant = {
  userId: string;
  workspaceId: string;
  role: SessionParticipantRole;
  joinedAt: string;
};

export type SessionState = {
  workspaceId: string;
  runId: string;
  participants: SessionParticipant[];
  createdAt: string;
};

export class ExecutionSessionRegistry {
  private sessions = new Map<string, SessionState>();

  createSession(workspaceId: string, runId: string) {
    const state: SessionState = {
      workspaceId,
      runId,
      participants: [],
      createdAt: new Date().toISOString(),
    };
    this.sessions.set(runId, state);
    return state;
  }

  addParticipant(runId: string, participant: SessionParticipant) {
    const state = this.sessions.get(runId);
    if (!state) return undefined;
    state.participants.push(participant);
    return state;
  }

  listParticipants(runId: string) {
    return this.sessions.get(runId)?.participants ?? [];
  }
}

export const executionSessionRegistry = new ExecutionSessionRegistry();
