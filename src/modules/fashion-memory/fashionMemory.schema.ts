import { z } from "zod";

export const memoryCreateSchema = z.object({
  memory_type: z.string().trim().min(2).max(80),
  memory_key: z.string().trim().min(1).max(160),
  memory_value: z.record(z.unknown()),
  confidence_score: z.number().min(0).max(1).default(0.5),
  source: z.string().trim().max(120).optional()
});

export const memoryUpdateSchema = memoryCreateSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});

export const memoryParamsSchema = z.object({ id: z.string().uuid() });
