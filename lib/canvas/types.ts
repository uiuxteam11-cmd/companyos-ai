export type CanvasNodeKind = "agent" | "task" | "tool" | "browser" | "approval" | "result" | "decision" | "workflow";
export type CanvasNode = { id: string; kind: CanvasNodeKind; label: string; status: "queued" | "running" | "completed" | "blocked"; data?: Record<string, unknown> };
export type CanvasEdgeKind = "depends_on" | "triggered" | "executing" | "waiting_for" | "approved" | "failed" | "produced" | "verified";
export type CanvasEdge = { id: string; source: string; target: string; kind: CanvasEdgeKind };
