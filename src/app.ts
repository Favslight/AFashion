import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import { env } from "./config/env.js";
import { registerErrorHandler } from "./middlewares/error.middleware.js";
import { aiRoutes } from "./modules/ai/ai.routes.js";
import { adminAuthRoutes } from "./modules/admin-auth/adminAuth.routes.js";
import { adminAnalyticsRoutes } from "./modules/admin-analytics/adminAnalytics.routes.js";
import { adminModerationRoutes } from "./modules/admin-moderation/adminModeration.routes.js";
import { adminSettingsRoutes, publicSettingsRoutes } from "./modules/admin-settings/adminSettings.routes.js";
import { adminSubscriptionsRoutes } from "./modules/admin-subscriptions/adminSubscriptions.routes.js";
import { adminUsersRoutes } from "./modules/admin-users/adminUsers.routes.js";
import { adminRoutes } from "./modules/admin/admin.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { adminCommunityRoutes, communityRoutes } from "./modules/community/community.routes.js";
import { creatorRoutes } from "./modules/creators/creators.routes.js";
import { adminCulturalFashionRoutes, culturalFashionRoutes } from "./modules/cultural-fashion/culturalFashion.routes.js";
import { discoveryRoutes } from "./modules/discovery/discovery.routes.js";
import { eventRoutes } from "./modules/events/events.routes.js";
import { adminFashionRoutes, fashionRoutes } from "./modules/fashion-intelligence/fashion.routes.js";
import { fashionMemoryRoutes } from "./modules/fashion-memory/fashionMemory.routes.js";
import { onboardingRoutes } from "./modules/onboarding/onboarding.routes.js";
import { outfitHistoryRoutes } from "./modules/outfit-history/outfitHistory.routes.js";
import { occasionRoutes, outfitRoutes } from "./modules/outfits/outfits.routes.js";
import { subscriptionRoutes } from "./modules/subscriptions/subscriptions.routes.js";
import { styleFeedbackRoutes } from "./modules/style-feedback/styleFeedback.routes.js";
import { styleBoardRoutes } from "./modules/style-boards/styleBoards.routes.js";
import { userRoutes } from "./modules/users/users.routes.js";
import { visionRoutes } from "./modules/vision/vision.routes.js";
import { wardrobeRoutes } from "./modules/wardrobe/wardrobe.routes.js";
import { wardrobeHealthRoutes } from "./modules/wardrobe-health/wardrobeHealth.routes.js";
import { weatherRoutes } from "./modules/weather/weather.routes.js";
import { MAX_UPLOAD_BYTES } from "./utils/constants.js";

export async function buildApp() {
  const app = Fastify({
    logger: env.isProduction
      ? true
      : {
          transport: {
            target: "pino-pretty",
            options: {
              colorize: true
            }
          }
        }
  });

  await app.register(helmet);

  await app.register(cors, {
    origin(origin, callback) {
      if (!origin || env.CORS_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS origin not allowed"), false);
    },
    credentials: true
  });

  await app.register(rateLimit, {
    global: true,
    max: 120,
    timeWindow: "1 minute",
    errorResponseBuilder() {
      return {
        success: false,
        message: "Too many requests. Please slow down."
      };
    }
  });

  await app.register(multipart, {
    limits: {
      fileSize: MAX_UPLOAD_BYTES,
      files: 50
    }
  });

  registerErrorHandler(app);

  app.get("/health", async () => ({
    success: true,
    message: "What Should I Wear? API is healthy",
    data: {
      uptime: process.uptime()
    }
  }));

  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(userRoutes, { prefix: "/api/users" });
  await app.register(onboardingRoutes, { prefix: "/api/onboarding" });
  await app.register(wardrobeRoutes, { prefix: "/api/wardrobe" });
  await app.register(occasionRoutes, { prefix: "/api/occasions" });
  await app.register(outfitRoutes, { prefix: "/api/outfits" });
  await app.register(aiRoutes, { prefix: "/api/ai" });
  await app.register(subscriptionRoutes, { prefix: "/api/subscriptions" });
  await app.register(fashionRoutes, { prefix: "/api/fashion" });
  await app.register(fashionMemoryRoutes, { prefix: "/api/fashion-memory" });
  await app.register(outfitHistoryRoutes, { prefix: "/api/outfit-history" });
  await app.register(styleFeedbackRoutes, { prefix: "/api/style-feedback" });
  await app.register(eventRoutes, { prefix: "/api/events" });
  await app.register(creatorRoutes, { prefix: "/api/creators" });
  await app.register(communityRoutes, { prefix: "/api/community" });
  await app.register(culturalFashionRoutes, { prefix: "/api/cultural-fashion" });
  await app.register(styleBoardRoutes, { prefix: "/api/style-boards" });
  await app.register(discoveryRoutes, { prefix: "/api/discovery" });
  await app.register(visionRoutes, { prefix: "/api/vision" });
  await app.register(weatherRoutes, { prefix: "/api/weather" });
  await app.register(wardrobeHealthRoutes, { prefix: "/api/wardrobe-health" });
  await app.register(publicSettingsRoutes, { prefix: "/api/settings" });
  await app.register(adminAuthRoutes, { prefix: "/api/admin/auth" });
  await app.register(adminRoutes, { prefix: "/api/admin" });
  await app.register(adminUsersRoutes, { prefix: "/api/admin" });
  await app.register(adminSettingsRoutes, { prefix: "/api/admin" });
  await app.register(adminModerationRoutes, { prefix: "/api/admin" });
  await app.register(adminAnalyticsRoutes, { prefix: "/api/admin" });
  await app.register(adminSubscriptionsRoutes, { prefix: "/api/admin" });
  await app.register(adminFashionRoutes, { prefix: "/api/admin" });
  await app.register(adminCulturalFashionRoutes, { prefix: "/api/admin" });
  await app.register(adminCommunityRoutes, { prefix: "/api/admin" });

  return app;
}
