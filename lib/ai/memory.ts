export type MemoryCategory = "SHORT_TERM" | "TASK" | "WORKSPACE" | "LONG_TERM";

export type MemoryEntry = {
  id: string;
  category: MemoryCategory;
  workspaceId: string;
  agentId?: string | null;
  taskId?: string | null;
  runId?: string | null;
  key: string;
  value: unknown;
  createdAt: string;
};

export class MemoryStore {
  private entries = new Map<string, MemoryEntry>();

  store(entry: Omit<MemoryEntry, "id" | "createdAt">) {
    const id = `${entry.category}:${entry.workspaceId}:${entry.key}:${entry.agentId ?? "na"}:${entry.taskId ?? "na"}:${entry.runId ?? "na"}`;
    const memoryEntry: MemoryEntry = {
      ...entry,
      id,
      createdAt: new Date().toISOString(),
    };
    this.entries.set(id, memoryEntry);
    return memoryEntry;
  }

  getByWorkspace(workspaceId: string, category?: MemoryCategory) {
    return Array.from(this.entries.values()).filter((entry) => {
      const matchesWorkspace = entry.workspaceId === workspaceId;
      if (!category) return matchesWorkspace;
      return matchesWorkspace && entry.category === category;
    });
  }

  list(): MemoryEntry[] {
    return Array.from(this.entries.values());
  }
}

export const memoryStore = new MemoryStore();
