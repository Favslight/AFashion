import type { FastifyInstance } from "fastify";
import { adminRouteRateLimit } from "../../middlewares/rateLimit.middleware.js";
import { authenticateAdmin } from "../admin/admin.middleware.js";
import * as controller from "./adminAuth.controller.js";

export async function adminAuthRoutes(app: FastifyInstance) {
  app.post("/login", { config: adminRouteRateLimit }, controller.login);
  app.get("/me", { preHandler: [authenticateAdmin] }, controller.me);
}
