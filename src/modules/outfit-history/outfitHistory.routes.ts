import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/auth.middleware.js";
import * as controller from "./outfitHistory.controller.js";

export async function outfitHistoryRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.post("/worn", controller.markWorn);
  app.get("/", controller.list);
  app.get("/recent", controller.recent);
  app.get("/calendar", controller.calendar);
  app.delete("/:id", controller.remove);
}
