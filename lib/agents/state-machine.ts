// lib/agents/state-machine.ts
import { AgentTask, AgentTaskStatus } from './types';

// In V2, this will hook into Supabase to persist state changes to the audit logs.
export async function transitionState(task: AgentTask, newStatus: AgentTaskStatus, step?: string): Promise<AgentTask> {
  const oldStatus = task.status;
  task.status = newStatus;
  task.updatedAt = Date.now();
  
  if (step) {
    task.currentStep = step;
    task.executionHistory.push(`[${task.updatedAt}] State: ${oldStatus} -> ${newStatus} | Step: ${step}`);
  } else {
    task.executionHistory.push(`[${task.updatedAt}] State: ${oldStatus} -> ${newStatus}`);
  }

  console.log(`[Agent Task ${task.id}] ${oldStatus} -> ${newStatus}`);
  return task;
}