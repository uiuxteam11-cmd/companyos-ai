// lib/memory/company-memory.ts

export interface CompanyMemory {
  companyName: string;
  industry: string;
  targetAudience: string;
  toneOfVoice: string;
  coreProduct: string;
}

// In Phase 14, this will fetch from Supabase based on workspaceId.
// For MVP, we return a static company profile.
export async function getCompanyMemory(_workspaceId: string): Promise<CompanyMemory> {
  return {
    companyName: 'CompanyOS AI',
    industry: 'B2B SaaS / AI Workforce',
    targetAudience: 'Indian SMEs, IT Managers, and Operations Directors',
    toneOfVoice: 'Professional, concise, enterprise-grade, empathetic to security concerns',
    coreProduct: 'A secure, collaborative AI workspace with autonomous AI employees and PII masking.',
  };
}

// Formats the memory into a string for the LLM system prompt
export async function getFormattedMemory(workspaceId: string): Promise<string> {
  const memory = await getCompanyMemory(workspaceId);
  return `
    COMPANY CONTEXT (MEMORY):
    - Company Name: ${memory.companyName}
    - Industry: ${memory.industry}
    - Target Audience: ${memory.targetAudience}
    - Tone of Voice: ${memory.toneOfVoice}
    - Core Product: ${memory.coreProduct}

    IMPORTANT INSTRUCTION:
    You are operating on behalf of ${memory.companyName}. Ensure all outputs, emails, and research are aligned with this company context and tone.
  `;
}