import type { FastifyReply, FastifyRequest } from "fastify";
import { ok } from "../../utils/response.js";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
  verifyEmailSchema
} from "./auth.schema.js";
import * as authService from "./auth.service.js";

export async function signup(request: FastifyRequest, reply: FastifyReply) {
  const input = signupSchema.parse(request.body);
  const data = await authService.signup(input);
  return ok(reply, "Account created. Check your email for verification.", data, 201);
}

export async function login(request: FastifyRequest, reply: FastifyReply) {
  const input = loginSchema.parse(request.body);
  const data = await authService.login(input);
  return ok(reply, "Logged in successfully", data);
}

export async function verifyEmail(request: FastifyRequest, reply: FastifyReply) {
  const input = verifyEmailSchema.parse(request.body);
  const user = await authService.verifyEmail(input.token);
  return ok(reply, "Email verified successfully", { user });
}

export async function forgotPassword(request: FastifyRequest, reply: FastifyReply) {
  const input = forgotPasswordSchema.parse(request.body);
  await authService.forgotPassword(input.email);
  return ok(reply, "If the email exists, a reset token has been sent");
}

export async function resetPassword(request: FastifyRequest, reply: FastifyReply) {
  const input = resetPasswordSchema.parse(request.body);
  await authService.resetPassword(input);
  return ok(reply, "Password reset successfully");
}

export async function me(request: FastifyRequest, reply: FastifyReply) {
  const user = await authService.getMe(request.user!.id);
  return ok(reply, "Current user fetched", { user });
}
