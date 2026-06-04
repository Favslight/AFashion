import type { FastifyInstance } from "fastify";
import { adminRouteRateLimit } from "../../middlewares/rateLimit.middleware.js";
import { authenticateAdmin, requireAdmin } from "../admin/admin.middleware.js";
import * as controller from "./adminAnalytics.controller.js";

export async function adminAnalyticsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticateAdmin);
  app.addHook("preHandler", requireAdmin);

  app.get("/analytics/users", { config: adminRouteRateLimit }, controller.users);
  app.get("/analytics/wardrobe", { config: adminRouteRateLimit }, controller.wardrobe);
  app.get("/analytics/outfits", { config: adminRouteRateLimit }, controller.outfits);
  app.get("/analytics/ai-usage", { config: adminRouteRateLimit }, controller.aiUsage);
  app.get("/analytics/subscriptions", { config: adminRouteRateLimit }, controller.subscriptions);
  app.get("/analytics/vision", { config: adminRouteRateLimit }, controller.vision);
  app.get("/analytics/fashion-memory", { config: adminRouteRateLimit }, controller.fashionMemory);
  app.get("/analytics/community", { config: adminRouteRateLimit }, controller.community);
}
