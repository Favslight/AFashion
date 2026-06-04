import type { FastifyReply, FastifyRequest } from "fastify";
import { ok } from "../../utils/response.js";
import { discoveryQuerySchema, discoverySlugParamsSchema } from "./discovery.schema.js";
import * as service from "./discovery.service.js";

export async function feed(request: FastifyRequest, reply: FastifyReply) {
  const input = discoveryQuerySchema.parse(request.query);
  return ok(reply, "Discovery feed fetched", { posts: await service.feed(input) });
}

export async function trending(request: FastifyRequest, reply: FastifyReply) {
  const input = discoveryQuerySchema.parse(request.query);
  return ok(reply, "Trending feed fetched", { posts: await service.trending(input) });
}

export async function aesthetics(request: FastifyRequest, reply: FastifyReply) {
  const { slug } = discoverySlugParamsSchema.parse(request.params);
  const input = discoveryQuerySchema.parse(request.query);
  return ok(reply, "Aesthetic discovery feed fetched", { posts: await service.byAesthetic(slug, input) });
}

export async function occasions(request: FastifyRequest, reply: FastifyReply) {
  const { slug } = discoverySlugParamsSchema.parse(request.params);
  const input = discoveryQuerySchema.parse(request.query);
  return ok(reply, "Occasion discovery feed fetched", { posts: await service.byOccasion(slug, input) });
}

export async function forYou(request: FastifyRequest, reply: FastifyReply) {
  const input = discoveryQuerySchema.parse(request.query);
  return ok(reply, "For You feed fetched", { posts: await service.forYou(request.user!.id, input) });
}
