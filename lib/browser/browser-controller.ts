import type { BrowserAction, BrowserObservation } from "@/lib/browser/types";

export interface BrowserController {
  observe(): Promise<BrowserObservation>;
  act(action: BrowserAction): Promise<BrowserObservation>;
}
