import { z } from "zod";

export const createTeamSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .min(2, "Name should be more than 2 characters"),
  type: z.enum(["PERSONAL", "TEAM"]),
  profileImage: z.any(),
});
export type ICreateTeam = z.infer<typeof createTeamSchema>;
