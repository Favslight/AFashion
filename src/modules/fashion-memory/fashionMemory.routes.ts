import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { aiRouteRateLimit } from "../../middlewares/rateLimit.middleware.js";
import * as controller from "./fashionMemory.controller.js";

export async function fashionMemoryRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.post("/rebuild", { config: aiRouteRateLimit }, controller.rebuild);
  app.get("/insights", controller.insights);
  app.get("/", controller.list);
  app.post("/", controller.create);
  app.patch("/:id", controller.update);
  app.delete("/:id", controller.remove);
}
