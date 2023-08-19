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
  projectId: z
    .union([
      z.number({ required_error: "Project Id is required" }),
      z
        .string({ required_error: "Project Id is requred" })
        .min(1, "Project Id is required"),
    ])
    .transform((v) => Number(v)),
  // boardId: z.number({ required_error: "Board Id is required" }),
  status: z.enum(statusValues),

  // assignees
  assigneesId: z
    .array(z.union([z.number(), z.string()]).transform((v) => Number(v)))
    .default([]),
});

export type ICreateProjectMilestone = z.infer<
  typeof createProjectMilestoneSchema
>;

export const editMilestoneSchema = createProjectMilestoneSchema.extend({
  id: z
    .union([
      z
        .string({ required_error: "Milestone is requred" })
        .min(1, "Milestone is required"),
      z.number({ required_error: "Milestone is required" }),
    ])
    .transform((v) => Number(v)),
});

export type IEditMilestone = z.infer<typeof editMilestoneSchema>;
