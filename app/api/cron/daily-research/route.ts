import { google } from "@ai-sdk/google";
import { generateText } from "ai";

import { getFormattedMemory } from "@/lib/memory/company-memory";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret) {
    return new Response(
      JSON.stringify({ error: "Cron secret is not configured" }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({
        error:
          "Gemini is not configured. Set GEMINI_API_KEY to run the daily research job.",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const workspaceId =
      process.env.COMPANYOS_DAILY_RESEARCH_WORKSPACE_ID ??
      "workspace_runtime";
    const memoryContext = await getFormattedMemory(workspaceId);

    const result = await generateText({
      model: google(process.env.GEMINI_MODEL ?? "gemini-1.5-flash"),
      system:
        `${memoryContext} You are the Research Agent. You are running a scheduled background task.`,
      prompt:
        "Run a quick check on the latest AI workspace competitors in the Indian market and summarize any new features they launched recently.",
    });

    return new Response(
      JSON.stringify({ success: true, workspaceId, result: result.text }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("[CRON] Daily Research Agent failed:", error);

    return new Response(JSON.stringify({ error: "Cron job failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
