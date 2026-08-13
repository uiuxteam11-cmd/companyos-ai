import type { BrowserController } from "@/lib/browser/browser-controller";
import { assessBrowserAction } from "@/lib/browser/action-engine";
import type { BrowserAction, BrowserSessionMetadata, BrowserSnapshot } from "@/lib/browser/types";
import { createAgentEvent } from "@/lib/workspace/agent-service";

function withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([operation, new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Browser action timed out.")), timeoutMs))]);
}

/** Enforces observe -> validated action -> observe; no provider action is trusted without a fresh snapshot. */
export class GuardedBrowserController {
  constructor(private readonly controller: BrowserController, private readonly session: BrowserSessionMetadata) {}

  async observe(): Promise<BrowserSnapshot> {
    const observation = await withTimeout(this.controller.observe(), this.session.limits.actionTimeoutMs);
    await createAgentEvent(this.session.workspaceId, { agent_id: this.session.agentId, task_id: this.session.taskId, run_id: this.session.runId, event_type: "BROWSER_OBSERVED", message: "Browser page state observed.", payload: { sessionId: this.session.sessionId, url: observation.url } });
    return observation;
  }

  async act(action: BrowserAction): Promise<{ before: BrowserSnapshot; after: BrowserSnapshot }> {
    if (this.session.humanControl) throw new Error("Agent browser actions are blocked while human control is active.");
    if (this.session.actionsTaken >= this.session.limits.maxActions) throw new Error("Browser session action limit reached.");
    if (Date.now() - new Date(this.session.createdAt).getTime() > this.session.limits.maxDurationMs) throw new Error("Browser session duration limit reached.");
    const assessment = assessBrowserAction(action);
    if (assessment.requiresApproval) throw new Error("Browser action requires approval before execution.");
    const before = await this.observe();
    await createAgentEvent(this.session.workspaceId, { agent_id: this.session.agentId, task_id: this.session.taskId, run_id: this.session.runId, event_type: "BROWSER_ACTION_STARTED", message: `Browser action: ${action.type}.`, payload: { sessionId: this.session.sessionId, action: action.type } });
    await withTimeout(this.controller.act(action), this.session.limits.actionTimeoutMs);
    const after = await this.observe();
    this.session.actionsTaken += 1;
    await createAgentEvent(this.session.workspaceId, { agent_id: this.session.agentId, task_id: this.session.taskId, run_id: this.session.runId, event_type: "BROWSER_ACTION_COMPLETED", message: `Browser action completed: ${action.type}.`, payload: { sessionId: this.session.sessionId, action: action.type, url: after.url } });
    return { before, after };
  }
}
