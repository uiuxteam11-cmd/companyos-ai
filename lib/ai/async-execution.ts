export type ExecutionJobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export type ExecutionJob = {
  id: string;
  workspaceId: string;
  agentId: string;
  taskId: string;
  runId: string;
  status: ExecutionJobStatus;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
};

export class ExecutionJobRunner {
  private jobs = new Map<string, ExecutionJob>();

  enqueue(job: Omit<ExecutionJob, "status" | "createdAt" | "updatedAt">): ExecutionJob {
    const now = new Date().toISOString();
    const executionJob: ExecutionJob = {
      ...job,
      status: "queued",
      createdAt: now,
      updatedAt: now,
    };
    this.jobs.set(job.runId, executionJob);
    return executionJob;
  }

  get(jobId: string) {
    return this.jobs.get(jobId);
  }

  updateStatus(jobId: string, status: ExecutionJobStatus, metadata?: Record<string, unknown>) {
    const existing = this.jobs.get(jobId);
    if (!existing) return undefined;
    const updated = {
      ...existing,
      status,
      updatedAt: new Date().toISOString(),
      metadata: metadata ?? existing.metadata,
    };
    this.jobs.set(jobId, updated);
    return updated;
  }
}

export const executionJobRunner = new ExecutionJobRunner();
