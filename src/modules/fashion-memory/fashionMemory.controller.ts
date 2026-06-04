import type { FastifyReply, FastifyRequest } from "fastify";
import { ok } from "../../utils/response.js";
import { memoryCreateSchema, memoryParamsSchema, memoryUpdateSchema } from "./fashionMemory.schema.js";
import * as service from "./fashionMemory.service.js";

export async function list(request: FastifyRequest, reply: FastifyReply) {
  return ok(reply, "Fashion memory fetched", { memory: await service.listMemory(request.user!.id) });
}

export async function create(request: FastifyRequest, reply: FastifyReply) {
  const input = memoryCreateSchema.parse(request.body);
  return ok(reply, "Fashion memory created", { memory: await service.createMemory(request.user!.id, input) }, 201);
}

export async function update(request: FastifyRequest, reply: FastifyReply) {
  const { id } = memoryParamsSchema.parse(request.params);
  const input = memoryUpdateSchema.parse(request.body);
  return ok(reply, "Fashion memory updated", { memory: await service.updateMemory(request.user!.id, id, input) });
}

export async function remove(request: FastifyRequest, reply: FastifyReply) {
  const { id } = memoryParamsSchema.parse(request.params);
  await service.deleteMemory(request.user!.id, id);
  return ok(reply, "Fashion memory deleted");
}

export async function rebuild(request: FastifyRequest, reply: FastifyReply) {
  return ok(reply, "Fashion memory rebuilt", await service.rebuildMemory(request.user!.id));
}

export async function insights(request: FastifyRequest, reply: FastifyReply) {
  return ok(reply, "Fashion memory insights fetched", await service.insights(request.user!.id));
}
