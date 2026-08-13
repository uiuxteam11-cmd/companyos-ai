export type ProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type WorkspaceRow = {
  id: string;
  name: string;
  slug: string;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type WorkspaceMemberRow = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  created_at: string | null;
};
