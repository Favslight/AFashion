import type { FastifyReply, FastifyRequest } from "fastify";
import { ok } from "../../utils/response.js";
import { eventCreateSchema, eventGenerateSchema, eventParamsSchema, eventUpdateSchema, selectOutfitSchema } from "./events.schema.js";
import * as service from "./events.service.js";

export async function create(request: FastifyRequest, reply: FastifyReply) {
  const input = eventCreateSchema.parse(request.body);
  return ok(reply, "Event created", { event: await service.createEvent(request.user!.id, input) }, 201);
}

export async function list(request: FastifyRequest, reply: FastifyReply) {
  return ok(reply, "Events fetched", { events: await service.listEvents(request.user!.id) });
}

export async function upcoming(request: FastifyRequest, reply: FastifyReply) {
  return ok(reply, "Upcoming events fetched", { events: await service.upcomingEvents(request.user!.id) });
}

export async function getOne(request: FastifyRequest, reply: FastifyReply) {
  const { id } = eventParamsSchema.parse(request.params);
  return ok(reply, "Event fetched", { event: await service.getEvent(request.user!.id, id) });
}

export async function update(request: FastifyRequest, reply: FastifyReply) {
  const { id } = eventParamsSchema.parse(request.params);
  const input = eventUpdateSchema.parse(request.body);
  return ok(reply, "Event updated", { event: await service.updateEvent(request.user!.id, id, input) });
}

export async function remove(request: FastifyRequest, reply: FastifyReply) {
  const { id } = eventParamsSchema.parse(request.params);
  await service.deleteEvent(request.user!.id, id);
  return ok(reply, "Event deleted");
}

export async function generateOutfit(request: FastifyRequest, reply: FastifyReply) {
  const { id } = eventParamsSchema.parse(request.params);
  const input = eventGenerateSchema.parse(request.body ?? {});
  return ok(reply, "Event outfit generated", await service.generateEventOutfit(request.user!.id, id, input), 201);
}

export async function selectOutfit(request: FastifyRequest, reply: FastifyReply) {
  const { id } = eventParamsSchema.parse(request.params);
  const input = selectOutfitSchema.parse(request.body);
  return ok(reply, "Event outfit selected", { event: await service.selectOutfit(request.user!.id, id, input.outfit_id) });
}

export async function sendReminder(request: FastifyRequest, reply: FastifyReply) {
  const { id } = eventParamsSchema.parse(request.params);
  return ok(reply, "Event reminder sent", await service.sendReminder(request.user!.id, id));
}
