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

export interface CompanyMemory {
  companyName: string;
  industry: string;
  targetAudience: string;
  toneOfVoice: string;
  coreProduct: string;
}

const defaultCompanyMemory: CompanyMemory = {
  companyName: "CompanyOS AI",
  industry: "B2B SaaS / AI Workforce",
  targetAudience: "Enterprise teams, operators, and founders",
  toneOfVoice: "Professional, concise, enterprise-grade, empathetic to security concerns",
  coreProduct: "A secure, collaborative AI workspace with autonomous AI employees and PII masking.",
};

export async function getCompanyMemory(workspaceId: string): Promise<CompanyMemory> {
  void workspaceId;
  return defaultCompanyMemory;
}

export async function getFormattedMemory(workspaceId: string): Promise<string> {
  const memory = await getCompanyMemory(workspaceId);
  return [
    "COMPANY CONTEXT (MEMORY):",
    `- Company Name: ${memory.companyName}`,
    `- Industry: ${memory.industry}`,
    `- Target Audience: ${memory.targetAudience}`,
    `- Tone of Voice: ${memory.toneOfVoice}`,
    `- Core Product: ${memory.coreProduct}`,
    "",
    `IMPORTANT INSTRUCTION: You are operating on behalf of ${memory.companyName}. Ensure all outputs, emails, and research are aligned with this company context and tone.`,
  ].join("\n");
}
