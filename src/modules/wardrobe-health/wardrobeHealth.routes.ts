import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { aiRouteRateLimit } from "../../middlewares/rateLimit.middleware.js";
import * as controller from "./wardrobeHealth.controller.js";

export async function wardrobeHealthRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.post("/analyze", { config: aiRouteRateLimit }, controller.analyze);
  app.get("/latest", controller.latest);
  app.get("/reports", controller.reports);
  app.get("/reports/:id", controller.getReport);
}
