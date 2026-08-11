// app/api/approve/route.ts
import { resolveApproval } from '@/lib/agents/approval-manager';

export async function POST(req: Request) {
  try {
    const { id, decision } = await req.json();
    resolveApproval(id, decision);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to resolve approval' }), { status: 500 });
  }
}