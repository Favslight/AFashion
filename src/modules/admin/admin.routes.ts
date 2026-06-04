import type { FastifyInstance } from "fastify";
import { adminRouteRateLimit } from "../../middlewares/rateLimit.middleware.js";
import { dashboard } from "./admin.controller.js";
import { authenticateAdmin, requireAdmin } from "./admin.middleware.js";

export async function adminRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticateAdmin);
  app.addHook("preHandler", requireAdmin);

  app.get("/dashboard", { config: adminRouteRateLimit }, dashboard);
}
