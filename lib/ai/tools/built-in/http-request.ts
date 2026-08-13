import { z } from "zod";
import { validateExternalUrl } from "@/lib/browser/url-policy";
import type { ToolDefinition } from "../tool-types";

const schema = z.object({ url: z.string().url(), method: z.literal("GET").default("GET") });

function isAllowedHost(hostname: string) {
  const raw = process.env.COMPANYOS_HTTP_ALLOWED_HOSTS ?? "";
  const allowed = raw.split(",").map((host) => host.trim().toLowerCase()).filter(Boolean);
  return allowed.some((host) => hostname === host || hostname.endsWith(`.${host}`));
}

export const httpRequestTool: ToolDefinition = {
  id: "http_request",
  name: "http_request",
  description: "Perform a server-side GET request to an explicitly configured external host allowlist.",
  permission: "TOOL_EXTERNAL",
  riskLevel: "medium",
  inputSchema: schema,
  timeoutMs: 8_000,
  execute: async (input) => {
    const { url } = schema.parse(input);
    const target = validateExternalUrl(url);
    if (!isAllowedHost(target.hostname)) throw new Error("HTTP host is not configured in COMPANYOS_HTTP_ALLOWED_HOSTS.");
    const response = await fetch(target, { method: "GET", redirect: "error", headers: { Accept: "application/json, text/plain;q=0.9" } });
    const text = await response.text();
    return { url: target.toString(), status: response.status, ok: response.ok, contentType: response.headers.get("content-type"), body: text.slice(0, 50_000) };
  },
};
