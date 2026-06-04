import type { FastifyReply, FastifyRequest } from "fastify";
import { ok } from "../../utils/response.js";
import { changePlanSchema } from "./subscriptions.schema.js";
import * as service from "./subscriptions.service.js";

export async function listPlans(_request: FastifyRequest, reply: FastifyReply) {
  const plans = await service.listPlans();
  return ok(reply, "Subscription plans fetched", { plans });
}

export async function me(request: FastifyRequest, reply: FastifyReply) {
  const subscription = await service.getCurrentSubscription(request.user!.id);
  return ok(reply, "Subscription fetched", { subscription });
}

export async function changePlan(request: FastifyRequest, reply: FastifyReply) {
  const input = changePlanSchema.parse(request.body);
  const subscription = await service.changePlan(request.user!.id, input.plan_id);
  return ok(reply, "Subscription changed", { subscription });
}
