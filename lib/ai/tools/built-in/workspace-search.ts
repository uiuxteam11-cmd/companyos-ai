import { z } from "zod";
import type { ToolDefinition } from "../tool-types";

const workspaceSearchSchema = z.object({
  query: z.string().min(1).max(200),
  limit: z.number().int().min(1).max(10).optional(),
});

export const workspaceSearchTool: ToolDefinition = {
  id: "workspace_search",
  name: "workspace_search",
  description: "Development-only synthetic workspace search. It is not a company knowledge search and must not be used as evidence of real-world results.",
  permission: "TOOL_READ",
  riskLevel: "low",
  inputSchema: workspaceSearchSchema,
  timeoutMs: 2000,
  execute: async (input) => {
    const parsed = workspaceSearchSchema.parse(input);
    const query = parsed.query.toLowerCase();
    return {
      query,
      results: [
        { id: "synthetic-1", title: `Synthetic result for ${query}`, match: `development-only` },
        { id: "synthetic-2", title: `Synthetic related result for ${query}`, match: `development-only` },
      ].slice(0, parsed.limit ?? 2),
      execution: "synthetic_development_only",
    };
  },
};
