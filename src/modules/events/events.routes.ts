import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { aiRouteRateLimit } from "../../middlewares/rateLimit.middleware.js";
import * as controller from "./events.controller.js";

export async function eventRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.post("/", controller.create);
  app.get("/", controller.list);
  app.get("/upcoming", controller.upcoming);
  app.get("/:id", controller.getOne);
  app.patch("/:id", controller.update);
  app.delete("/:id", controller.remove);
  app.post("/:id/generate-outfit", { config: aiRouteRateLimit }, controller.generateOutfit);
  app.post("/:id/select-outfit", controller.selectOutfit);
  app.post("/:id/send-reminder", { config: aiRouteRateLimit }, controller.sendReminder);
}
