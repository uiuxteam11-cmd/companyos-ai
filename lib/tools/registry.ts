// lib/tools/registry.ts
import { tool } from 'ai';
import { z } from 'zod';
import { evaluateAction } from '@/lib/security/policy-engine';
import { AgentContext, AgentTool } from '@/lib/agents/types';
import { BrowserController } from '@/lib/browser/controller';
import { requestApproval } from '@/lib/agents/approval-manager';
import { supabaseAdmin } from '@/lib/supabaseServer';

export type ToolEvent = {
  type: 'tool_start' | 'tool_end' | 'status' | 'approval_required';
  message?: string;
  tool?: string;
  input?: unknown;
  id?: string;
  action?: string;
  reason?: string;
};

export function getToolRegistry(emit: (event: ToolEvent) => void) {
  const browser = new BrowserController('session_1');

  const createTool = (
    name: string,
    description: string,
    riskLevel: 'low' | 'medium' | 'high',
    schema: z.ZodTypeAny,
    executeFn: (
      input: Record<string, unknown>,
      context: AgentContext,
      emit: (event: ToolEvent) => void,
      toolCallId: string,
    ) => Promise<string>,
  ) => {
    return tool({
      description,
      parameters: schema,
      execute: async (input: unknown, opts?: { toolCallId?: string }) => {
        const normalizedInput =
          typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
        const toolCallId = opts?.toolCallId ?? Math.random().toString(36).slice(2, 9);
        emit({ type: 'tool_start', tool: name, input: normalizedInput });

        const toolDefinition: AgentTool = {
          name,
          description,
          riskLevel,
          inputSchema: schema,
          execute: async () => ({ success: true, data: '' }),
        };

        evaluateAction(toolDefinition, normalizedInput);

        const context: AgentContext = { taskId: 'current_task', workspaceId: 'current_ws' };
        const result = await executeFn(normalizedInput, context, emit, toolCallId);

        // AUDIT LOG: Save tool execution to database
        try {
          await supabaseAdmin.from('audit_logs').insert({
            workspace_id: context.workspaceId,
            task_id: context.taskId,
            agent_name: 'Agent', // Could be dynamic later
            tool_name: name,
            risk_level: riskLevel,
            input: normalizedInput,
            output: result
          });
        } catch (dbError) {
          console.error("Failed to write audit log:", dbError);
        }

        emit({ type: 'tool_end', tool: name });
        return result;
      },
    });
  };

  return {
    search_web: createTool(
      'search_web',
      'Search the web for information.',
      'low',
      z.object({ query: z.string() }),
      async ({ query }, _context, emit) => {
        const queryText = typeof query === 'string' ? query : 'search';
        emit({ type: 'status', message: `🔎 Searching web for: ${queryText}` });
        const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(queryText)}`;
        const results = await browser.navigate(searchUrl);
        return `Search results for ${queryText}:\n\n${results.markdown.substring(0, 1500)}`;
      },
    ),

    read_page: createTool(
      'read_page',
      'Read the text content of a specific webpage.',
      'low',
      z.object({ url: z.string().url() }),
      async ({ url }, _context, emit) => {
        const pageUrl = typeof url === 'string' ? url : 'https://example.com';
        emit({ type: 'status', message: `🌐 Reading page: ${pageUrl}` });
        const pageData = await browser.navigate(pageUrl);
        if (pageData.error) return `Failed to read ${pageUrl}. Error: ${pageData.error}`;
        return `Title: ${pageData.title}\nURL: ${pageData.url}\nContent:\n${pageData.markdown}`;
      },
    ),

    create_document: createTool(
      'create_document',
      'Create a new document with specific content.',
      'medium',
      z.object({ title: z.string(), content: z.string() }),
      async ({ title }, _context, emit) => {
        const documentTitle = typeof title === 'string' ? title : 'Untitled Document';
        emit({ type: 'status', message: `📄 Creating document: ${documentTitle}` });
        return `Document '${documentTitle}' created successfully!`;
      },
    ),

    request_approval: createTool(
      'request_approval',
      'Pause execution and ask the human for approval before doing something sensitive (like sending an email).',
      'high',
      z.object({ action: z.string(), reason: z.string() }),
      async ({ action, reason }, _context, emit, toolCallId) => {
        const actionText = typeof action === 'string' ? action : 'sensitive action';
        const reasonText = typeof reason === 'string' ? reason : 'Approval requested';
        emit({ type: 'status', message: `⏸️ Requesting approval for: ${actionText}` });
        emit({ type: 'approval_required', id: toolCallId, action: actionText, reason: reasonText });

        const decision = await requestApproval(toolCallId);
        emit({ type: 'status', message: `✅ Approval decision: ${decision}` });
        return `Human ${decision} the action: ${actionText}. Reason: ${reasonText}`;
      },
    ),
  };
}