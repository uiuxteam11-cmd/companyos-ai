export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";

export type WorkspacePermission = {
  canManageWorkspace: boolean;
  canManageMembers: boolean;
  canCreateProject: boolean;
  canCreateTask: boolean;
  canRunAgent: boolean;
};

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type WorkspaceMember = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string | null;
};
