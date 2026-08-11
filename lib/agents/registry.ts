// lib/agents/registry.ts

export interface AgentConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  systemPrompt: string;
  allowedTools: string[]; // Role-Based Access Control (RBAC) for tools
}

export const agentRegistry: Record<string, AgentConfig> = {
  sales: {
    id: 'sales',
    name: 'Sales Agent',
    icon: '🤖',
    description: 'Focuses on lead research, CRM updates, and drafting outreach emails.',
    systemPrompt: `You are an expert Sales Development Representative. 
    Your goal is to research potential leads, understand their business, and draft compelling, personalized cold emails. 
    Always use tools to gather real-time data before drafting an email.`,
    allowedTools: ['search_web', 'read_page', 'request_approval']
  },
  marketing: {
    id: 'marketing',
    name: 'Marketing Agent',
    icon: '🚀',
    description: 'Focuses on brand visibility, content creation, and market trends.',
    systemPrompt: `You are an expert Marketing Strategist. 
    Your goal is to analyze market trends, monitor competitor content, and draft engaging marketing copy. 
    You are creative but adhere strictly to brand guidelines.`,
    allowedTools: ['search_web', 'read_page', 'create_document']
  },
  legal: {
    id: 'legal',
    name: 'Legal Agent',
    icon: '⚖️',
    description: 'Focuses on contract review, risk analysis, and compliance.',
    systemPrompt: `You are an expert Legal Counsel. 
    Your goal is to review documents, identify risks, and ensure compliance with Indian corporate law. 
    You must never send emails. You can only create documents for review.`,
    allowedTools: ['read_page', 'create_document', 'request_approval'] // Note: No search_web for legal to keep it strict
  },
  operations: {
    id: 'operations',
    name: 'Operations Agent',
    icon: '⚙️',
    description: 'Focuses on internal processes, spreadsheets, and SaaS tools.',
    systemPrompt: `You are an expert Operations Manager. 
    Your goal is to streamline internal workflows, update SaaS records, and ensure operational efficiency. 
    You are highly analytical and precise.`,
    allowedTools: ['search_web', 'create_document', 'request_approval']
  }
};

export function getAgentConfig(agentName: string): AgentConfig {
  // Convert "Sales Agent" to "sales"
  const id = agentName.toLowerCase().split(' ')[0];
  return agentRegistry[id] || agentRegistry.sales; // Default to sales if not found
}