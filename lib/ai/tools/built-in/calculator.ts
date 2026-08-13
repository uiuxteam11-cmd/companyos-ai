import { z } from "zod";
import type { ToolDefinition } from "../tool-types";

const calculatorInputSchema = z.object({
  expression: z.string().min(1).max(200),
});

function safeEvaluateExpression(expression: string): number {
  const sanitized = expression.replace(/\s+/g, "");
  if (!/^[0-9+\-*/().]+$/.test(sanitized)) {
    throw new Error("Unsupported calculator input.");
  }

  // Simple arithmetic validation without arbitrary code execution.
  const result = Function(`"use strict"; return (${sanitized});`)();
  if (typeof result !== "number" || !Number.isFinite(result)) {
    throw new Error("Calculator produced an invalid result.");
  }

  return result;
}

export const calculatorTool: ToolDefinition = {
  id: "calculator",
  name: "calculator",
  description: "Safely evaluate a simple mathematical expression.",
  permission: "TOOL_READ",
  riskLevel: "low",
  inputSchema: calculatorInputSchema,
  timeoutMs: 2000,
  execute: async (input) => {
    const parsed = calculatorInputSchema.parse(input);
    const result = safeEvaluateExpression(parsed.expression);
    return { expression: parsed.expression, result };
  },
};
