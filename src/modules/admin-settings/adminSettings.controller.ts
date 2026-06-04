import type { FastifyReply, FastifyRequest } from "fastify";
import { ok } from "../../utils/response.js";
import { auditAdminAction } from "../admin/admin.middleware.js";
import { uuidParamsSchema } from "../admin/admin.schema.js";
import {
  policiesQuerySchema,
  policyCreateSchema,
  policyUpdateSchema,
  settingKeyParamsSchema,
  settingsQuerySchema,
  siteSettingCreateSchema,
  siteSettingUpdateSchema
} from "./adminSettings.schema.js";
import * as service from "./adminSettings.service.js";

export async function listSettings(request: FastifyRequest, reply: FastifyReply) {
  const input = settingsQuerySchema.parse(request.query);
  const data = await service.listSettings(input);
  return ok(reply, "Settings fetched", data);
}

export async function publicSettings(_request: FastifyRequest, reply: FastifyReply) {
  const settings = await service.listPublicSettings();
  return ok(reply, "Public settings fetched", { settings });
}

export async function getSetting(request: FastifyRequest, reply: FastifyReply) {
  const { key } = settingKeyParamsSchema.parse(request.params);
  const setting = await service.getSetting(key);
  return ok(reply, "Setting fetched", { setting });
}

export async function createSetting(request: FastifyRequest, reply: FastifyReply) {
  const input = siteSettingCreateSchema.parse(request.body);
  const setting = await service.createSetting(request.admin!.id, input);
  await auditAdminAction(request, {
    action: "SETTING_CREATED",
    entity_type: "site_setting",
    entity_id: (setting as { id?: string } | null)?.id,
    metadata: { setting_key: input.setting_key }
  });
  return ok(reply, "Setting created", { setting }, 201);
}

export async function updateSetting(request: FastifyRequest, reply: FastifyReply) {
  const { key } = settingKeyParamsSchema.parse(request.params);
  const input = siteSettingUpdateSchema.parse(request.body);
  const setting = await service.updateSetting(request.admin!.id, key, input);
  await auditAdminAction(request, {
    action: "SETTING_UPDATED",
    entity_type: "site_setting",
    entity_id: (setting as { id?: string } | null)?.id,
    metadata: { setting_key: key, changed_fields: Object.keys(input) }
  });
  return ok(reply, "Setting updated", { setting });
}

export async function createPolicy(request: FastifyRequest, reply: FastifyReply) {
  const input = policyCreateSchema.parse(request.body);
  const policy = await service.createPolicy(request.admin!.id, input);
  await auditAdminAction(request, {
    action: "POLICY_CREATED",
    entity_type: "content_policy",
    entity_id: (policy as { id?: string } | null)?.id,
    metadata: { policy_type: input.policy_type, version: input.version }
  });
  return ok(reply, "Policy created", { policy }, 201);
}

export async function listPolicies(request: FastifyRequest, reply: FastifyReply) {
  const input = policiesQuerySchema.parse(request.query);
  const data = await service.listPolicies(input);
  return ok(reply, "Policies fetched", data);
}

export async function getPolicy(request: FastifyRequest, reply: FastifyReply) {
  const { id } = uuidParamsSchema.parse(request.params);
  const policy = await service.getPolicy(id);
  return ok(reply, "Policy fetched", { policy });
}

export async function updatePolicy(request: FastifyRequest, reply: FastifyReply) {
  const { id } = uuidParamsSchema.parse(request.params);
  const input = policyUpdateSchema.parse(request.body);
  const policy = await service.updatePolicy(request.admin!.id, id, input);
  await auditAdminAction(request, {
    action: "POLICY_UPDATED",
    entity_type: "content_policy",
    entity_id: id,
    metadata: { changed_fields: Object.keys(input) }
  });
  return ok(reply, "Policy updated", { policy });
}

export async function deletePolicy(request: FastifyRequest, reply: FastifyReply) {
  const { id } = uuidParamsSchema.parse(request.params);
  await service.deletePolicy(id);
  await auditAdminAction(request, {
    action: "POLICY_DELETED",
    entity_type: "content_policy",
    entity_id: id
  });
  return ok(reply, "Policy deleted");
}
