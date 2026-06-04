import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { aiRouteRateLimit } from "../../middlewares/rateLimit.middleware.js";
import * as controller from "./outfits.controller.js";

export async function occasionRoutes(app: FastifyInstance) {
  app.get("/", controller.listOccasions);
}

export async function outfitRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.post("/generate", { config: aiRouteRateLimit }, controller.generate);
  app.get("/", controller.list);
  app.get("/:id", controller.getOne);
  app.post("/:id/save", controller.save);
  app.delete("/:id", controller.remove);
}
