import type { FastifyReply, FastifyRequest } from "fastify";
import { ok } from "../../utils/response.js";
import { historyParamsSchema, historyQuerySchema, markWornSchema } from "./outfitHistory.schema.js";
import * as service from "./outfitHistory.service.js";

export async function markWorn(request: FastifyRequest, reply: FastifyReply) {
  const input = markWornSchema.parse(request.body);
  return ok(reply, "Outfit wear history recorded", { history: await service.markWorn(request.user!.id, input) }, 201);
}

export async function list(request: FastifyRequest, reply: FastifyReply) {
  const input = historyQuerySchema.parse(request.query);
  return ok(reply, "Outfit history fetched", { history: await service.listHistory(request.user!.id, input) });
}

export async function recent(request: FastifyRequest, reply: FastifyReply) {
  return ok(reply, "Recent outfit history fetched", { history: await service.recentHistory(request.user!.id) });
}

export async function calendar(request: FastifyRequest, reply: FastifyReply) {
  return ok(reply, "Outfit history calendar fetched", { calendar: await service.calendar(request.user!.id) });
}

export async function remove(request: FastifyRequest, reply: FastifyReply) {
  const { id } = historyParamsSchema.parse(request.params);
  await service.deleteHistory(request.user!.id, id);
  return ok(reply, "Outfit history deleted");
}
