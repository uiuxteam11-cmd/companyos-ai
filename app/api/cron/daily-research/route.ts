// app/api/cron/daily-research/route.ts
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { getFormattedMemory } from '@/lib/memory/company-memory';

export const runtime = 'nodejs'; // Cron jobs run best on Node.js runtime

export async function GET(req: Request) {
  // 1. Security Check: Ensure Vercel is the one calling this
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    console.log("🕒 [CRON] Daily Research Agent triggered.");

    // 2. Fetch Company Memory
    const memoryContext = await getFormattedMemory('ws_v2');

    // 3. Execute Agent in the background (no streaming)
    const result = await generateText({
      model: google('gemini-1.5-flash'),
      system: `${memoryContext} You are the Research Agent. You are running a scheduled background task.`,
      prompt: "Run a quick check on the latest AI workspace competitors in the Indian market and summarize any new features they launched recently.",
    });

    console.log("✅ [CRON] Daily Research Agent completed:", result.text);

    // In Phase 14, we will save `result.text` to the Supabase `agent_memory` table 
    // so the user sees it in their dashboard next time they log in.

    return new Response(JSON.stringify({ success: true, result: result.text }), { status: 200 });
    
  } catch (error) {
    console.error("❌ [CRON] Daily Research Agent failed:", error);
    return new Response(JSON.stringify({ error: "Cron job failed" }), { status: 500 });
  }
}