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

export const editProjectMemberSchema = z.object({
  id: z
    .union([z.number(), z.string()], {
      errorMap: (issue, ctx) => {
        if (issue.code === z.ZodIssueCode.invalid_union) {
          return { message: "Invalid project" };
        }
        return { message: ctx.defaultError };
      },
    })
    .transform((v, ctx) => {
      const parsed = Number(v);
      if (isNaN(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid project",
        });

        return z.NEVER;
      }
      return parsed;
    }),

  userId: z
    .union([z.number(), z.string()], {
      errorMap: (issue, ctx) => {
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
export type IEditProjectMember = z.infer<typeof editProjectMemberSchema>;

export const deleteProjectMemberSchema = z.object({
  id: z
    .union([z.number(), z.string()], {
      errorMap: (issue, ctx) => {
        // invalid_type_error: "Invalid team",
        // required_error: "Team is required",
        if (issue.code === z.ZodIssueCode.invalid_union) {
          return { message: "Invalid project" };
        }
        return { message: ctx.defaultError };
      },
    })
    .transform((v, ctx) => {
      const parsed = Number(v);
      if (isNaN(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid project",
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
export type IDeleteProjectMember = z.infer<typeof deleteProjectMemberSchema>;

/**
 * Project Invitations
 */
export const inviteToProjectSchema = z.object({
  projectId: z
    .union([z.number(), z.string()], {
      errorMap: (issue, ctx) => {
        if (issue.code === z.ZodIssueCode.invalid_union) {
          return { message: "Invalid project" };
        }
        return { message: ctx.defaultError };
      },
    })
    .transform((v, ctx) => {
      const parsed = Number(v);
      if (isNaN(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid project",
        });

        return z.NEVER;
      }
      return parsed;
    }),

  email: z.string({ required_error: "Email is required" }).email(),
});
export type IInviteToProject = z.infer<typeof inviteToProjectSchema>;

export const revokeInviteToProjectSchema = z.object({
  projectId: z
    .union([z.number(), z.string()], {
      errorMap: (issue, ctx) => {
        if (issue.code === z.ZodIssueCode.invalid_union) {
          return { message: "Invalid project" };
        }
        return { message: ctx.defaultError };
      },
    })
    .transform((v, ctx) => {
      const parsed = Number(v);
      if (isNaN(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid project",
        });

        return z.NEVER;
      }
      return parsed;
    }),
  inviteId: z
    .union([z.number(), z.string()], {
      errorMap: (issue, ctx) => {
        if (issue.code === z.ZodIssueCode.invalid_union) {
          return { message: "Invalid invite" };
        }
        return { message: ctx.defaultError };
      },
    })
    .transform((v, ctx) => {
      const parsed = Number(v);
      if (isNaN(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid invite",
        });

        return z.NEVER;
      }
      return parsed;
    }),
});
export type IRevokeInviteToProject = z.infer<
  typeof revokeInviteToProjectSchema
>;
