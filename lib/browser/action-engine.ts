import type { BrowserAction } from "@/lib/browser/types";
import { evaluateActionRisk } from "@/lib/security/policy-engine";
import { validateExternalUrl } from "@/lib/browser/url-policy";

export function assessBrowserAction(action: BrowserAction) {
  if (action.type === "navigate") validateExternalUrl(action.url);
  if (action.type === "wait" && (action.milliseconds < 0 || action.milliseconds > 10_000)) throw new Error("Browser wait must be between 0 and 10 seconds.");
  const actionName = ["type", "select"].includes(action.type) ? "update_crm" : "research";
  return { action, ...evaluateActionRisk(actionName) };
}
