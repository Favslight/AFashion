import type { FastifyInstance } from "fastify";
import { adminRouteRateLimit } from "../../middlewares/rateLimit.middleware.js";
import { authenticateAdmin, requireAdmin, requireSuperAdmin } from "../admin/admin.middleware.js";
import * as controller from "./adminUsers.controller.js";

export async function adminUsersRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticateAdmin);
  app.addHook("preHandler", requireAdmin);

  app.get("/users", { config: adminRouteRateLimit }, controller.listUsers);
  app.get("/users/:id", { config: adminRouteRateLimit }, controller.getUser);
  app.patch("/users/:id/status", { config: adminRouteRateLimit }, controller.updateUserStatus);
  app.patch("/users/:id/role", { preHandler: [requireSuperAdmin], config: adminRouteRateLimit }, controller.updateUserRole);
  app.delete("/users/:id", { config: adminRouteRateLimit }, controller.deleteUser);
}
