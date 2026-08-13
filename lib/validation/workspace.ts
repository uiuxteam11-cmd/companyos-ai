import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
});

export const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters long."),
  email: z.string().trim().email("Please provide a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
  workspaceName: z.string().trim().min(3, "Workspace name must be at least 3 characters long."),
});

export const workspaceSchema = z.object({
  name: z.string().trim().min(3, "Workspace name must be at least 3 characters long."),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters long.")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase, URL-safe, and contain no spaces.")
    .optional(),
});

export const workspaceUpdateSchema = z.object({
  name: z.string().trim().min(3, "Workspace name must be at least 3 characters long.").optional(),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters long.")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase, URL-safe, and contain no spaces.")
    .optional(),
});

export const workspaceRoleSchema = z.enum(["owner", "admin", "member", "viewer"]);

export const workspaceMemberInviteSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address."),
  role: workspaceRoleSchema,
});

export const workspaceMemberUpdateSchema = z.object({
  role: workspaceRoleSchema,
});

// ---------------------------------------------------------------------------
// Agent / Task / Run / Event validation schemas (Phase 2)
// Keep in sync with types/agent.ts and DB migration.
// ---------------------------------------------------------------------------

export const agentStatusSchema = z.enum(["active", "paused", "archived"]);

export const agentCreateSchema = z.object({
  name: z.string().trim().min(1, "Agent name is required."),
  description: z.string().nullable().optional(),
  status: agentStatusSchema.optional(),
  system_prompt: z.string().nullable().optional(),
  configuration: z.unknown().optional(),
});

export const agentUpdateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().nullable().optional(),
  status: agentStatusSchema.optional(),
  system_prompt: z.string().nullable().optional(),
  configuration: z.unknown().optional(),
});

export const agentTaskStatusSchema = z.enum([
  "queued",
  "planning",
  "running",
  "waiting_approval",
  "paused",
  "completed",
  "failed",
  "cancelled",
]);

export const agentTaskCreateSchema = z.object({
  title: z.string().trim().min(1, "Task title is required."),
  instruction: z.string().trim().min(1, "Task instruction is required."),
  status: agentTaskStatusSchema.optional(),
  priority: z.number().int().optional(),
  input: z.unknown().optional(),
});

export const agentTaskUpdateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  instruction: z.string().trim().min(1).optional(),
  status: agentTaskStatusSchema.optional(),
  priority: z.number().int().optional(),
  input: z.unknown().optional(),
  output: z.unknown().nullable().optional(),
  error_message: z.string().nullable().optional(),
  current_step: z.string().nullable().optional(),
});

export const agentRunStatusSchema = z.enum(["queued", "planning", "running", "waiting_approval", "paused", "completed", "failed", "cancelled"]);

export const agentRunCreateSchema = z.object({
  input: z.unknown().optional(),
  metadata: z.unknown().optional(),
  current_step: z.string().nullable().optional(),
});

export const agentRunUpdateSchema = z.object({
  status: agentRunStatusSchema.optional(),
  output: z.unknown().nullable().optional(),
  error_message: z.string().nullable().optional(),
  metadata: z.unknown().optional(),
  current_step: z.string().nullable().optional(),
  started_at: z.string().datetime().nullable().optional(),
  completed_at: z.string().datetime().nullable().optional(),
});

export const agentEventCreateSchema = z.object({
  agent_id: z.string().uuid().nullable().optional(),
  task_id: z.string().uuid().nullable().optional(),
  run_id: z.string().uuid().nullable().optional(),
  event_type: z.string().trim().min(1, "Event type is required."),
  message: z.string().nullable().optional(),
  payload: z.unknown().optional(),
});
