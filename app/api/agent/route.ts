import { NextResponse } from "next/server";
import type { AgentTask } from "@/types/agent";
import {
  executeAgentTool,
  getToolRegistry,
} from "@/lib/tools/registry";
import { createAgentPlan } from "@/lib/agents/state-machine";

type AgentRequestBody = {
  workspaceId?: string;
  userId?: string;
  agentId?: string;
  instruction?: string;
};

function createTask(body: AgentRequestBody): AgentTask {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    workspace_id: body.workspaceId ?? "workspace_runtime",
    agent_id: body.agentId ?? "agent_runtime",
    created_by: body.userId ?? "user_runtime",
    title: body.instruction?.trim().slice(0, 120) || "CompanyOS task",
    instruction: body.instruction ?? "",
    status: "queued",
    priority: 3,
    input: {
      instruction: body.instruction ?? "",
    },
    output: null,
    error_message: null,
    current_step: null,
    started_at: null,
    completed_at: null,
    created_at: now,
    updated_at: now,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AgentRequestBody;

    if (!body.instruction?.trim()) {
      return NextResponse.json(
        {
          error: "instruction is required",
        },
        { status: 400 },
      );
    }

    const task = createTask(body);

    const plan = await createAgentPlan({
      ...task,
    });

    const toolRegistry = getToolRegistry(
      (event) => {
        console.log("[agent-tool-event]", event);
      },
      {
        workspaceId: task.workspace_id,
        userId: task.created_by,
        agentId: task.agent_id,
        taskId: task.id,
      },
    );

    const executionResults: unknown[] = [];

    for (const step of plan.steps) {
      const result = await executeAgentTool(
        step.toolId,
        step.input,
        {
          workspaceId: task.workspace_id,
          userId: task.created_by,
          agentId: task.agent_id,
          taskId: task.id,
          runId: null,
          role: null,
          metadata: {
            sequence: step.sequence,
            rationale: step.rationale,
          },
        },
      );

      executionResults.push({
        sequence: step.sequence,
        toolId: step.toolId,
        result,
      });
    }

    return NextResponse.json({
      success: true,
      task,
      plan,
      tools: Object.keys(toolRegistry),
      executionResults,
    });
  } catch (error) {
    console.error("[agent-api]", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Agent execution failed.",
      },
      { status: 500 },
    );
  }
}
