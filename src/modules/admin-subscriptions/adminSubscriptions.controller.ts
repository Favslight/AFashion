import type { FastifyReply, FastifyRequest } from "fastify";
import { ok } from "../../utils/response.js";
import { auditAdminAction } from "../admin/admin.middleware.js";
import { uuidParamsSchema } from "../admin/admin.schema.js";
import {
  subscriptionPlanCreateSchema,
  subscriptionPlansQuerySchema,
  subscriptionPlanUpdateSchema,
  subscriptionUsersQuerySchema,
  userIdParamsSchema,
  userSubscriptionUpdateSchema
} from "./adminSubscriptions.schema.js";
import * as service from "./adminSubscriptions.service.js";

export async function listPlans(request: FastifyRequest, reply: FastifyReply) {
  const input = subscriptionPlansQuerySchema.parse(request.query);
  const data = await service.listPlans(input);
  return ok(reply, "Subscription plans fetched", data);
}

export async function createPlan(request: FastifyRequest, reply: FastifyReply) {
  const input = subscriptionPlanCreateSchema.parse(request.body);
  const plan = await service.createPlan(input);
  await auditAdminAction(request, {
    action: "SUBSCRIPTION_PLAN_CREATED",
    entity_type: "subscription_plan",
    entity_id: (plan as { id?: string } | null)?.id,
    metadata: { name: input.name }
  });
  return ok(reply, "Subscription plan created", { plan }, 201);
}

export async function updatePlan(request: FastifyRequest, reply: FastifyReply) {
  const { id } = uuidParamsSchema.parse(request.params);
  const input = subscriptionPlanUpdateSchema.parse(request.body);
  const plan = await service.updatePlan(id, input);
  await auditAdminAction(request, {
    action: "SUBSCRIPTION_PLAN_UPDATED",
    entity_type: "subscription_plan",
    entity_id: id,
    metadata: { changed_fields: Object.keys(input) }
  });
  return ok(reply, "Subscription plan updated", { plan });
}

export async function deletePlan(request: FastifyRequest, reply: FastifyReply) {
  const { id } = uuidParamsSchema.parse(request.params);
  await service.deletePlan(id);
  await auditAdminAction(request, {
    action: "SUBSCRIPTION_PLAN_DELETED",
    entity_type: "subscription_plan",
    entity_id: id
  });
  return ok(reply, "Subscription plan deleted");
}

export async function listUserSubscriptions(request: FastifyRequest, reply: FastifyReply) {
  const input = subscriptionUsersQuerySchema.parse(request.query);
  const data = await service.listUserSubscriptions(input);
  return ok(reply, "User subscriptions fetched", data);
}

export async function updateUserSubscription(request: FastifyRequest, reply: FastifyReply) {
  const { userId } = userIdParamsSchema.parse(request.params);
  const input = userSubscriptionUpdateSchema.parse(request.body);
  const subscription = await service.updateUserSubscription(userId, input);
  await auditAdminAction(request, {
    action: "USER_SUBSCRIPTION_UPDATED",
    entity_type: "user_subscription",
    entity_id: userId,
    metadata: input
  });
  return ok(reply, "User subscription updated", { subscription });
}
