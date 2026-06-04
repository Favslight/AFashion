export const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp"
]);

export const AUTH_RATE_LIMIT = {
  max: 8,
  timeWindow: "1 minute"
};

export const AI_RATE_LIMIT = {
  max: 20,
  timeWindow: "1 minute"
};

export const ADMIN_RATE_LIMIT = {
  max: 80,
  timeWindow: "1 minute"
};

export const DEFAULT_PLAN_NAME = "Free";
