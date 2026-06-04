import { z } from "zod";

export const signupSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128)
});

export const loginSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1)
});

export const verifyEmailSchema = z.object({
  token: z.string().min(32)
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase())
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32),
  password: z.string().min(8).max(128)
});
