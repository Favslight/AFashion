import type { FastifyInstance } from "fastify";
import { adminRouteRateLimit } from "../../middlewares/rateLimit.middleware.js";
import { authenticateAdmin, requireAdmin, requireSuperAdmin } from "../admin/admin.middleware.js";
import * as controller from "./adminSettings.controller.js";

export async function adminSettingsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticateAdmin);
  app.addHook("preHandler", requireAdmin);

  app.get("/settings", { config: adminRouteRateLimit }, controller.listSettings);
  app.get("/settings/:key", { config: adminRouteRateLimit }, controller.getSetting);
  app.post("/settings", { preHandler: [requireSuperAdmin], config: adminRouteRateLimit }, controller.createSetting);
  app.patch("/settings/:key", { config: adminRouteRateLimit }, controller.updateSetting);

  app.post("/policies", { config: adminRouteRateLimit }, controller.createPolicy);
  app.get("/policies", { config: adminRouteRateLimit }, controller.listPolicies);
  app.get("/policies/:id", { config: adminRouteRateLimit }, controller.getPolicy);
  app.patch("/policies/:id", { config: adminRouteRateLimit }, controller.updatePolicy);
  app.delete("/policies/:id", { preHandler: [requireSuperAdmin], config: adminRouteRateLimit }, controller.deletePolicy);
}

export async function publicSettingsRoutes(app: FastifyInstance) {
  app.get("/public", controller.publicSettings);
}
