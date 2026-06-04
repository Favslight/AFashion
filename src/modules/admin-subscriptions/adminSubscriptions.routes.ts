import type { FastifyInstance } from "fastify";
import { adminRouteRateLimit } from "../../middlewares/rateLimit.middleware.js";
import { authenticateAdmin, requireAdmin, requireSuperAdmin } from "../admin/admin.middleware.js";
import * as controller from "./adminSubscriptions.controller.js";

export async function adminSubscriptionsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticateAdmin);
  app.addHook("preHandler", requireAdmin);

  app.get("/subscriptions/plans", { config: adminRouteRateLimit }, controller.listPlans);
  app.post("/subscriptions/plans", { config: adminRouteRateLimit }, controller.createPlan);
  app.patch("/subscriptions/plans/:id", { config: adminRouteRateLimit }, controller.updatePlan);
  app.delete("/subscriptions/plans/:id", { preHandler: [requireSuperAdmin], config: adminRouteRateLimit }, controller.deletePlan);
  app.get("/subscriptions/users", { config: adminRouteRateLimit }, controller.listUserSubscriptions);
  app.patch("/subscriptions/users/:userId", { config: adminRouteRateLimit }, controller.updateUserSubscription);
}
