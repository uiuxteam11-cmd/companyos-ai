import type { BrowserController } from "@/lib/browser/browser-controller";
import type { BrowserSessionMetadata } from "@/lib/browser/types";

type StoredSession = { controller: BrowserController; metadata: BrowserSessionMetadata };
const sessions = new Map<string, StoredSession>();

export function registerBrowserSession(metadata: BrowserSessionMetadata, controller: BrowserController) { sessions.set(metadata.sessionId, { controller, metadata }); }
export function getBrowserSession(sessionId: string, workspaceId: string) {
  const session = sessions.get(sessionId);
  return session?.metadata.workspaceId === workspaceId ? session : undefined;
}
export function closeBrowserSession(sessionId: string) { sessions.delete(sessionId); }
