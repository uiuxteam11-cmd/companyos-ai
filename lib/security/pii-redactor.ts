import { redactPii } from "@/lib/security/pii-detector";
import { redactSecrets } from "@/lib/security/secret-detector";

/** Sanitizes untrusted content before it can be included in a prompt, event, or audit payload. */
export function redactSensitiveContent(content: string): string {
  return redactSecrets(redactPii(content));
}

export function redactSensitiveValue(value: unknown): unknown {
  if (typeof value === "string") return redactSensitiveContent(value);
  if (Array.isArray(value)) return value.map(redactSensitiveValue);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, nested]) => [key, redactSensitiveValue(nested)]));
  return value;
}
