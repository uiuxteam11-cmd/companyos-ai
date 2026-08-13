export type PiiMatch = {
  kind: "email" | "phone" | "pan" | "aadhaar" | "credit_card";
  value: string;
  start: number;
  end: number;
};

const patterns: Array<{ kind: PiiMatch["kind"]; expression: RegExp }> = [
  { kind: "email", expression: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g },
  { kind: "phone", expression: /\b(?:\+91[\s-]?)?[6-9]\d{9}\b/g },
  { kind: "pan", expression: /\b[A-Z]{5}\d{4}[A-Z]\b/g },
  { kind: "aadhaar", expression: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g },
  { kind: "credit_card", expression: /\b(?:\d[ -]*?){13,19}\b/g },
];

export function detectPii(content: string): PiiMatch[] {
  return patterns.flatMap(({ kind, expression }) => Array.from(content.matchAll(expression), (match) => ({
    kind,
    value: match[0],
    start: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length,
  })));
}

export function redactPii(content: string): string {
  return detectPii(content).reduceRight((redacted, match) => `${redacted.slice(0, match.start)}[${match.kind.toUpperCase()} REDACTED]${redacted.slice(match.end)}`, content);
}
