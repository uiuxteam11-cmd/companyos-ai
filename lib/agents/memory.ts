export type MemoryEntry = { key: string; value: string; updatedAt: string };

export class AgentMemory {
  private entries = new Map<string, MemoryEntry>();

  remember(key: string, value: string) { this.entries.set(key, { key, value, updatedAt: new Date().toISOString() }); }
  recall(key: string) { return this.entries.get(key); }
}
