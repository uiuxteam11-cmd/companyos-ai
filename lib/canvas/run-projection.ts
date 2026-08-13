import type { AgentEvent, AgentRun, AgentToolCall, BrowserSession } from "@/types/agent";
import type { CanvasEdge, CanvasNode } from "@/lib/canvas/types";

function nodeStatus(status: AgentRun["status"] | AgentToolCall["status"]): CanvasNode["status"] {
  if (status === "failed" || status === "blocked" || status === "waiting_approval") return "blocked";
  if (status === "completed") return "completed";
  return status === "running" ? "running" : "queued";
}

/** Projects persisted execution data into canvas nodes. No node exists without a real run, event, or tool call. */
export function projectRunToCanvas(run: AgentRun, events: AgentEvent[], toolCalls: AgentToolCall[], browserSessions: BrowserSession[] = []) {
  const taskNode: CanvasNode = { id: `task:${run.task_id}`, kind: "task", label: "Agent task", status: nodeStatus(run.status), data: { runId: run.id, createdAt: run.created_at } };
  const agentNode: CanvasNode = { id: `agent:${run.agent_id}`, kind: "agent", label: "AI employee", status: nodeStatus(run.status), data: { currentStep: run.current_step } };
  const nodes: CanvasNode[] = [taskNode, agentNode];
  const edges: CanvasEdge[] = [{ id: `${taskNode.id}->${agentNode.id}`, source: taskNode.id, target: agentNode.id, kind: "triggered" }];
  let previousId = agentNode.id;

  for (const toolCall of toolCalls) {
    const node: CanvasNode = { id: `tool:${toolCall.id}`, kind: "tool", label: toolCall.tool_name, status: nodeStatus(toolCall.status), data: { risk: toolCall.risk_level, result: toolCall.output, error: toolCall.error_message, createdAt: toolCall.created_at } };
    nodes.push(node);
    edges.push({ id: `${previousId}->${node.id}`, source: previousId, target: node.id, kind: toolCall.status === "failed" ? "failed" : "executing" });
    previousId = node.id;
  }

  for (const session of browserSessions) {
    const status: CanvasNode["status"] = session.status === "failed" ? "blocked" : session.status === "closed" ? "completed" : session.status === "active" || session.status === "human_control" ? "running" : "queued";
    const node: CanvasNode = { id: `browser:${session.id}`, kind: "browser", label: session.current_url ?? "Browser session", status, data: { provider: session.provider, sessionStatus: session.status, createdAt: session.created_at } };
    nodes.push(node);
    edges.push({ id: `${previousId}->${node.id}`, source: previousId, target: node.id, kind: session.status === "failed" ? "failed" : "executing" });
    previousId = node.id;
  }

  const approvalEvent = events.find((event) => event.event_type === "APPROVAL_REQUESTED");
  if (approvalEvent) {
    const node: CanvasNode = { id: `approval:${approvalEvent.id}`, kind: "approval", label: "Human approval", status: "blocked", data: { createdAt: approvalEvent.created_at, message: approvalEvent.message, ...approvalEvent.payload } };
    nodes.push(node);
    edges.push({ id: `${previousId}->${node.id}`, source: previousId, target: node.id, kind: "waiting_for" });
  }
  if (run.status === "completed") {
    const resultNode: CanvasNode = { id: `result:${run.id}`, kind: "result", label: "Verified result", status: "completed", data: { output: run.output, completedAt: run.completed_at } };
    nodes.push(resultNode);
    edges.push({ id: `${previousId}->${resultNode.id}`, source: previousId, target: resultNode.id, kind: "verified" });
  }
  return { nodes, edges };
}
