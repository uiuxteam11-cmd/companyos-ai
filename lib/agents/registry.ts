import type { AgentType } from "@/lib/agents/types";
import type { AgentPermission } from "@/lib/security/permissions";

export type MemoryScope = "company" | "department" | "agent" | "task";
export type ApprovalRule = { action: string; required: boolean; reason: string };
export type WorkflowReference = { id: string; name: string; trigger: "manual" | "schedule" | "webhook" | "event" };

/** A persona is data, not a bespoke implementation. All employees share this runtime contract. */
export type AgentDefinition = {
  type: AgentType;
  identity: { name: string; icon: string };
  role: string;
  instructions: string;
  tools: string[];
  permissions: AgentPermission[];
  memory: { scopes: MemoryScope[]; department?: string };
  policies: { allowExternalActions: boolean; maxRisk: "low" | "medium" | "high" | "critical" };
  workflows: WorkflowReference[];
  approvalRules: ApprovalRule[];
};

const manualResearch: WorkflowReference = { id: "research-brief", name: "Research brief", trigger: "manual" };

const definitions: Record<AgentType, AgentDefinition> = {
  research: { type: "research", identity: { name: "Research", icon: "🔎" }, role: "Research Analyst", instructions: "Find, compare, and report only verified public information. Escalate when external access is required.", tools: ["workspace_search", "calculator", "web_search", "http_request"], permissions: ["browser:read", "api:read"], memory: { scopes: ["company", "department", "agent", "task"], department: "strategy" }, policies: { allowExternalActions: true, maxRisk: "medium" }, workflows: [manualResearch], approvalRules: [] },
  sales: { type: "sales", identity: { name: "Sales", icon: "🤝" }, role: "Sales Development Representative", instructions: "Qualify prospects and prepare outreach for human review. Never send communication without approval.", tools: ["workspace_search", "create_task"], permissions: ["browser:read", "saas:write"], memory: { scopes: ["company", "department", "agent", "task"], department: "sales" }, policies: { allowExternalActions: false, maxRisk: "medium" }, workflows: [{ id: "prospect-qualification", name: "Prospect qualification", trigger: "manual" }], approvalRules: [{ action: "send_email", required: true, reason: "External communication requires human approval." }, { action: "update_record", required: true, reason: "CRM writes require approval." }] },
  marketing: { type: "marketing", identity: { name: "Marketing", icon: "✦" }, role: "Marketing Strategist", instructions: "Turn brand intelligence into reviewable recommendations and drafts.", tools: ["workspace_search", "create_task"], permissions: ["browser:read", "saas:write"], memory: { scopes: ["company", "department", "agent", "task"], department: "marketing" }, policies: { allowExternalActions: false, maxRisk: "medium" }, workflows: [{ id: "visibility-review", name: "AI visibility review", trigger: "schedule" }], approvalRules: [{ action: "publish_content", required: true, reason: "Publishing requires human approval." }] },
  operations: { type: "operations", identity: { name: "Operations", icon: "⚙" }, role: "Operations Coordinator", instructions: "Prepare repeatable operational work and route all system changes through policy.", tools: ["workspace_search", "calculator", "create_task"], permissions: ["saas:read", "saas:write", "workflow:run"], memory: { scopes: ["company", "department", "agent", "task"], department: "operations" }, policies: { allowExternalActions: false, maxRisk: "medium" }, workflows: [{ id: "daily-operations-check", name: "Daily operations check", trigger: "schedule" }], approvalRules: [{ action: "update_record", required: true, reason: "Operational data changes require approval." }] },
  finance: { type: "finance", identity: { name: "Finance", icon: "◈" }, role: "Finance Analyst", instructions: "Prepare analyses and controlled financial drafts. Never transfer funds or alter financial systems.", tools: ["workspace_search", "calculator"], permissions: ["saas:read"], memory: { scopes: ["company", "department", "agent", "task"], department: "finance" }, policies: { allowExternalActions: false, maxRisk: "low" }, workflows: [{ id: "finance-summary", name: "Finance summary", trigger: "manual" }], approvalRules: [{ action: "transfer_money", required: true, reason: "Financial transfers always require human approval." }] },
  legal: { type: "legal", identity: { name: "Legal", icon: "⚖" }, role: "Legal Research Assistant", instructions: "Prepare legal research and document drafts. Do not provide final legal advice or execute agreements.", tools: ["workspace_search", "create_task"], permissions: ["browser:read"], memory: { scopes: ["company", "department", "agent", "task"], department: "legal" }, policies: { allowExternalActions: false, maxRisk: "low" }, workflows: [{ id: "legal-research", name: "Legal research brief", trigger: "manual" }], approvalRules: [{ action: "sign_contract", required: true, reason: "Contract execution always requires human approval." }] },
};

export function getAgentDefinition(type: AgentType) { return definitions[type]; }
export function listAgentDefinitions() { return Object.values(definitions); }

// Backward-compatible aliases for existing callers.
export type AgentProfile = AgentDefinition;
export const getAgentProfile = getAgentDefinition;
export const listAgentProfiles = listAgentDefinitions;
