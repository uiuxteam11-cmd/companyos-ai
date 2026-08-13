export type AgentPermission = "browser:read" | "browser:act" | "api:read" | "api:write" | "saas:read" | "saas:write" | "workflow:run";

export function hasAgentPermission(granted: AgentPermission[], required: AgentPermission): boolean {
  return granted.includes(required);
}
