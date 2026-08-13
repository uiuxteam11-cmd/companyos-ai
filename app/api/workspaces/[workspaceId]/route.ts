import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateWorkspace } from "@/lib/workspace/workspace-service";

export async function PATCH(request: NextRequest, context: { params: Promise<{ workspaceId: string }> }) {
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { workspaceId } = await context.params;

  try {
    const workspace = await updateWorkspace(workspaceId, user.id, body);
    return NextResponse.json({ workspace }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update workspace.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
