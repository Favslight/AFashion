import type { FastifyReply, FastifyRequest } from "fastify";
import { ok } from "../../utils/response.js";
import { boardCreateSchema, boardItemCreateSchema, boardItemParamsSchema, boardParamsSchema, boardUpdateSchema } from "./styleBoards.schema.js";
import * as service from "./styleBoards.service.js";

export async function create(request: FastifyRequest, reply: FastifyReply) {
  const input = boardCreateSchema.parse(request.body);
  return ok(reply, "Style board created", { board: await service.createBoard(request.user!.id, input) }, 201);
}

export async function list(request: FastifyRequest, reply: FastifyReply) {
  return ok(reply, "Style boards fetched", { boards: await service.listBoards(request.user!.id) });
}

export async function getOne(request: FastifyRequest, reply: FastifyReply) {
  const { id } = boardParamsSchema.parse(request.params);
  return ok(reply, "Style board fetched", await service.getBoard(request.user!.id, id));
}

export async function update(request: FastifyRequest, reply: FastifyReply) {
  const { id } = boardParamsSchema.parse(request.params);
  const input = boardUpdateSchema.parse(request.body);
  return ok(reply, "Style board updated", { board: await service.updateBoard(request.user!.id, id, input) });
}

export async function remove(request: FastifyRequest, reply: FastifyReply) {
  const { id } = boardParamsSchema.parse(request.params);
  await service.deleteBoard(request.user!.id, id);
  return ok(reply, "Style board deleted");
}

export async function addItem(request: FastifyRequest, reply: FastifyReply) {
  const { id } = boardParamsSchema.parse(request.params);
  const input = boardItemCreateSchema.parse(request.body);
  return ok(reply, "Style board item added", { item: await service.addItem(request.user!.id, id, input.post_id) }, 201);
}

export async function removeItem(request: FastifyRequest, reply: FastifyReply) {
  const { id, itemId } = boardItemParamsSchema.parse(request.params);
  await service.removeItem(request.user!.id, id, itemId);
  return ok(reply, "Style board item removed");
}
