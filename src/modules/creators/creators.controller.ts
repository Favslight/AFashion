import type { FastifyReply, FastifyRequest } from "fastify";
import { ok } from "../../utils/response.js";
import { creatorParamsSchema, creatorProfilePatchSchema, creatorProfileSchema } from "./creators.schema.js";
import * as service from "./creators.service.js";

export async function createProfile(request: FastifyRequest, reply: FastifyReply) {
  const input = creatorProfileSchema.parse(request.body);
  return ok(reply, "Creator profile saved", { profile: await service.createProfile(request.user!.id, input) }, 201);
}

export async function myProfile(request: FastifyRequest, reply: FastifyReply) {
  return ok(reply, "Creator profile fetched", { profile: await service.myProfile(request.user!.id) });
}

export async function getCreator(request: FastifyRequest, reply: FastifyReply) {
  const { id } = creatorParamsSchema.parse(request.params);
  return ok(reply, "Creator fetched", { creator: await service.getCreator(id) });
}

export async function updateProfile(request: FastifyRequest, reply: FastifyReply) {
  const input = creatorProfilePatchSchema.parse(request.body);
  return ok(reply, "Creator profile updated", { profile: await service.updateProfile(request.user!.id, input) });
}

export async function deleteProfile(request: FastifyRequest, reply: FastifyReply) {
  await service.deleteProfile(request.user!.id);
  return ok(reply, "Creator profile deleted");
}

export async function follow(request: FastifyRequest, reply: FastifyReply) {
  const { id } = creatorParamsSchema.parse(request.params);
  return ok(reply, "Creator followed", { creator: await service.followCreator(request.user!.id, id) });
}

export async function unfollow(request: FastifyRequest, reply: FastifyReply) {
  const { id } = creatorParamsSchema.parse(request.params);
  return ok(reply, "Creator unfollowed", { creator: await service.unfollowCreator(request.user!.id, id) });
}

export async function followers(request: FastifyRequest, reply: FastifyReply) {
  const { id } = creatorParamsSchema.parse(request.params);
  return ok(reply, "Creator followers fetched", { followers: await service.followers(id) });
}

export async function posts(request: FastifyRequest, reply: FastifyReply) {
  const { id } = creatorParamsSchema.parse(request.params);
  return ok(reply, "Creator posts fetched", { posts: await service.posts(id) });
}
