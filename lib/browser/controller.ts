import type { BrowserController as BrowserControllerContract } from "@/lib/browser/browser-controller";
import { readPage } from "./page-reader";
import type { BrowserAction, BrowserObservation, BrowserSession, PageContent } from "./types";
import { validateExternalUrl } from "./url-policy";

function createObservation(input: PageContent): BrowserObservation {
  return {
    url: input.url,
    title: input.title,
    text: input.text ?? input.markdown.slice(0, 10_000),
    markdown: input.markdown,
    screenshotUrl: input.screenshotUrl,
    interactiveElements: input.interactiveElements ?? [],
    observedAt: input.observedAt,
    error: input.error,
  };
}

function createEmptyObservation(url: string | null): BrowserObservation {
  return {
    url: url ?? "about:blank",
    title: "Idle browser session",
    text: url ? `Ready on ${url}` : "No page loaded yet.",
    observedAt: new Date().toISOString(),
    interactiveElements: [],
  };
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export class BrowserController implements BrowserControllerContract {
  private session: BrowserSession;
  private observation: BrowserObservation;

  constructor(sessionId: string) {
    this.session = {
      id: sessionId,
      currentUrl: null,
      history: [],
    };
    this.observation = createEmptyObservation(null);
  }

  async navigate(url: string): Promise<PageContent> {
    const validatedUrl = validateExternalUrl(url).toString();

    if (this.session.currentUrl) {
      this.session.history.push(this.session.currentUrl);
    }

    this.session.currentUrl = validatedUrl;
    const page = await readPage(validatedUrl);
    this.observation = createObservation(page);
    return page;
  }

  async observe(): Promise<BrowserObservation> {
    return this.observation;
  }

  async act(action: BrowserAction): Promise<BrowserObservation> {
    if (action.type === "navigate") {
      await this.navigate(action.url);
      return this.observe();
    }

    if (action.type === "back") {
      const previous = this.session.history.pop();
      if (previous) {
        await this.navigate(previous);
      }
      return this.observe();
    }

    if (action.type === "forward") {
      return this.observe();
    }

    if (action.type === "wait") {
      await delay(Math.max(0, action.milliseconds));
      return this.observe();
    }

    const now = new Date().toISOString();
    const description =
      action.type === "click"
        ? `Clicked ${action.selector}.`
        : action.type === "type"
          ? `Typed into ${action.selector}.`
          : action.type === "select"
            ? `Selected ${action.value} in ${action.selector}.`
            : action.type === "scroll"
              ? `Scrolled ${action.direction}.`
              : action.type === "extract"
                ? `Extracted content from ${action.selector ?? "the page"}.`
                : "Captured a screenshot.";

    this.observation = {
      ...this.observation,
      text: `${this.observation.text}\n${description}`.trim(),
      observedAt: now,
    };
    return this.observation;
  }

  getCurrentUrl(): string | null {
    return this.session.currentUrl;
  }
}
