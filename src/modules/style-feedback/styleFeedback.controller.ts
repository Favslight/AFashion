import type { FastifyReply, FastifyRequest } from "fastify";
import { ok } from "../../utils/response.js";
import { outfitFeedbackSchema, outfitIdParamsSchema } from "./styleFeedback.schema.js";
import * as service from "./styleFeedback.service.js";

export async function create(request: FastifyRequest, reply: FastifyReply) {
  const { outfitId } = outfitIdParamsSchema.parse(request.params);
  const input = outfitFeedbackSchema.parse(request.body);
  return ok(reply, "Outfit feedback saved", { feedback: await service.createOutfitFeedback(request.user!.id, outfitId, input) }, 201);
}

export async function forOutfit(request: FastifyRequest, reply: FastifyReply) {
  const { outfitId } = outfitIdParamsSchema.parse(request.params);
  return ok(reply, "Outfit feedback fetched", { feedback: await service.getOutfitFeedback(request.user!.id, outfitId) });
}

export async function me(request: FastifyRequest, reply: FastifyReply) {
  return ok(reply, "My style feedback fetched", { feedback: await service.myFeedback(request.user!.id) });
}
