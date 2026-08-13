import type { BrowserController } from "@/lib/browser/browser-controller";
import type { BrowserSessionLimits, BrowserSessionMetadata } from "@/lib/browser/types";

export type BrowserSessionRequest = { workspaceId: string; agentId: string; taskId: string; runId: string; limits: BrowserSessionLimits };

/** External browser vendors implement this contract; CompanyOS owns authorization, policy, audit, and sessions. */
export interface BrowserProvider {
  id: string;
  createSession(request: BrowserSessionRequest): Promise<{ metadata: BrowserSessionMetadata; controller: BrowserController }>;
  closeSession(sessionId: string): Promise<void>;
}
