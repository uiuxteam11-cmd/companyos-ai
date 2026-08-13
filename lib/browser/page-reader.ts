import type { BrowserObservation } from "@/lib/browser/types";

export function summarizePage(snapshot: BrowserObservation) {
  return { url: snapshot.url, title: snapshot.title, text: snapshot.text.slice(0, 10_000) };
}
