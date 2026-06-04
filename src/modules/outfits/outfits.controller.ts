import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { ok } from "../../utils/response.js";
import { generateOutfitSchema } from "./outfits.schema.js";
import * as service from "./outfits.service.js";

const paramsSchema = z.object({ id: z.string().uuid() });

export async function listOccasions(_request: FastifyRequest, reply: FastifyReply) {
  const occasions = await service.listOccasions();
  return ok(reply, "Occasions fetched", { occasions });
}

export async function generate(request: FastifyRequest, reply: FastifyReply) {
  const input = generateOutfitSchema.parse(request.body);
  const outfit = await service.generateOutfit(request.user!.id, input);
  return ok(reply, "Outfit generated", outfit, 201);
}

export async function list(request: FastifyRequest, reply: FastifyReply) {
  const outfits = await service.listOutfits(request.user!.id);
  return ok(reply, "Outfits fetched", { outfits });
}

export async function getOne(request: FastifyRequest, reply: FastifyReply) {
  const { id } = paramsSchema.parse(request.params);
  const outfit = await service.getOutfit(request.user!.id, id);
  return ok(reply, "Outfit fetched", outfit);
}

export async function save(request: FastifyRequest, reply: FastifyReply) {
  const { id } = paramsSchema.parse(request.params);
  const outfit = await service.saveOutfit(request.user!.id, id);
  return ok(reply, "Outfit saved", { outfit });
}

export async function remove(request: FastifyRequest, reply: FastifyReply) {
  const { id } = paramsSchema.parse(request.params);
  await service.deleteOutfit(request.user!.id, id);
  return ok(reply, "Outfit deleted");
}
