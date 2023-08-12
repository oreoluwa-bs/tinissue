import { z } from "zod";

export const credentialsLoginSchema = z.object({
  email: z.string({ required_error: "Email is required" }).email(),
  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password cannot be less than 6 charaters"),
});
export type ICredentialsLogin = z.infer<typeof credentialsLoginSchema>;

export const credentialsSignupSchema = z.object({
  firstName: z
    .string({ required_error: "First name is required" })
    .min(1, "First name is required"),
  lastName: z
    .string({ required_error: "Last name is required" })
    .min(1, "Last name is required"),
  email: z.string({ required_error: "Email is required" }).email(),
  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password cannot be less than 6 charaters"),
});

export type ICredentialsSignUp = z.infer<typeof credentialsSignupSchema>;
