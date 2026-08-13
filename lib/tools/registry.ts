import { executeTool, getTool, listTools } from "@/lib/ai/tools/tool-registry";
import type { ToolExecutionContext, ToolExecutionResult } from "@/lib/ai/tools/tool-types";

// This adapter is the only tool boundary agents should use. The existing registry
// performs workspace membership, role, and input-schema checks before execution.
export function listAgentTools() { return listTools(); }
export function getAgentTool(toolId: string) { return getTool(toolId); }
export async function executeAgentTool(toolId: string, input: unknown, context: ToolExecutionContext): Promise<ToolExecutionResult> {
  return executeTool(toolId, input, context);
}
