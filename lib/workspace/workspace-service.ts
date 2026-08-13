import { createClient } from "@/lib/supabase/server";
import type { Workspace, WorkspaceMember, WorkspaceRole } from "@/types/workspace";
import {
  workspaceMemberInviteSchema,
  workspaceMemberUpdateSchema,
  workspaceUpdateSchema,
} from "@/lib/validation/workspace";

export type WorkspaceMemberWithProfile = WorkspaceMember & {
  profile?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
};

export async function getCurrentWorkspaceContext(userId: string) {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("user_id", userId)
    .limit(1)
    .single();

  if (membershipError || !membership) {
    return null;
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", membership.workspace_id)
    .limit(1)
    .single();

  if (workspaceError || !workspace) {
    return null;
  }

  return { membership: membership as WorkspaceMember, workspace: workspace as Workspace };
}

export async function updateWorkspace(workspaceId: string, userId: string, updates: Partial<Pick<Workspace, "name" | "slug">>) {
  const validation = workspaceUpdateSchema.safeParse(updates);
  if (!validation.success) {
    throw new Error(validation.error.issues[0]?.message ?? "Invalid workspace update payload.");
  }

  const supabase = await createClient();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("role, workspace_id")
    .eq("user_id", userId)
    .limit(1)
    .single();

  if (membershipError || !membership) {
    throw new Error("Workspace membership not found.");
  }

  if (!["owner", "admin"].includes(membership.role)) {
    throw new Error("You are not authorized to update this workspace.");
  }

  const { data, error } = await supabase
    .from("workspaces")
    .update(validation.data)
    .eq("id", workspaceId)
    .select()
    .single();

  if (error || !data) {
    throw error;
  }

  return data as Workspace;
}

export async function listWorkspaceMembers(workspaceId: string) {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("workspace_members")
    .select("id,workspace_id,user_id,role,created_at,profiles(id,full_name,email)")
    .eq("workspace_id", workspaceId);

  if (error || !data) {
    throw error;
  }

  return data as WorkspaceMemberWithProfile[];
}

export async function inviteWorkspaceMember(workspaceId: string, userId: string, email: string, role: WorkspaceRole) {
  const validation = workspaceMemberInviteSchema.safeParse({ email, role });
  if (!validation.success) {
    throw new Error(validation.error.issues[0]?.message ?? "Invalid invite payload.");
  }

  if (validation.data.role === "owner") {
    throw new Error("Cannot invite a member as owner.");
  }

  const supabase = await createClient();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data: currentMembership, error: currentMembershipError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .limit(1)
    .single();

  if (currentMembershipError || !currentMembership) {
    throw new Error("Workspace membership not found.");
  }

  if (!["owner", "admin"].includes(currentMembership.role)) {
    throw new Error("You are not authorized to manage workspace members.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", validation.data.email)
    .limit(1)
    .single();

  if (profileError || !profile) {
    throw new Error("User profile not found for that email.");
  }

  const { data, error } = await supabase.from("workspace_members").insert({
    id: crypto.randomUUID(),
    workspace_id: workspaceId,
    user_id: profile.id,
    role: validation.data.role,
    created_at: new Date().toISOString(),
  });

  if (error || !data) {
    throw error;
  }

  return data as WorkspaceMember[];
}

export async function updateWorkspaceMember(workspaceId: string, memberId: string, userId: string, role: WorkspaceRole) {
  const validation = workspaceMemberUpdateSchema.safeParse({ role });
  if (!validation.success) {
    throw new Error(validation.error.issues[0]?.message ?? "Invalid role.");
  }

  if (validation.data.role === "owner") {
    throw new Error("Cannot assign owner role through membership management.");
  }

  const supabase = await createClient();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data: currentMembership, error: currentMembershipError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .limit(1)
    .single();

  if (currentMembershipError || !currentMembership) {
    throw new Error("Workspace membership not found.");
  }

  if (!["owner", "admin"].includes(currentMembership.role)) {
    throw new Error("You are not authorized to manage workspace members.");
  }

  const { data: member, error: memberError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("id", memberId)
    .eq("workspace_id", workspaceId)
    .limit(1)
    .single();

  if (memberError || !member) {
    throw new Error("Workspace member not found.");
  }

  if (member.role === "owner") {
    throw new Error("Owner role cannot be changed.");
  }

  const { data, error } = await supabase
    .from("workspace_members")
    .update({ role: validation.data.role })
    .eq("id", memberId)
    .eq("workspace_id", workspaceId)
    .select()
    .single();

  if (error || !data) {
    throw error;
  }

  return data as WorkspaceMember;
}

export async function removeWorkspaceMember(workspaceId: string, memberId: string, userId: string) {
  const supabase = await createClient();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data: currentMembership, error: currentMembershipError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .limit(1)
    .single();

  if (currentMembershipError || !currentMembership) {
    throw new Error("Workspace membership not found.");
  }

  if (!["owner", "admin"].includes(currentMembership.role)) {
    throw new Error("You are not authorized to manage workspace members.");
  }

  const { data: member, error: memberError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("id", memberId)
    .eq("workspace_id", workspaceId)
    .limit(1)
    .single();

  if (memberError || !member) {
    throw new Error("Workspace member not found.");
  }

  if (member.role === "owner") {
    throw new Error("Owner cannot be removed.");
  }

  const { data, error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("id", memberId)
    .eq("workspace_id", workspaceId)
    .select()
    .single();

  if (error || !data) {
    throw error;
  }

  return data as WorkspaceMember;
}
