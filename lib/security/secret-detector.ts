export type SecretMatch = { kind: "api_key" | "bearer_token" | "private_key" | "connection_string" | "password"; value: string; start: number; end: number };

const patterns: Array<{ kind: SecretMatch["kind"]; expression: RegExp }> = [
  { kind: "private_key", expression: /-----BEGIN(?: [A-Z]+)? PRIVATE KEY-----[\s\S]+?-----END(?: [A-Z]+)? PRIVATE KEY-----/g },
  { kind: "connection_string", expression: /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s"']+/gi },
  { kind: "bearer_token", expression: /\bBearer\s+[A-Za-z0-9._~+/=-]{16,}\b/gi },
  { kind: "api_key", expression: /\b(?:sk|pk|AIza|xox[baprs])[-_A-Za-z0-9]{16,}\b/g },
  { kind: "password", expression: /\b(?:password|passwd|pwd)\s*[:=]\s*[^\s,;"']{8,}\b/gi },
];

export function detectSecrets(content: string): SecretMatch[] {
  return patterns.flatMap(({ kind, expression }) => Array.from(content.matchAll(expression), (match) => ({ kind, value: match[0], start: match.index ?? 0, end: (match.index ?? 0) + match[0].length })));
}

export function redactSecrets(content: string): string {
  return detectSecrets(content).reduceRight((redacted, match) => `${redacted.slice(0, match.start)}[${match.kind.toUpperCase()} REDACTED]${redacted.slice(match.end)}`, content);
}
