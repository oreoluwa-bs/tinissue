import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .min(2, "Name should be more than 2 characters"),
  description: z.string().nullable(),
  teamId: z.number({ required_error: "Team Id is required" }),
});

export type ICreateProject = z.infer<typeof createProjectSchema>;

export const editProjectSchema = createProjectSchema.extend({
  id: z
    .string({ required_error: "Project Id is requred" })
    .min(1, "Project Id is required"),
});

export type IEditProject = z.infer<typeof editProjectSchema>;
