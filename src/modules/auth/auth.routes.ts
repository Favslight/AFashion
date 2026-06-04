import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authRouteRateLimit } from "../../middlewares/rateLimit.middleware.js";
import * as controller from "./auth.controller.js";

export async function authRoutes(app: FastifyInstance) {
  app.post("/signup", { config: authRouteRateLimit }, controller.signup);
  app.post("/login", { config: authRouteRateLimit }, controller.login);
  app.post("/verify-email", { config: authRouteRateLimit }, controller.verifyEmail);
  app.post("/forgot-password", { config: authRouteRateLimit }, controller.forgotPassword);
  app.post("/reset-password", { config: authRouteRateLimit }, controller.resetPassword);
  app.get("/me", { preHandler: [authenticate] }, controller.me);
}
