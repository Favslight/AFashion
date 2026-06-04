import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/auth.middleware.js";
import * as controller from "./onboarding.controller.js";

export async function onboardingRoutes(app: FastifyInstance) {
  app.post("/profile", { preHandler: [authenticate] }, controller.createProfile);
  app.get("/profile", { preHandler: [authenticate] }, controller.getProfile);
  app.patch("/profile", { preHandler: [authenticate] }, controller.patchProfile);
}
