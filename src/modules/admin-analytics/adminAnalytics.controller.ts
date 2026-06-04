import type { FastifyReply, FastifyRequest } from "fastify";
import { ok } from "../../utils/response.js";
import * as service from "./adminAnalytics.service.js";

export async function users(_request: FastifyRequest, reply: FastifyReply) {
  return ok(reply, "User analytics fetched", await service.userAnalytics());
}

export async function wardrobe(_request: FastifyRequest, reply: FastifyReply) {
  return ok(reply, "Wardrobe analytics fetched", await service.wardrobeAnalytics());
}

export async function outfits(_request: FastifyRequest, reply: FastifyReply) {
  return ok(reply, "Outfit analytics fetched", await service.outfitAnalytics());
}

export async function aiUsage(_request: FastifyRequest, reply: FastifyReply) {
  return ok(reply, "AI usage analytics fetched", await service.aiUsageAnalytics());
}

export async function subscriptions(_request: FastifyRequest, reply: FastifyReply) {
  return ok(reply, "Subscription analytics fetched", await service.subscriptionAnalytics());
}

export async function vision(_request: FastifyRequest, reply: FastifyReply) {
  return ok(reply, "Vision analytics fetched", await service.visionAnalytics());
}

export async function fashionMemory(_request: FastifyRequest, reply: FastifyReply) {
  return ok(reply, "Fashion memory analytics fetched", await service.fashionMemoryAnalytics());
}

export async function community(_request: FastifyRequest, reply: FastifyReply) {
  return ok(reply, "Community analytics fetched", await service.communityAnalytics());
}
