import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { maskPII } from '@/lib/security';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // 1. PII Masking: Intercept the last user message
    const lastMessage = messages[messages.length - 1];
    const { maskedText, piiMap } = maskPII(lastMessage.content);
    
    // Replace the real text with the masked text before sending to Google
    lastMessage.content = maskedText;

    // 2. Smart Cost Routing: Choose the Gemini model based on complexity
    let modelToUse = 'gemini-1.5-flash'; // Default to fast, free model
    
    // If the prompt is long or complex, use the smarter Pro model
    const isComplex = maskedText.length > 200 || /legal|contract|analyze|forecast/.test(maskedText.toLowerCase());
    if (isComplex) {
      modelToUse = 'gemini-1.5-pro'; // Smarter, slightly more expensive model
    }

    // 3. AI Call: Send the masked prompt to Google Gemini
    const result = await streamText({
      model: google(modelToUse),
      messages: messages,
    });

    // 4. Stream the response back to the frontend using the new Vercel AI SDK v3 method
    return result.toDataStreamResponse();
    
  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}