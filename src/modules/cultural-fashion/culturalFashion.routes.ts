import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { adminRouteRateLimit, aiRouteRateLimit } from "../../middlewares/rateLimit.middleware.js";
import { authenticateAdmin, requireAdmin } from "../admin/admin.middleware.js";
import * as controller from "./culturalFashion.controller.js";

export async function culturalFashionRoutes(app: FastifyInstance) {
  app.get("/profiles", controller.listProfiles);
  app.get("/profiles/:slug", controller.getProfile);
  app.get("/profiles/:slug/occasion-rules", controller.profileOccasionRules);
  app.get("/search", controller.searchProfiles);

  app.post("/preferences", { preHandler: [authenticate] }, controller.createPreference);
  app.get("/preferences", { preHandler: [authenticate] }, controller.getPreference);
  app.patch("/preferences", { preHandler: [authenticate] }, controller.patchPreference);

  app.post("/style", { preHandler: [authenticate], config: aiRouteRateLimit }, controller.styleCulturalLook);
}

export async function adminCulturalFashionRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticateAdmin);
  app.addHook("preHandler", requireAdmin);

  app.get("/cultural-fashion/:resource", { config: adminRouteRateLimit }, controller.adminList);
  app.post("/cultural-fashion/:resource", { config: adminRouteRateLimit }, controller.adminCreate);
  app.get("/cultural-fashion/:resource/:id", { config: adminRouteRateLimit }, controller.adminGet);
  app.patch("/cultural-fashion/:resource/:id", { config: adminRouteRateLimit }, controller.adminUpdate);
  app.delete("/cultural-fashion/:resource/:id", { config: adminRouteRateLimit }, controller.adminDelete);
}
