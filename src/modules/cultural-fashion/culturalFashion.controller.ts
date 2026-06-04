import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { ok } from "../../utils/response.js";
import { auditAdminAction } from "../admin/admin.middleware.js";
import {
  culturalComponentCreateSchema,
  culturalComponentUpdateSchema,
  culturalIdParamsSchema,
  culturalListQuerySchema,
  culturalOccasionRuleCreateSchema,
  culturalOccasionRuleUpdateSchema,
  culturalPreferenceSchema,
  culturalProfileCreateSchema,
  culturalProfileUpdateSchema,
  culturalSearchQuerySchema,
  culturalSlugParamsSchema,
  culturalStyleRequestSchema,
  patchCulturalPreferenceSchema
} from "./culturalFashion.schema.js";
import * as service from "./culturalFashion.service.js";

const adminResourceParamsSchema = z.object({
  resource: z.enum(["profiles", "occasion-rules", "components"])
});

const createSchemas = {
  profiles: culturalProfileCreateSchema,
  "occasion-rules": culturalOccasionRuleCreateSchema,
  components: culturalComponentCreateSchema
};

const updateSchemas = {
  profiles: culturalProfileUpdateSchema,
  "occasion-rules": culturalOccasionRuleUpdateSchema,
  components: culturalComponentUpdateSchema
};

export async function listProfiles(request: FastifyRequest, reply: FastifyReply) {
  const input = culturalListQuerySchema.partial().parse(request.query);
  const profiles = await service.listProfiles({
    search: input.search,
    country: input.country,
    ethnic_group: input.ethnic_group
  });
  return ok(reply, "Cultural fashion profiles fetched", { profiles });
}

export async function getProfile(request: FastifyRequest, reply: FastifyReply) {
  const { slug } = culturalSlugParamsSchema.parse(request.params);
  const profile = await service.getProfileBySlug(slug);
  return ok(reply, "Cultural fashion profile fetched", { profile });
}

export async function profileOccasionRules(request: FastifyRequest, reply: FastifyReply) {
  const { slug } = culturalSlugParamsSchema.parse(request.params);
  const data = await service.listOccasionRulesForProfile(slug);
  return ok(reply, "Cultural occasion rules fetched", data);
}

export async function searchProfiles(request: FastifyRequest, reply: FastifyReply) {
  const input = culturalSearchQuerySchema.parse(request.query);
  const profiles = await service.searchProfiles(input);
  return ok(reply, "Cultural fashion profiles searched", { profiles });
}

export async function createPreference(request: FastifyRequest, reply: FastifyReply) {
  const input = culturalPreferenceSchema.parse(request.body);
  const preference = await service.upsertPreference(request.user!.id, input);
  return ok(reply, "Cultural fashion preferences saved", { preference }, 201);
}

export async function getPreference(request: FastifyRequest, reply: FastifyReply) {
  const preference = await service.getPreference(request.user!.id);
  return ok(reply, "Cultural fashion preferences fetched", { preference });
}

export async function patchPreference(request: FastifyRequest, reply: FastifyReply) {
  const input = patchCulturalPreferenceSchema.parse(request.body);
  const preference = await service.patchPreference(request.user!.id, input);
  return ok(reply, "Cultural fashion preferences updated", { preference });
}

export async function styleCulturalLook(request: FastifyRequest, reply: FastifyReply) {
  const input = culturalStyleRequestSchema.parse(request.body);
  const recommendation = await service.styleCulturalLook(request.user!.id, input);
  return ok(reply, "Cultural fashion styling generated", recommendation);
}

export async function adminList(request: FastifyRequest, reply: FastifyReply) {
  const { resource } = adminResourceParamsSchema.parse(request.params);
  const input = culturalListQuerySchema.parse(request.query);
  const data = await service.adminListResource(resource, input);
  return ok(reply, "Admin cultural fashion resources fetched", data);
}

export async function adminGet(request: FastifyRequest, reply: FastifyReply) {
  const { resource } = adminResourceParamsSchema.parse(request.params);
  const { id } = culturalIdParamsSchema.parse(request.params);
  const item = await service.adminGetResource(resource, id);
  return ok(reply, "Admin cultural fashion resource fetched", { item });
}

export async function adminCreate(request: FastifyRequest, reply: FastifyReply) {
  const { resource } = adminResourceParamsSchema.parse(request.params);
  const input = createSchemas[resource].parse(request.body) as Record<string, unknown>;
  const item = await service.adminCreateResource(resource, input);
  await auditAdminAction(request, {
    action: `CULTURAL_${resource.replace("-", "_").toUpperCase()}_CREATED`,
    entity_type: `cultural_${resource}`,
    entity_id: (item as { id?: string } | null)?.id,
    metadata: input
  });
  return ok(reply, "Cultural fashion resource created", { item }, 201);
}

export async function adminUpdate(request: FastifyRequest, reply: FastifyReply) {
  const { resource } = adminResourceParamsSchema.parse(request.params);
  const { id } = culturalIdParamsSchema.parse(request.params);
  const input = updateSchemas[resource].parse(request.body) as Record<string, unknown>;
  const item = await service.adminUpdateResource(resource, id, input);
  await auditAdminAction(request, {
    action: `CULTURAL_${resource.replace("-", "_").toUpperCase()}_UPDATED`,
    entity_type: `cultural_${resource}`,
    entity_id: id,
    metadata: { changed_fields: Object.keys(input) }
  });
  return ok(reply, "Cultural fashion resource updated", { item });
}

export async function adminDelete(request: FastifyRequest, reply: FastifyReply) {
  const { resource } = adminResourceParamsSchema.parse(request.params);
  const { id } = culturalIdParamsSchema.parse(request.params);
  await service.adminDeleteResource(resource, id);
  await auditAdminAction(request, {
    action: `CULTURAL_${resource.replace("-", "_").toUpperCase()}_DELETED`,
    entity_type: `cultural_${resource}`,
    entity_id: id
  });
  return ok(reply, "Cultural fashion resource deleted");
}
