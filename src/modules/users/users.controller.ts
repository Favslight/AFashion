import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { ok } from "../../utils/response.js";
import { getMe } from "../auth/auth.service.js";
import * as service from "./users.service.js";

const updateUserSchema = z.object({
  full_name: z.string().trim().min(2).max(120).optional()
});

export async function me(request: FastifyRequest, reply: FastifyReply) {
  const user = await getMe(request.user!.id);
  return ok(reply, "User fetched", { user });
}

export async function updateMe(request: FastifyRequest, reply: FastifyReply) {
  const input = updateUserSchema.parse(request.body);
  const user = await service.updateCurrentUser(request.user!.id, input);
  return ok(reply, "User updated", { user });
}
