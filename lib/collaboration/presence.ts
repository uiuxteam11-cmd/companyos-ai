export type CollaboratorPresence = { userId: string; name: string; cursor?: { x: number; y: number }; activeAgentId?: string };

// Adapter contract for Liveblocks or another realtime provider.
export interface PresenceProvider {
  publish(workspaceId: string, presence: CollaboratorPresence): Promise<void>;
  list(workspaceId: string): Promise<CollaboratorPresence[]>;
}
