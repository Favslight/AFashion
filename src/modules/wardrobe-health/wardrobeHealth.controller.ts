import type { FastifyReply, FastifyRequest } from "fastify";
import { ok } from "../../utils/response.js";
import { reportParamsSchema, wardrobeHealthAnalyzeSchema } from "./wardrobeHealth.schema.js";
import * as service from "./wardrobeHealth.service.js";

export async function analyze(request: FastifyRequest, reply: FastifyReply) {
  const input = wardrobeHealthAnalyzeSchema.parse(request.body ?? {});
  const report = await service.analyzeWardrobeHealth(request.user!.id, input);
  return ok(reply, "Wardrobe health analyzed", report, 201);
}

export async function latest(request: FastifyRequest, reply: FastifyReply) {
  const report = await service.latestReport(request.user!.id);
  return ok(reply, "Latest wardrobe health report fetched", { report });
}

export async function reports(request: FastifyRequest, reply: FastifyReply) {
  const reportList = await service.listReports(request.user!.id);
  return ok(reply, "Wardrobe health reports fetched", { reports: reportList });
}

export async function getReport(request: FastifyRequest, reply: FastifyReply) {
  const { id } = reportParamsSchema.parse(request.params);
  const report = await service.getReport(request.user!.id, id);
  return ok(reply, "Wardrobe health report fetched", { report });
}
