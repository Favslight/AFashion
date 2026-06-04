import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/auth.middleware.js";
import * as controller from "./discovery.controller.js";

export async function discoveryRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.get("/feed", controller.feed);
  app.get("/trending", controller.trending);
  app.get("/aesthetics/:slug", controller.aesthetics);
  app.get("/occasions/:slug", controller.occasions);
  app.get("/for-you", controller.forYou);
}
