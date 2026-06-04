import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { adminRouteRateLimit } from "../../middlewares/rateLimit.middleware.js";
import { authenticateAdmin, requireAdmin } from "../admin/admin.middleware.js";
import * as controller from "./fashion.controller.js";

export async function fashionRoutes(app: FastifyInstance) {
  app.get("/colors/combinations", controller.colorCombinations);
  app.get("/aesthetics", controller.aesthetics);

  app.get("/rules", { preHandler: [authenticate] }, controller.styleRules);
  app.get("/occasions/:slug/rules", { preHandler: [authenticate] }, controller.occasionRules);
  app.post("/score-outfit", { preHandler: [authenticate] }, controller.scoreOutfit);
  app.post("/recommend-missing-items", { preHandler: [authenticate] }, controller.recommendMissingItems);
}

export async function adminFashionRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticateAdmin);
  app.addHook("preHandler", requireAdmin);

  app.get("/fashion/:resource", { config: adminRouteRateLimit }, controller.adminList);
  app.post("/fashion/:resource", { config: adminRouteRateLimit }, controller.adminCreate);
  app.patch("/fashion/:resource/:id", { config: adminRouteRateLimit }, controller.adminUpdate);
  app.delete("/fashion/:resource/:id", { config: adminRouteRateLimit }, controller.adminDelete);
}
