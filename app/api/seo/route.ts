import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { brand, competitor, industry } = await req.json();

    const systemPrompt = `You are an advanced AI Search Engine and Brand Intelligence Analyst (like Perplexity). 
    Your task is to analyze the AI visibility of "${brand}" vs "${competitor}" in the "${industry}" industry in India.
    
    Based on your most recent knowledge of the web and AI training data:
    1. List the top 3 companies in this space.
    2. Determine if ${brand} and ${competitor} are mentioned.
    3. Calculate a realistic visibility score (0-100) for each based on market presence, backlinks, and AI mentions.
    4. Provide a brief 1-sentence reasoning for the scores.
    
    Return the data in the specified JSON format.`;

    // Generate a structured JSON object
    const { object } = await generateObject({
      model: google('gemini-1.5-flash'),
      system: systemPrompt,
      prompt: `Analyze ${brand} vs ${competitor} in ${industry} India.`,
      schema: z.object({
        topCompanies: z.array(z.string()).describe("Top 3 companies in this industry"),
        brandScore: z.number().describe("Visibility score 0-100"),
        competitorScore: z.number().describe("Visibility score 0-100"),
        isBrandMentioned: z.boolean(),
        isCompetitorMentioned: z.boolean(),
        reasoning: z.string().describe("Brief 1 sentence reasoning for the scores"),
        aiResponse: z.string().describe("A comma-separated list of the top companies"),
      }),
    });

    return new Response(JSON.stringify(object), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("AI-SEO Error:", error);
    return new Response(JSON.stringify({ error: "Failed to run AI-SEO scan" }), { status: 500 });
  }
}