import type { FastifyReply, FastifyRequest } from "fastify";
import { ok } from "../../utils/response.js";
import { patchStyleProfileSchema, styleProfileSchema } from "./onboarding.schema.js";
import * as service from "./onboarding.service.js";

export async function createProfile(request: FastifyRequest, reply: FastifyReply) {
  const input = styleProfileSchema.parse(request.body);
  const data = await service.upsertProfile(request.user!.id, input);
  return ok(reply, "Style profile saved", data, 201);
}

export async function getProfile(request: FastifyRequest, reply: FastifyReply) {
  const data = await service.getProfile(request.user!.id);
  return ok(reply, "Style profile fetched", data);
}

export async function patchProfile(request: FastifyRequest, reply: FastifyReply) {
  const input = patchStyleProfileSchema.parse(request.body);
  const data = await service.patchProfile(request.user!.id, input);
  return ok(reply, "Style profile updated", data);
}
