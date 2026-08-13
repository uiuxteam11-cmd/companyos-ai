import { validateExternalUrl } from "@/lib/browser/url-policy";
import type { BrowserObservation, PageContent } from "./types";

type JinaResponse = {
  data?: {
    content?: unknown;
    title?: unknown;
  };
  content?: unknown;
  title?: unknown;
};

function toText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function summarizePage(snapshot: BrowserObservation) {
  return {
    url: snapshot.url,
    title: snapshot.title,
    text: snapshot.text.slice(0, 10_000),
  };
}

export async function readPage(url: string): Promise<PageContent> {
  const validated = validateExternalUrl(url);

  try {
    const jinaUrl = `https://r.jina.ai/${validated.toString()}`;
    const response = await fetch(jinaUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Return-Format": "markdown",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page. Status: ${response.status}`);
    }

    const rawBody = await response.text();
    let data: JinaResponse;

    try {
      data = JSON.parse(rawBody) as JinaResponse;
    } catch {
      data = { content: rawBody };
    }

    const markdown = toText(data.data?.content ?? data.content, "No content found.");
    const title = toText(data.data?.title ?? data.title, "Unknown Title");
    const observedAt = new Date().toISOString();

    return {
      url: validated.toString(),
      title,
      markdown,
      text: markdown.slice(0, 10_000),
      observedAt,
      interactiveElements: [],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown page-read error.";
    const observedAt = new Date().toISOString();

    return {
      url: validated.toString(),
      title: "Error",
      markdown: "",
      text: "",
      observedAt,
      interactiveElements: [],
      error: message,
    };
  }
}
