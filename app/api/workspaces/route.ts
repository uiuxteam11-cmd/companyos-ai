import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { workspaceSchema } from "@/lib/validation/workspace";

export async function GET() {
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 500 },
    );
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .limit(10);

  if (error) {
    return NextResponse.json(
      { error: "Unable to load workspaces." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { items: data ?? [] },
    { status: 200 },
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 500 },
    );
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => ({}));

  const validation = workspaceSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      {
        error:
          validation.error.issues[0]?.message ??
          "Invalid workspace payload.",
      },
      { status: 400 },
    );
  }

  const slug =
    validation.data.slug ||
    validation.data.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  /*
   * Create the workspace.
   *
   * The database generates the workspace UUID.
   */
  const { data, error } = await supabase
    .from("workspaces")
    .insert({
      name: validation.data.name,
      slug,
      created_by: user.id,
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      {
        error:
          error?.message ??
          "Could not create workspace.",
      },
      { status: 400 },
    );
  }

  /*
   * Create the initial owner membership.
   */
  const { error: memberError } = await supabase
    .from("workspace_members")
    .insert({
      workspace_id: data.id,
      user_id: user.id,
      role: "owner",
    });

  if (memberError) {
    /*
     * Roll back the workspace if membership creation fails.
     */
    await supabase
      .from("workspaces")
      .delete()
      .eq("id", data.id);

    return NextResponse.json(
      {
        error:
          memberError.message ??
          "Could not create workspace membership.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { workspace: data },
    { status: 201 },
  );
}