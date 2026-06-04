import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { aiRouteRateLimit } from "../../middlewares/rateLimit.middleware.js";
import * as controller from "./wardrobe.controller.js";

export async function wardrobeRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.post("/upload", controller.upload);
  app.post("/bulk-scan", { config: aiRouteRateLimit }, controller.bulkScan);
  app.get("/scan-jobs", controller.scanJobs);
  app.get("/scan-jobs/:id", controller.scanJob);
  app.get("/", controller.list);
  app.get("/:id", controller.getOne);
  app.patch("/:id", controller.update);
  app.delete("/:id", controller.remove);
  app.post("/:id/analyze", { config: aiRouteRateLimit }, controller.analyze);
  app.post("/:id/rescan", { config: aiRouteRateLimit }, controller.rescan);
}
