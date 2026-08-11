// lib/browser/controller.ts
import { BrowserSession, PageContent } from './types';
import { readPage } from './page-reader';

export class BrowserController {
  private session: BrowserSession;

  constructor(sessionId: string) {
    this.session = {
      id: sessionId,
      currentUrl: null,
      history: []
    };
  }

  async navigate(url: string): Promise<PageContent> {
    // Add to history
    if (this.session.currentUrl) {
      this.session.history.push(this.session.currentUrl);
    }
    this.session.currentUrl = url;
    
    // Fetch the real content
    return await readPage(url);
  }

  getCurrentUrl(): string | null {
    return this.session.currentUrl;
  }
}