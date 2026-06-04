import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/auth.middleware.js";
import * as controller from "./styleBoards.controller.js";

export async function styleBoardRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.post("/", controller.create);
  app.get("/", controller.list);
  app.get("/:id", controller.getOne);
  app.patch("/:id", controller.update);
  app.delete("/:id", controller.remove);
  app.post("/:id/items", controller.addItem);
  app.delete("/:id/items/:itemId", controller.removeItem);
}
