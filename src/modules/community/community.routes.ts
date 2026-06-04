import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { aiRouteRateLimit, adminRouteRateLimit } from "../../middlewares/rateLimit.middleware.js";
import { authenticateAdmin, requireAdmin } from "../admin/admin.middleware.js";
import * as controller from "./community.controller.js";

export async function communityRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.post("/posts", controller.createPost);
  app.get("/posts", controller.listPosts);
  app.get("/posts/:id", controller.getPost);
  app.patch("/posts/:id", controller.updatePost);
  app.delete("/posts/:id", controller.deletePost);
  app.post("/posts/:id/like", { config: aiRouteRateLimit }, controller.likePost);
  app.delete("/posts/:id/like", { config: aiRouteRateLimit }, controller.unlikePost);
  app.post("/posts/:id/save", { config: aiRouteRateLimit }, controller.savePost);
  app.delete("/posts/:id/save", { config: aiRouteRateLimit }, controller.unsavePost);
  app.post("/posts/:id/comments", { config: aiRouteRateLimit }, controller.addComment);
  app.get("/posts/:id/comments", controller.listComments);
  app.delete("/comments/:id", controller.deleteComment);
  app.post("/posts/:id/report", { config: aiRouteRateLimit }, controller.reportPost);
  app.post("/share-outfit/:outfitId", controller.shareOutfit);
}

export async function adminCommunityRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticateAdmin);
  app.addHook("preHandler", requireAdmin);

  app.get("/community/posts", { config: adminRouteRateLimit }, controller.adminPosts);
  app.get("/community/reports", { config: adminRouteRateLimit }, controller.adminReports);
  app.patch("/community/reports/:id", { config: adminRouteRateLimit }, controller.adminUpdateReport);
  app.delete("/community/posts/:id", { config: adminRouteRateLimit }, controller.adminDeletePost);
}
