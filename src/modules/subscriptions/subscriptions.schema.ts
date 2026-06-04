import { z } from "zod";

export const changePlanSchema = z.object({
  plan_id: z.string().uuid()
});
