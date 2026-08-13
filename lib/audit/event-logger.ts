export type AuditEvent = {
  workspaceId: string;
  actorId: string;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export function createAuditEvent(event: Omit<AuditEvent, "createdAt">): AuditEvent {
  return { ...event, createdAt: new Date().toISOString() };
}
