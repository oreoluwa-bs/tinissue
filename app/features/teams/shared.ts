import { z } from "zod";

export const createTeamSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .min(2, "Name should be more than 2 characters"),
  type: z.enum(["PERSONAL", "TEAM"]),
  profileImage: z.any(),
});
export type ICreateTeam = z.infer<typeof createTeamSchema>;

export const editTeamSchema = z.object({
  id: z
    .union([
      z.number({ required_error: "Team Id is required" }),
      z
        .string({ required_error: "Team Id is requred" })
        .min(1, "Team Id is required"),
    ])
    .transform((v) => Number(v)),
  name: z
    .string({ required_error: "Name is required" })
    .min(2, "Name should be more than 2 characters"),
  profileImage: z.any(),
});
export type IEditTeam = z.infer<typeof editTeamSchema>;
