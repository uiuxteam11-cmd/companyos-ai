// lib/agents/approval-manager.ts

type PendingApproval = {
  resolve: (decision: string) => void;
  reject: (error: Error) => void;
};

// In-memory store for MVP. (In production, this would be Redis/Supabase)
const pendingApprovals = new Map<string, PendingApproval>();

export function requestApproval(id: string): Promise<string> {
  return new Promise((resolve, reject) => {
    pendingApprovals.set(id, { resolve, reject });
    
    // Timeout after 2 minutes to prevent hanging forever
    setTimeout(() => {
      if (pendingApprovals.has(id)) {
        pendingApprovals.delete(id);
        reject(new Error('Approval timed out after 2 minutes.'));
      }
    }, 120000);
  });
}

export function resolveApproval(id: string, decision: string) {
  const pending = pendingApprovals.get(id);
  if (pending) {
    pending.resolve(decision);
    pendingApprovals.delete(id);
  }
}