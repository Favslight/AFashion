import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/auth.middleware.js";
import * as controller from "./subscriptions.controller.js";

export async function subscriptionRoutes(app: FastifyInstance) {
  app.get("/plans", controller.listPlans);
  app.get("/me", { preHandler: [authenticate] }, controller.me);
  app.post("/change-plan", { preHandler: [authenticate] }, controller.changePlan);
}
