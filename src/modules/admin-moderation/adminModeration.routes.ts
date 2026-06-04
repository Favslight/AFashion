import type { FastifyInstance } from "fastify";
import { adminRouteRateLimit } from "../../middlewares/rateLimit.middleware.js";
import { authenticateAdmin, requireAdmin } from "../admin/admin.middleware.js";
import * as controller from "./adminModeration.controller.js";

export async function adminModerationRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticateAdmin);
  app.addHook("preHandler", requireAdmin);

  app.get("/wardrobe-items", { config: adminRouteRateLimit }, controller.listWardrobeItems);
  app.get("/wardrobe-items/:id", { config: adminRouteRateLimit }, controller.getWardrobeItem);
  app.delete("/wardrobe-items/:id", { config: adminRouteRateLimit }, controller.deleteWardrobeItem);

  app.get("/outfits", { config: adminRouteRateLimit }, controller.listOutfits);
  app.get("/outfits/:id", { config: adminRouteRateLimit }, controller.getOutfit);
  app.delete("/outfits/:id", { config: adminRouteRateLimit }, controller.deleteOutfit);

  app.get("/moderation/reports", { config: adminRouteRateLimit }, controller.listReports);
  app.get("/moderation/reports/:id", { config: adminRouteRateLimit }, controller.getReport);
  app.patch("/moderation/reports/:id/status", { config: adminRouteRateLimit }, controller.updateReportStatus);

  app.post("/moderation/blocked-keywords", { config: adminRouteRateLimit }, controller.createBlockedKeyword);
  app.get("/moderation/blocked-keywords", { config: adminRouteRateLimit }, controller.listBlockedKeywords);
  app.patch("/moderation/blocked-keywords/:id", { config: adminRouteRateLimit }, controller.updateBlockedKeyword);
  app.delete("/moderation/blocked-keywords/:id", { config: adminRouteRateLimit }, controller.deleteBlockedKeyword);
}
