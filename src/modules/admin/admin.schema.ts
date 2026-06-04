import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(160).optional(),
  sort_by: z.string().trim().max(80).optional(),
  sort_order: z.enum(["asc", "desc"]).default("desc")
});

export const uuidParamsSchema = z.object({
  id: z.string().uuid()
});

export function getPagination(input: z.infer<typeof paginationQuerySchema>) {
  return {
    limit: input.limit,
    offset: (input.page - 1) * input.limit
  };
}

export function getPaginationMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    total_pages: Math.ceil(total / limit)
  };
}
