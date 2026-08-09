import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { brand, competitor, industry } = await req.json();

    // 1. The Prompt asking Gemini to act as a consumer
    const prompt = `You are a consumer looking for services. List the top 3 best ${industry} companies in India today. Just return a comma-separated list of the company names, nothing else.`;

    // 2. Call Google Gemini
    const { text } = await generateText({
      model: google('gemini-1.5-flash'),
      prompt: prompt,
    });

    // 3. Parse the results and check if brands are mentioned
    const responseText = text.toLowerCase();
    const isBrandMentioned = responseText.includes(brand.toLowerCase());
    const isCompetitorMentioned = responseText.includes(competitor.toLowerCase());

    // 4. Calculate a dummy score based on mentions
    const brandScore = isBrandMentioned ? 85 : 20;
    const competitorScore = isCompetitorMentioned ? 75 : 30;

    // 5. Return the data to the frontend
    return new Response(JSON.stringify({
      aiResponse: text,
      brandScore,
      competitorScore,
      isBrandMentioned,
      isCompetitorMentioned,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("AI-SEO Error:", error);
    return new Response(JSON.stringify({ error: "Failed to run AI-SEO scan" }), { status: 500 });
  }
}