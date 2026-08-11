// app/api/agent/route.ts
import { supabaseAdmin } from '@/lib/supabaseServer';
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import type { AgentTask } from '@/lib/agents/types';
import { transitionState } from '@/lib/agents/state-machine';
import { getToolRegistry } from '@/lib/tools/registry';
import { getFormattedMemory } from '@/lib/memory/company-memory';
import { executeWorkflow, leadResearchWorkflow } from '@/lib/workflows/engine';
import { getAgentConfig } from '@/lib/agents/registry';

export const runtime = 'edge';

type StreamEvent = {
  type: string;
  message?: string;
  tool?: string;
  input?: unknown;
  id?: string;
  action?: string;
  reason?: string;
};

export async function POST(req: Request) {
  try {
    const { agentName, task: goal } = await req.json();

    let task: AgentTask = {
      id: `task_${Date.now()}`,
      userId: 'user_v2',
      workspaceId: 'ws_v2',
      agentType: agentName.toLowerCase().includes('sales') ? 'sales' : 'research',
      goal: goal,
      status: 'queued',
      currentStep: 'Initializing',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      executionHistory: [],
    };

    // 1. Save Task to Database at the start
    const { data: dbTask } = await supabaseAdmin
      .from('agent_tasks')
      .insert({
        workspace_id: task.workspaceId,
        user_id: task.userId,
        agent_name: agentName,
        goal: goal,
        status: 'running'
      })
      .select()
      .single();

    const dbTaskId = dbTask?.id || task.id;

    const encoder = new TextEncoder();
    let streamController: ReadableStreamDefaultController<Uint8Array> | null = null;

    const emit = (event: StreamEvent) => {
      if (streamController) {
        streamController.enqueue(encoder.encode(`2:[${JSON.stringify(event)}]\n`));
      }
    };

    const customStream = new ReadableStream({
      async start(controller) {
        streamController = controller;

        try {
          // WORKFLOW PATH
          if (String(goal).toLowerCase().startsWith('workflow:')) {
            task = await transitionState(task, 'running', 'Executing Workflow');
            emit({ type: 'status', message: `🤖 ${agentName} initialized for Workflow.` });

            const finalResult = await executeWorkflow(leadResearchWorkflow, emit);
            task = await transitionState(task, 'completed', 'Workflow finished successfully');

            // Update Database for Workflow Completion
            if (dbTaskId) {
              await supabaseAdmin
                .from('agent_tasks')
                .update({ status: 'completed', result: finalResult, updated_at: new Date().toISOString() })
                .eq('id', dbTaskId);
            }

            controller.enqueue(encoder.encode(`0:${JSON.stringify(finalResult)}\n`));
            controller.close();
            return;
          }

          // STANDARD LLM AGENT PATH
          task = await transitionState(task, 'planning', 'Analyzing goal and retrieving memory');
          const memoryContext = await getFormattedMemory(task.workspaceId);
          const agentConfig = getAgentConfig(agentName);

          task = await transitionState(task, 'running', `Executing as ${agentConfig.name}`);

          const systemPrompt = `${memoryContext}\n\n${agentConfig.systemPrompt}`;
          const allTools = getToolRegistry(emit);
          const allowedTools = Object.fromEntries(
            Object.entries(allTools).filter(([toolName]) =>
              agentConfig.allowedTools.includes(toolName),
            ),
          ) as typeof allTools;

          emit({ type: 'status', message: `🤖 ${agentConfig.name} initialized.` });

          const result = await streamText({
            model: google('gemini-1.5-flash'),
            system: systemPrompt,
            messages: [{ role: 'user', content: goal }],
            tools: allowedTools,
            onFinish: async () => {
              task = await transitionState(task, 'completed', 'Task finished successfully');
              emit({ type: 'status', message: '✅ Task completed.' });
              
              // Update Database for LLM Completion
              if (dbTaskId) {
                await supabaseAdmin
                  .from('agent_tasks')
                  .update({ status: 'completed', updated_at: new Date().toISOString() })
                  .eq('id', dbTaskId);
              }
            },
          });

          for await (const chunk of result.textStream) {
            controller.enqueue(encoder.encode(`0:${JSON.stringify(chunk)}\n`));
          }

          controller.close();
        } catch (error) {
          console.error('Stream Execution Error:', error);
          controller.enqueue(encoder.encode('0:"Error processing request."\n'));
          controller.close();
          
          // Update Database on Failure
          if (dbTaskId) {
            await supabaseAdmin
              .from('agent_tasks')
              .update({ status: 'failed', updated_at: new Date().toISOString() })
              .eq('id', dbTaskId);
          }
        }
      },
    });

    return new Response(customStream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    console.error('Agent Orchestrator Error:', error);
    return new Response(JSON.stringify({ error: 'Agent execution failed' }), { status: 500 });
  }
}