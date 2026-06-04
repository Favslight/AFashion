import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { aiRouteRateLimit } from "../../middlewares/rateLimit.middleware.js";
import * as controller from "./creators.controller.js";

export async function creatorRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.post("/profile", controller.createProfile);
  app.get("/profile/me", controller.myProfile);
  app.patch("/profile", controller.updateProfile);
  app.delete("/profile", controller.deleteProfile);
  app.get("/:id", controller.getCreator);
  app.post("/:id/follow", { config: aiRouteRateLimit }, controller.follow);
  app.delete("/:id/follow", { config: aiRouteRateLimit }, controller.unfollow);
  app.get("/:id/followers", controller.followers);
  app.get("/:id/posts", controller.posts);
}
