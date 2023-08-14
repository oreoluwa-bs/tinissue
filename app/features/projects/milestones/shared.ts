import { z } from "zod";

export const statusValues = [
  "BACKLOG",
  "TODO",
  "IN PROGRESS",
  "DONE",
  "CANCELLED",
] as const;

export const createProjectMilestoneSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .min(2, "Name should be more than 2 characters"),
  description: z.string().nullable(),
  projectId: z.number({ required_error: "Project Id is required" }),
  // boardId: z.number({ required_error: "Board Id is required" }),
  status: z.enum(statusValues),

  // assignees
  assigneesId: z.array(z.number()).default([]),
});

export type ICreateProjectMilestone = z.infer<
  typeof createProjectMilestoneSchema
>;

export const editProjectSchema = createProjectMilestoneSchema.extend({
  id: z
    .string({ required_error: "Project Id is requred" })
    .min(1, "Project Id is required"),
});

export type IEditProject = z.infer<typeof editProjectSchema>;
