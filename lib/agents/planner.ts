import type { AgentPlan, CanonicalAgentTask } from "@/lib/agents/types";

/**
 * MVP deterministic planner. It only plans allowlisted internal tools and
 * never claims external research, browser actions, or CRM updates occurred.
 */
export function planTask(task: CanonicalAgentTask): AgentPlan {
  const goal = task.instruction.trim();
  const calculatorExpression = goal.match(/^calculate\s+(.+)$/i)?.[1];
  if (calculatorExpression) {
    return { taskId: task.id, steps: [{ sequence: 1, toolId: "calculator", input: { expression: calculatorExpression }, rationale: "The task is a bounded arithmetic request." }] };
  }
  return { taskId: task.id, steps: [{ sequence: 1, toolId: "workspace_search", input: { query: goal, limit: 10 }, rationale: "Search workspace information before any external action is considered." }] };
}
