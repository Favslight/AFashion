import type { FastifyReply, FastifyRequest } from "fastify";
import { ok } from "../../utils/response.js";
import * as service from "./admin.service.js";

export async function dashboard(_request: FastifyRequest, reply: FastifyReply) {
  const dashboardData = await service.getDashboard();
  return ok(reply, "Admin dashboard fetched", dashboardData);
}
