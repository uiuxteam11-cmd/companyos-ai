import type { Profile, User } from "@/types/auth";
import type { Workspace, WorkspaceMember } from "@/types/workspace";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
      };
      workspaces: {
        Row: Workspace;
        Insert: Partial<Workspace>;
        Update: Partial<Workspace>;
      };
      workspace_members: {
        Row: WorkspaceMember;
        Insert: Partial<WorkspaceMember>;
        Update: Partial<WorkspaceMember>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      workspace_role: "owner" | "admin" | "member";
    };
  };
};

export type AppUser = User;
