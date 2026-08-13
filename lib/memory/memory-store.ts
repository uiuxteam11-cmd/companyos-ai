export type MemoryScope = "workspace" | "agent" | "task";
export type MemoryRecord = { scope: MemoryScope; ownerId: string; key: string; value: string; updatedAt: string };

export interface MemoryStore {
  get(scope: MemoryScope, ownerId: string, key: string): Promise<MemoryRecord | null>;
  set(record: MemoryRecord): Promise<void>;
}
