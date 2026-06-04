import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { aiRouteRateLimit } from "../../middlewares/rateLimit.middleware.js";
import * as controller from "./vision.controller.js";

export async function visionRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.post("/analyze-wardrobe-item", { config: aiRouteRateLimit }, controller.analyzeWardrobeItem);
  app.post("/review-outfit-photo", { config: aiRouteRateLimit }, controller.reviewOutfitPhoto);
  app.get("/reviews", controller.listReviews);
  app.get("/reviews/:id", controller.getReview);
  app.delete("/reviews/:id", controller.deleteReview);
}
