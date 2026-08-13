// lib/workflows/engine.ts
import { BrowserController } from '@/lib/browser/controller';
import { requestApproval } from '@/lib/agents/approval-manager';

export interface WorkflowStep {
  id: string;
  toolName: string;
  input: (prevResult: string) => Promise<unknown> | unknown;
}

export interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
}

export const leadResearchWorkflow: Workflow = {
  id: 'lead_research',
  name: 'Lead Research & Approval',
  steps: [
    {
      id: 'step_1_search',
      toolName: 'search_web',
      input: () => ({ query: 'Top SaaS companies in Mumbai 2024' }),
    },
    {
      id: 'step_2_read',
      toolName: 'read_page',
      input: (prevResult) => {
        const urlMatch = prevResult.match(/https?:\/\/[^\s,]+/);
        return { url: urlMatch ? urlMatch[0] : 'https://example.com' };
      },
    },
    {
      id: 'step_3_approve',
      toolName: 'request_approval',
      input: () => ({
        action: 'Send outreach email to the researched lead based on page content.',
        reason: 'Sending emails is a high-risk action.',
      }),
    },
  ],
};

export async function executeWorkflow(
  workflow: Workflow,
  emit: (event: { type: string; message?: string; tool?: string; input?: unknown; id?: string; action?: string }) => void,
): Promise<string> {
  const browser = new BrowserController('workflow_session');
  let prevResult = '';

  emit({ type: 'status', message: `⚙️ Starting Workflow: ${workflow.name}` });

  for (let i = 0; i < workflow.steps.length; i++) {
    const step = workflow.steps[i];

    const stepInput = (await step.input(prevResult)) as Record<string, unknown>;
    emit({ type: 'status', message: `Step ${i + 1}: Executing ${step.toolName}...` });
    emit({ type: 'tool_start', tool: step.toolName, input: stepInput });

    let resultString = '';

    if (step.toolName === 'search_web') {
      const input = stepInput as { query?: string };
      const query = input.query ?? '';
      const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const results = await browser.navigate(searchUrl);
      resultString = `Search results for ${query}:\n\n${results.markdown.substring(0, 1500)}`;
    } else if (step.toolName === 'read_page') {
      const input = stepInput as { url?: string };
      const pageUrl = input.url ?? 'https://example.com';
      const pageData = await browser.navigate(pageUrl);
      resultString = `Title: ${pageData.title}\nURL: ${pageData.url}\nContent:\n${pageData.markdown}`;
    } else if (step.toolName === 'request_approval') {
      const input = stepInput as { action?: string };
      const action = input.action ?? 'sensitive action';
      emit({ type: 'approval_required', id: step.id, action });
      const decision = await requestApproval(step.id);
      resultString = `Human ${decision} the action: ${action}`;
    }

    prevResult = resultString;
    emit({ type: 'tool_end', tool: step.toolName });
  }

  emit({ type: 'status', message: '✅ Workflow Completed.' });
  return prevResult;
}