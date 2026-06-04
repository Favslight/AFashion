import { z } from "zod";

export const wardrobeHealthAnalyzeSchema = z.object({
  focus: z.enum(["overall", "professional", "casual", "event", "climate"]).default("overall"),
  climate: z.string().trim().max(120).optional()
});

export const reportParamsSchema = z.object({
  id: z.string().uuid()
});
