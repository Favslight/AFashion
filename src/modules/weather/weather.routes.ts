import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { aiRouteRateLimit } from "../../middlewares/rateLimit.middleware.js";
import * as controller from "./weather.controller.js";

export async function weatherRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.get("/current", controller.current);
  app.post("/style-advice", { config: aiRouteRateLimit }, controller.styleAdvice);
}
