import { z } from "zod";

export const creatorProfileSchema = z.object({
  display_name: z.string().trim().min(2).max(120),
  bio: z.string().trim().max(700).optional().nullable(),
  profile_image_url: z.string().url().optional().nullable(),
  profile_image_public_id: z.string().trim().max(200).optional().nullable(),
  website_url: z.string().url().optional().nullable(),
  instagram_handle: z.string().trim().max(80).optional().nullable(),
  tiktok_handle: z.string().trim().max(80).optional().nullable(),
  creator_type: z.enum(["public_user", "stylist", "creator"]).default("public_user")
});

export const creatorProfilePatchSchema = creatorProfileSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});

export const creatorParamsSchema = z.object({ id: z.string().uuid() });
