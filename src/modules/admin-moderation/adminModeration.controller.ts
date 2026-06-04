import type { FastifyReply, FastifyRequest } from "fastify";
import { ok } from "../../utils/response.js";
import { auditAdminAction } from "../admin/admin.middleware.js";
import { uuidParamsSchema } from "../admin/admin.schema.js";
import {
  adminOutfitQuerySchema,
  adminWardrobeQuerySchema,
  blockedKeywordCreateSchema,
  blockedKeywordQuerySchema,
  blockedKeywordUpdateSchema,
  moderationReportStatusSchema,
  moderationReportsQuerySchema
} from "./adminModeration.schema.js";
import * as service from "./adminModeration.service.js";

export async function listReports(request: FastifyRequest, reply: FastifyReply) {
  const input = moderationReportsQuerySchema.parse(request.query);
  const data = await service.listReports(input);
  return ok(reply, "Moderation reports fetched", data);
}

export async function getReport(request: FastifyRequest, reply: FastifyReply) {
  const { id } = uuidParamsSchema.parse(request.params);
  const report = await service.getReport(id);
  return ok(reply, "Moderation report fetched", { report });
}

export async function updateReportStatus(request: FastifyRequest, reply: FastifyReply) {
  const { id } = uuidParamsSchema.parse(request.params);
  const input = moderationReportStatusSchema.parse(request.body);
  const report = await service.updateReportStatus(request.admin!.id, id, input);
  await auditAdminAction(request, {
    action: "MODERATION_REPORT_STATUS_UPDATED",
    entity_type: "moderation_report",
    entity_id: id,
    metadata: input
  });
  return ok(reply, "Moderation report updated", { report });
}

export async function createBlockedKeyword(request: FastifyRequest, reply: FastifyReply) {
  const input = blockedKeywordCreateSchema.parse(request.body);
  const keyword = await service.createBlockedKeyword(request.admin!.id, input);
  await auditAdminAction(request, {
    action: "BLOCKED_KEYWORD_CREATED",
    entity_type: "blocked_keyword",
    entity_id: (keyword as { id?: string } | null)?.id,
    metadata: input
  });
  return ok(reply, "Blocked keyword created", { keyword }, 201);
}

export async function listBlockedKeywords(request: FastifyRequest, reply: FastifyReply) {
  const input = blockedKeywordQuerySchema.parse(request.query);
  const data = await service.listBlockedKeywords(input);
  return ok(reply, "Blocked keywords fetched", data);
}

export async function updateBlockedKeyword(request: FastifyRequest, reply: FastifyReply) {
  const { id } = uuidParamsSchema.parse(request.params);
  const input = blockedKeywordUpdateSchema.parse(request.body);
  const keyword = await service.updateBlockedKeyword(id, input);
  await auditAdminAction(request, {
    action: "BLOCKED_KEYWORD_UPDATED",
    entity_type: "blocked_keyword",
    entity_id: id,
    metadata: { changed_fields: Object.keys(input) }
  });
  return ok(reply, "Blocked keyword updated", { keyword });
}

export async function deleteBlockedKeyword(request: FastifyRequest, reply: FastifyReply) {
  const { id } = uuidParamsSchema.parse(request.params);
  await service.deleteBlockedKeyword(id);
  await auditAdminAction(request, {
    action: "BLOCKED_KEYWORD_DELETED",
    entity_type: "blocked_keyword",
    entity_id: id
  });
  return ok(reply, "Blocked keyword deleted");
}

export async function listWardrobeItems(request: FastifyRequest, reply: FastifyReply) {
  const input = adminWardrobeQuerySchema.parse(request.query);
  const data = await service.listWardrobeItems(input);
  return ok(reply, "Wardrobe items fetched", data);
}

export async function getWardrobeItem(request: FastifyRequest, reply: FastifyReply) {
  const { id } = uuidParamsSchema.parse(request.params);
  const item = await service.getWardrobeItem(id);
  return ok(reply, "Wardrobe item fetched", { item });
}

export async function deleteWardrobeItem(request: FastifyRequest, reply: FastifyReply) {
  const { id } = uuidParamsSchema.parse(request.params);
  await service.deleteWardrobeItem(id);
  await auditAdminAction(request, {
    action: "WARDROBE_ITEM_DELETED",
    entity_type: "wardrobe_item",
    entity_id: id
  });
  return ok(reply, "Wardrobe item deleted");
}

export async function listOutfits(request: FastifyRequest, reply: FastifyReply) {
  const input = adminOutfitQuerySchema.parse(request.query);
  const data = await service.listOutfits(input);
  return ok(reply, "Outfits fetched", data);
}

export async function getOutfit(request: FastifyRequest, reply: FastifyReply) {
  const { id } = uuidParamsSchema.parse(request.params);
  const outfit = await service.getOutfit(id);
  return ok(reply, "Outfit fetched", outfit);
}

export async function deleteOutfit(request: FastifyRequest, reply: FastifyReply) {
  const { id } = uuidParamsSchema.parse(request.params);
  await service.deleteOutfit(id);
  await auditAdminAction(request, {
    action: "OUTFIT_DELETED",
    entity_type: "outfit",
    entity_id: id
  });
  return ok(reply, "Outfit deleted");
}
