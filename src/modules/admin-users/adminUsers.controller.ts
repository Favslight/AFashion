import type { FastifyReply, FastifyRequest } from "fastify";
import { ok } from "../../utils/response.js";
import { auditAdminAction } from "../admin/admin.middleware.js";
import { uuidParamsSchema } from "../admin/admin.schema.js";
import {
  adminUsersQuerySchema,
  userRoleUpdateSchema,
  userStatusUpdateSchema
} from "./adminUsers.schema.js";
import * as service from "./adminUsers.service.js";

export async function listUsers(request: FastifyRequest, reply: FastifyReply) {
  const input = adminUsersQuerySchema.parse(request.query);
  const data = await service.listUsers(input);
  return ok(reply, "Admin users fetched", data);
}

export async function getUser(request: FastifyRequest, reply: FastifyReply) {
  const { id } = uuidParamsSchema.parse(request.params);
  const data = await service.getUser(id);
  return ok(reply, "Admin user fetched", data);
}

export async function updateUserStatus(request: FastifyRequest, reply: FastifyReply) {
  const { id } = uuidParamsSchema.parse(request.params);
  const input = userStatusUpdateSchema.parse(request.body);
  const user = await service.updateUserStatus(request.admin!.id, id, input);
  const action = input.account_status === "suspended"
    ? "USER_SUSPENDED"
    : input.account_status === "active"
      ? "USER_REACTIVATED"
      : "USER_STATUS_CHANGED";
  await auditAdminAction(request, {
    action,
    entity_type: "user",
    entity_id: id,
    metadata: input
  });
  return ok(reply, "User status updated", { user });
}

export async function updateUserRole(request: FastifyRequest, reply: FastifyReply) {
  const { id } = uuidParamsSchema.parse(request.params);
  const input = userRoleUpdateSchema.parse(request.body);
  const user = await service.updateUserRole(request.admin!.id, id, input.role);
  await auditAdminAction(request, {
    action: "USER_ROLE_CHANGED",
    entity_type: "user",
    entity_id: id,
    metadata: input
  });
  return ok(reply, "User role updated", { user });
}

export async function deleteUser(request: FastifyRequest, reply: FastifyReply) {
  const { id } = uuidParamsSchema.parse(request.params);
  await service.softDeleteUser(request.admin!.id, id);
  await auditAdminAction(request, {
    action: "USER_DELETED",
    entity_type: "user",
    entity_id: id
  });
  return ok(reply, "User deleted");
}
