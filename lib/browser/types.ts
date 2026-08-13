export type BrowserAction =
  | { type: "navigate"; url: string }
  | { type: "click"; selector: string }
  | { type: "type"; selector: string; text: string }
  | { type: "scroll"; direction: "up" | "down" }
  | { type: "select"; selector: string; value: string }
  | { type: "wait"; milliseconds: number }
  | { type: "extract"; selector?: string }
  | { type: "screenshot" };

export type BrowserInteractiveElement = { selector: string; role?: string; label?: string; disabled?: boolean };
export type BrowserObservation = { url: string; title: string; text: string; screenshotUrl?: string; interactiveElements?: BrowserInteractiveElement[]; observedAt: string };
export type BrowserSnapshot = BrowserObservation;
export type BrowserSessionLimits = { maxActions: number; maxDurationMs: number; actionTimeoutMs: number };
export type BrowserSessionMetadata = { sessionId: string; workspaceId: string; agentId: string; taskId: string; runId: string; provider: string; createdAt: string; actionsTaken: number; humanControl: boolean; limits: BrowserSessionLimits };
