import { z } from "zod";

export const discoveryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const discoverySlugParamsSchema = z.object({
  slug: z.string().trim().min(1).max(120)
});
