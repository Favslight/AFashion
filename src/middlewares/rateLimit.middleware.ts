import { ADMIN_RATE_LIMIT, AI_RATE_LIMIT, AUTH_RATE_LIMIT } from "../utils/constants.js";

export const authRouteRateLimit = {
  rateLimit: AUTH_RATE_LIMIT
};

export const aiRouteRateLimit = {
  rateLimit: AI_RATE_LIMIT
};

export const adminRouteRateLimit = {
  rateLimit: ADMIN_RATE_LIMIT
};
