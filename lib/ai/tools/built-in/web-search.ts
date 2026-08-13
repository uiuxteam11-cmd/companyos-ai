import { z } from "zod";
import type { ToolDefinition } from "../tool-types";

const schema = z.object({ query: z.string().trim().min(1).max(300) });

/** A provider-gated search contract. It intentionally does not fabricate web results. */
export const webSearchTool: ToolDefinition = {
  id: "web_search",
  name: "web_search",
  description: "Search the web through a configured server-side search provider.",
  permission: "TOOL_EXTERNAL",
  riskLevel: "low",
  inputSchema: schema,
  timeoutMs: 8_000,
  execute: async (input) => {
    const { query } = schema.parse(input);
    const endpoint = process.env.WEB_SEARCH_ENDPOINT;
    const apiKey = process.env.WEB_SEARCH_API_KEY;
    if (!endpoint || !apiKey) throw new Error("Web search is not configured. Set WEB_SEARCH_ENDPOINT and WEB_SEARCH_API_KEY.");
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ query }) });
    if (!response.ok) throw new Error("Web search provider request failed.");
    return { provider: "configured", query, results: await response.json() };
  },
};
