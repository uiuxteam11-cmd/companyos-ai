import { remember, type CompanyMemoryScope, type MemoryVisibility } from "@/lib/memory/memory-service";

export type PersistentMemoryScope = CompanyMemoryScope;
export type WriteMemoryInput = {
  workspaceId: string;
  scope: PersistentMemoryScope;
  key: string;
  value: Record<string, unknown>;
  createdBy: string;
  departmentKey?: string;
  agentId?: string | null;
  taskId?: string | null;
  source?: string;
  visibility?: MemoryVisibility;
};

/** @deprecated Use remember from memory-service for new runtime code. */
export function writeMemory(input: WriteMemoryInput) {
  return remember({
    workspaceId: input.workspaceId,
    scope: input.scope,
    key: input.key,
    content: input.value,
    userId: input.createdBy,
    departmentKey: input.departmentKey,
    agentId: input.agentId ?? undefined,
    taskId: input.taskId ?? undefined,
    source: input.source,
    visibility: input.visibility,
  });
}
