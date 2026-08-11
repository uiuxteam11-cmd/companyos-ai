// lib/browser/types.ts
export interface BrowserSession {
  id: string;
  currentUrl: string | null;
  history: string[];
}

export interface PageContent {
  url: string;
  title: string;
  markdown: string;
  error?: string;
}