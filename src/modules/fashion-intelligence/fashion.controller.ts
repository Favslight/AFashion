import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { ok } from "../../utils/response.js";
import { auditAdminAction } from "../admin/admin.middleware.js";
import { paginationQuerySchema, uuidParamsSchema } from "../admin/admin.schema.js";
import { ensureMinimumPlan } from "../subscriptions/subscriptions.service.js";
import {
  aestheticCreateSchema,
  aestheticUpdateSchema,
  bodyTypeRuleCreateSchema,
  bodyTypeRuleUpdateSchema,
  climateRuleCreateSchema,
  climateRuleUpdateSchema,
  colorCombinationCreateSchema,
  colorCombinationUpdateSchema,
  fashionListQuerySchema,
  missingItemsSchema,
  occasionRuleCreateSchema,
  occasionRuleUpdateSchema,
  occasionSlugParamsSchema,
  scoreOutfitSchema,
  styleRuleCreateSchema,
  styleRuleUpdateSchema
} from "./fashion.schema.js";
import * as service from "./fashion.service.js";

const resourceParamsSchema = z.object({
  resource: z.enum(["colors", "style-rules", "occasion-rules", "body-type-rules", "climate-rules", "aesthetics"])
});

const createSchemas = {
  colors: colorCombinationCreateSchema,
  "style-rules": styleRuleCreateSchema,
  "occasion-rules": occasionRuleCreateSchema,
  "body-type-rules": bodyTypeRuleCreateSchema,
  "climate-rules": climateRuleCreateSchema,
  aesthetics: aestheticCreateSchema
};

const updateSchemas = {
  colors: colorCombinationUpdateSchema,
  "style-rules": styleRuleUpdateSchema,
  "occasion-rules": occasionRuleUpdateSchema,
  "body-type-rules": bodyTypeRuleUpdateSchema,
  "climate-rules": climateRuleUpdateSchema,
  aesthetics: aestheticUpdateSchema
};

export async function colorCombinations(_request: FastifyRequest, reply: FastifyReply) {
  const combinations = await service.listColorCombinations();
  return ok(reply, "Color combinations fetched", { combinations });
}

export async function aesthetics(_request: FastifyRequest, reply: FastifyReply) {
  const aestheticsList = await service.listAesthetics();
  return ok(reply, "Fashion aesthetics fetched", { aesthetics: aestheticsList });
}

export async function styleRules(request: FastifyRequest, reply: FastifyReply) {
  const input = fashionListQuerySchema.parse(request.query);
  const data = await service.listStyleRules(input);
  return ok(reply, "Fashion rules fetched", data);
}

export async function occasionRules(request: FastifyRequest, reply: FastifyReply) {
  const { slug } = occasionSlugParamsSchema.parse(request.params);
  const rules = await service.listOccasionRules(slug);
  return ok(reply, "Occasion rules fetched", { rules });
}

export async function scoreOutfit(request: FastifyRequest, reply: FastifyReply) {
  await ensureMinimumPlan(request.user!.id, ["Pro", "Premium"], "Advanced outfit scoring");
  const input = scoreOutfitSchema.parse(request.body);
  const scores = await service.scoreOutfit(request.user!.id, input);
  return ok(reply, "Outfit scored", { scores });
}

export async function recommendMissingItems(request: FastifyRequest, reply: FastifyReply) {
  await ensureMinimumPlan(request.user!.id, ["Premium"], "Personal shopper recommendations");
  const input = missingItemsSchema.parse(request.body);
  const recommendation = await service.recommendMissingItems(request.user!.id, input);
  return ok(reply, "Missing wardrobe items recommended", recommendation);
}

export async function adminList(request: FastifyRequest, reply: FastifyReply) {
  const { resource } = resourceParamsSchema.parse(request.params);
  const input = fashionListQuerySchema.merge(paginationQuerySchema).parse(request.query);
  const data = await service.listResource(resource, input);
  return ok(reply, "Admin fashion resources fetched", data);
}

export async function adminCreate(request: FastifyRequest, reply: FastifyReply) {
  const { resource } = resourceParamsSchema.parse(request.params);
  const input = createSchemas[resource].parse(request.body) as Record<string, unknown>;
  const item = await service.createResource(resource, input);
  await auditAdminAction(request, {
    action: "FASHION_RESOURCE_CREATED",
    entity_type: resource,
    entity_id: (item as { id?: string } | null)?.id,
    metadata: input
  });
  return ok(reply, "Fashion resource created", { item }, 201);
}

export async function adminUpdate(request: FastifyRequest, reply: FastifyReply) {
  const { resource } = resourceParamsSchema.parse(request.params);
  const { id } = uuidParamsSchema.parse(request.params);
  const input = updateSchemas[resource].parse(request.body) as Record<string, unknown>;
  const item = await service.updateResource(resource, id, input);
  await auditAdminAction(request, {
    action: "FASHION_RESOURCE_UPDATED",
    entity_type: resource,
    entity_id: id,
    metadata: { changed_fields: Object.keys(input) }
  });
  return ok(reply, "Fashion resource updated", { item });
}

export async function adminDelete(request: FastifyRequest, reply: FastifyReply) {
  const { resource } = resourceParamsSchema.parse(request.params);
  const { id } = uuidParamsSchema.parse(request.params);
  await service.deleteResource(resource, id);
  await auditAdminAction(request, {
    action: "FASHION_RESOURCE_DELETED",
    entity_type: resource,
    entity_id: id
  });
  return ok(reply, "Fashion resource deleted");
}
