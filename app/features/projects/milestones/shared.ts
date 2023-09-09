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
  description: z.string().nullable().optional(),
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

  dueAt: z
    .string()
    .nullish()
    .transform((v, ctx) => {
      // If the value is undefined it is removed from the ouput later on
      if (v === undefined) {
        return undefined;
      }

      // If the value is null or empty then set the date to null
      if (v === null || v === "") {
        return null;
      }

      if (isNaN(Date.parse(v))) {
        ctx.addIssue({
          code: "custom",
          path: ["dueAt"],
          message: "Invalid date and time",
        });
        return z.NEVER;
      }

      // return v;
      return new Date(v);
    }),
});

export type ICreateProjectMilestone = z.infer<
  typeof createProjectMilestoneSchema
>;

export const editMilestoneSchema = z.object({
  id: z
    .union([
      z
        .string({ required_error: "Milestone is requred" })
        .min(1, "Milestone is required"),
      z.number({ required_error: "Milestone is required" }),
    ])
    .transform((v) => Number(v)),

  status: z.enum(statusValues).optional(),

  name: z
    .string({ required_error: "Name is required" })
    .min(2, "Name should be more than 2 characters"),
  description: z.string().nullable().optional(),

  // assignees
  assigneesId: z
    .array(z.union([z.number(), z.string()]).transform((v) => Number(v)))
    .default([]),

  dueAt: z
    .string()
    .nullish()
    .transform((v, ctx) => {
      // If the value is undefined it is removed from the ouput later on
      if (v === undefined) {
        return undefined;
      }

      // If the value is null or empty then set the date to null
      if (v === null || v === "") {
        return null;
      }

      if (isNaN(Date.parse(v))) {
        ctx.addIssue({
          code: "custom",
          path: ["dueAt"],
          message: "Invalid date and time",
        });
        return z.NEVER;
      }

      // return v;
      return new Date(v);
    }),
});

export type IEditMilestone = z.infer<typeof editMilestoneSchema>;

export const deleteMilestoneSchema = z.object({
  id: z
    .union([
      z
        .string({ required_error: "Milestone is requred" })
        .min(1, "Milestone is required"),
      z.number({ required_error: "Milestone is required" }),
    ])
    .transform((v) => Number(v)),
});
export type IDeleteMilestone = z.infer<typeof deleteMilestoneSchema>;

export const changeMilestoneStatusSchema = z.object({
  id: z
    .union([
      z
        .string({ required_error: "Milestone is requred" })
        .min(1, "Milestone is required"),
      z.number({ required_error: "Milestone is required" }),
    ])
    .transform((v) => Number(v)),
  status: z.enum(statusValues),
});
export type IChangeMilestoneStatus = z.infer<
  typeof changeMilestoneStatusSchema
>;

/**
 *
 *
 *
 * ASSSIGNEEES
 */

export const createAssigneesSchema = z.object({
  milestoneId: z
    .union([
      z
        .string({ required_error: "Milestone is requred" })
        .min(1, "Milestone is required"),
      z.number({ required_error: "Milestone is required" }),
    ])
    .transform((v) => Number(v)),

  assigneesId: z
    .array(z.union([z.number(), z.string()]).transform((v) => Number(v)))
    .default([]),
});

export type ICreateAssignees = z.infer<typeof createAssigneesSchema>;

export const editAssigneeSchema = z.object({
  milestoneId: z
    .union([
      z
        .string({ required_error: "Milestone is requred" })
        .min(1, "Milestone is required"),
      z.number({ required_error: "Milestone is required" }),
    ])
    .transform((v) => Number(v)),

  assigneeId: z.union([z.number(), z.string()]).transform((v) => Number(v)),
});

export const deleteAssigneeSchema = editAssigneeSchema;

export type IEditAssignee = z.infer<typeof editAssigneeSchema>;
export type IDeleteAssignee = z.infer<typeof deleteAssigneeSchema>;
