// lib/browser/page-reader.ts
import { PageContent } from './types';

export async function readPage(url: string): Promise<PageContent> {
  try {
    console.log(`[Browser Agent] Fetching real content from: ${url}`);
    
    // We use Jina AI's free public Reader API. 
    // It prepends 'https://r.jina.ai/' to any URL and returns clean LLM-friendly Markdown.
    const jinaUrl = `https://r.jina.ai/${url}`;
    
    const response = await fetch(jinaUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Return-Format': 'markdown'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page. Status: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the clean markdown content and title
    const markdown = data.data?.content || data.content || 'No content found.';
    const title = data.data?.title || data.title || 'Unknown Title';

    return {
      url: url,
      title: title,
      markdown: markdown.substring(0, 3000) // Truncate to 3000 chars to save LLM context window
    };
  } catch (error: any) {
    console.error(`[Browser Agent] Error reading page: ${error.message}`);
    return {
      url: url,
      title: 'Error',
      markdown: '',
      error: error.message
    };
  }
}