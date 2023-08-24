import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .min(2, "Name should be more than 2 characters"),
  description: z.string().nullable(),
  teamId: z
    .union([
      z.number({ required_error: "Team Id is required" }),
      z
        .string({ required_error: "Team Id is requred" })
        .min(1, "Team Id is required"),
    ])
    .transform((v) => Number(v)),
});

export type ICreateProject = z.infer<typeof createProjectSchema>;

export const editProjectSchema = z.object({
  id: z
    .union([
      z.number({ required_error: "Project Id is required" }),
      z
        .string({ required_error: "Project Id is requred" })
        .min(1, "Project Id is required"),
    ])
    .transform((v) => Number(v)),
  name: z
    .string({ required_error: "Name is required" })
    .min(2, "Name should be more than 2 characters"),
  description: z.string().nullable(),
});

export type IEditProject = z.infer<typeof editProjectSchema>;
