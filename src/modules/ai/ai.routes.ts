import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { aiRouteRateLimit } from "../../middlewares/rateLimit.middleware.js";
import * as controller from "./ai.controller.js";

export async function aiRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.post("/style-chat", { config: aiRouteRateLimit }, controller.styleChat);
  app.post("/analyze-outfit-photo", { config: aiRouteRateLimit }, controller.analyzeOutfitPhoto);
  app.post("/recommend-for-event", { config: aiRouteRateLimit }, controller.recommendForEvent);
  app.post("/realtime-session-token", { config: aiRouteRateLimit }, controller.realtimeSessionToken);
}
