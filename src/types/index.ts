import type { FastifyRequest } from "fastify";

export type UserRole = "user" | "admin" | "super_admin";
export type AdminRole = "admin" | "super_admin";
export type AccountStatus = "active" | "suspended" | "deactivated";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthAdmin {
  id: string;
  email: string;
  role: AdminRole;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
    admin?: AuthAdmin;
  }
}

export interface DbUser {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  account_status: AccountStatus;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  suspended_at: string | null;
  suspended_by: string | null;
  suspension_reason: string | null;
}

export type PublicUser = Omit<DbUser, "password_hash" | "deleted_at">;

export interface DbAdminUser {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  role: AdminRole;
  status: "active" | "disabled";
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export type PublicAdminUser = Omit<DbAdminUser, "password_hash">;

export interface SubscriptionPlan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  max_wardrobe_items: number;
  max_ai_generations_per_month: number;
  features: Record<string, unknown>;
  created_at: string;
}

export interface WardrobeItemAnalysis {
  category: string;
  color: string;
  secondary_colors: string[];
  style_tags: string[];
  material: string;
  season_tags: string[];
  gender_fit: string;
  description: string;
  confidence_score: number;
}

export interface OutfitGenerationResult {
  title: string;
  selected_wardrobe_item_ids: string[];
  styling_notes: string;
  why_this_works: string;
  color_harmony_score: number;
  formality_score: number;
  comfort_score: number;
  alternative_combinations: Array<{
    title: string;
    wardrobe_item_ids: string[];
    notes: string;
  }>;
}

export interface OutfitPhotoAnalysis {
  occasion_fit: string;
  color_harmony: string;
  formality: string;
  fit_balance: string;
  styling_improvements: string[];
  accessory_suggestions: string[];
  overall_score: number;
}

export type AuthenticatedRequest = FastifyRequest & { user: AuthUser };
