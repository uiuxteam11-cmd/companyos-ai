import type { WorkspacePermission, WorkspaceRole } from "@/types/workspace";

const permissionMap: Record<WorkspaceRole, WorkspacePermission> = {
  owner: {
    canManageWorkspace: true,
    canManageMembers: true,
    canCreateProject: true,
    canCreateTask: true,
    canRunAgent: true,
  },
  admin: {
    canManageWorkspace: true,
    canManageMembers: true,
    canCreateProject: true,
    canCreateTask: true,
    canRunAgent: true,
  },
  member: {
    canManageWorkspace: false,
    canManageMembers: false,
    canCreateProject: true,
    canCreateTask: true,
    canRunAgent: false,
  },
  viewer: {
    canManageWorkspace: false,
    canManageMembers: false,
    canCreateProject: false,
    canCreateTask: false,
    canRunAgent: false,
  },
};

export function getWorkspacePermissions(role: WorkspaceRole): WorkspacePermission {
  return permissionMap[role];
}

export function canManageWorkspace(role: WorkspaceRole) {
  return permissionMap[role].canManageWorkspace;
}

export function canManageMembers(role: WorkspaceRole) {
  return permissionMap[role].canManageMembers;
}

export function canCreateProject(role: WorkspaceRole) {
  return permissionMap[role].canCreateProject;
}

export function canCreateTask(role: WorkspaceRole) {
  return permissionMap[role].canCreateTask;
}

export function canRunAgent(role: WorkspaceRole) {
  return permissionMap[role].canRunAgent;
}
