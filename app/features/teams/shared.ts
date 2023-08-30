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
    .union(
      [
        z.number({ required_error: "Team Id is required" }),
        z
          .string({ required_error: "Team Id is requred" })
          .min(1, "Team Id is required"),
      ],
      {
        errorMap: (issue, ctx) => {
          if (issue.code === z.ZodIssueCode.invalid_union) {
            return { message: "Invalid user" };
          }
          return { message: ctx.defaultError };
        },
      },
    )
    .transform((v, ctx) => {
      const parsed = Number(v);
      if (isNaN(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid team",
        });

        return z.NEVER;
      }
      return parsed;
    }),
  name: z
    .string({ required_error: "Name is required" })
    .min(2, "Name should be more than 2 characters"),
  profileImage: z.any(),
});
export type IEditTeam = z.infer<typeof editTeamSchema>;

// TEAM MEMBER
export const editTeamMemberSchema = z.object({
  id: z
    .union([z.number(), z.string()], {
      // invalid_type_error: "Invalid team",
      // required_error: "Team is required",
      errorMap: (issue, ctx) => {
        if (issue.code === z.ZodIssueCode.invalid_union) {
          return { message: "Invalid team" };
        }
        return { message: ctx.defaultError };
      },
    })
    .transform((v, ctx) => {
      const parsed = Number(v);
      if (isNaN(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid team",
        });

        return z.NEVER;
      }
      return parsed;
    }),

  userId: z
    .union([z.number(), z.string()], {
      errorMap: (issue, ctx) => {
        // invalid_type_error: "Invalid user",
        // required_error: "User is required",
        if (issue.code === z.ZodIssueCode.invalid_union) {
          return { message: "Invalid user" };
        }
        return { message: ctx.defaultError };
      },
    })
    .transform((v, ctx) => {
      const parsed = Number(v);
      if (isNaN(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid user",
        });

        return z.NEVER;
      }
      return parsed;
    }),

  role: z.enum(["OWNER", "ADMIN", "MEMBER"], {
    required_error: "Role is required",
  }),
});
export type IEditTeamMember = z.infer<typeof editTeamMemberSchema>;

export const deleteTeamMemberSchema = z.object({
  id: z
    .union([z.number(), z.string()], {
      errorMap: (issue, ctx) => {
        // invalid_type_error: "Invalid team",
        // required_error: "Team is required",
        if (issue.code === z.ZodIssueCode.invalid_union) {
          return { message: "Invalid team" };
        }
        return { message: ctx.defaultError };
      },
    })
    .transform((v, ctx) => {
      const parsed = Number(v);
      if (isNaN(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid team",
        });

        return z.NEVER;
      }
      return parsed;
    }),

  userId: z
    .union([z.number(), z.string()], {
      errorMap: (issue, ctx) => {
        // invalid_type_error: "Invalid user",
        // required_error: "User is required",
        if (issue.code === z.ZodIssueCode.invalid_union) {
          return { message: "Invalid user" };
        }
        return { message: ctx.defaultError };
      },
    })
    .transform((v, ctx) => {
      const parsed = Number(v);
      if (isNaN(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid user",
        });

        return z.NEVER;
      }
      return parsed;
    }),
});
export type IDeleteTeamMember = z.infer<typeof deleteTeamMemberSchema>;
