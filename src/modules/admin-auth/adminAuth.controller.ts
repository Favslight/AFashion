import type { FastifyReply, FastifyRequest } from "fastify";
import { ok } from "../../utils/response.js";
import { adminLoginSchema } from "./adminAuth.schema.js";
import * as service from "./adminAuth.service.js";

export async function login(request: FastifyRequest, reply: FastifyReply) {
  const input = adminLoginSchema.parse(request.body);
  const data = await service.login(input);
  return ok(reply, "Admin logged in successfully", data);
}

export async function me(request: FastifyRequest, reply: FastifyReply) {
  const admin = await service.getMe(request.admin!.id);
  return ok(reply, "Current admin fetched", { admin });
}
