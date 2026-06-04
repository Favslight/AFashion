import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/auth.middleware.js";
import * as controller from "./users.controller.js";

export async function userRoutes(app: FastifyInstance) {
  app.get("/me", { preHandler: [authenticate] }, controller.me);
  app.patch("/me", { preHandler: [authenticate] }, controller.updateMe);
}
