import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { aiRouteRateLimit } from "../../middlewares/rateLimit.middleware.js";
import * as controller from "./styleFeedback.controller.js";

export async function styleFeedbackRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.post("/outfit/:outfitId", { config: aiRouteRateLimit }, controller.create);
  app.get("/outfit/:outfitId", controller.forOutfit);
  app.get("/me", controller.me);
}
