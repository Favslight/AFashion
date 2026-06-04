import { query, queryOne } from "../../database/db.js";
import { getPagination, getPaginationMeta } from "../admin/admin.schema.js";

interface SettingCreateInput {
  setting_key: string;
  setting_value: unknown;
  description?: string | null;
  is_public: boolean;
}

interface SettingUpdateInput {
  setting_value?: unknown;
  description?: string | null;
  is_public?: boolean;
}

interface PoliciesQuery {
  page: number;
  limit: number;
  search?: string;
  policy_type?: string;
  status?: "active" | "draft" | "archived";
  sort_by: "created_at" | "updated_at" | "title" | "policy_type" | "status";
  sort_order: "asc" | "desc";
}

export async function listSettings(input: {
  page: number;
  limit: number;
  search?: string;
  is_public?: boolean;
  sort_by: "setting_key" | "created_at" | "updated_at";
  sort_order: "asc" | "desc";
}) {
  const filters: string[] = ["1=1"];
  const params: unknown[] = [];

  if (input.search) {
    params.push(`%${input.search}%`);
    filters.push(`(setting_key ILIKE $${params.length} OR description ILIKE $${params.length})`);
  }

  if (typeof input.is_public === "boolean") {
    params.push(input.is_public);
    filters.push(`is_public = $${params.length}`);
  }

  const where = filters.join(" AND ");
  const { limit, offset } = getPagination(input);
  const order = input.sort_order.toUpperCase();

  const [settings, total] = await Promise.all([
    query(
      `SELECT *
       FROM site_settings
       WHERE ${where}
       ORDER BY ${input.sort_by} ${order}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
    queryOne<{ count: number }>(`SELECT COUNT(*)::int AS count FROM site_settings WHERE ${where}`, params)
  ]);

  return {
    settings,
    pagination: getPaginationMeta(total?.count ?? 0, input.page, input.limit)
  };
}

export async function listPublicSettings() {
  return query(
    `SELECT setting_key, setting_value, description
     FROM site_settings
     WHERE is_public = TRUE
     ORDER BY setting_key ASC`
  );
}

export async function getSetting(key: string) {
  const setting = await queryOne("SELECT * FROM site_settings WHERE setting_key = $1", [key]);
  if (!setting) {
    const error = new Error("Setting not found");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }
  return setting;
}

export async function createSetting(adminUserId: string, input: SettingCreateInput) {
  return queryOne(
    `INSERT INTO site_settings (setting_key, setting_value, description, is_public, updated_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [input.setting_key, input.setting_value, input.description ?? null, input.is_public, adminUserId]
  );
}

export async function updateSetting(adminUserId: string, key: string, input: SettingUpdateInput) {
  await getSetting(key);
  return queryOne(
    `UPDATE site_settings
     SET
       setting_value = COALESCE($2, setting_value),
       description = COALESCE($3, description),
       is_public = COALESCE($4, is_public),
       updated_by = $5
     WHERE setting_key = $1
     RETURNING *`,
    [key, input.setting_value, input.description, input.is_public, adminUserId]
  );
}

export async function listPolicies(input: PoliciesQuery) {
  const filters: string[] = ["1=1"];
  const params: unknown[] = [];

  if (input.search) {
    params.push(`%${input.search}%`);
    filters.push(`(title ILIKE $${params.length} OR content ILIKE $${params.length})`);
  }
  if (input.policy_type) {
    params.push(input.policy_type);
    filters.push(`policy_type = $${params.length}`);
  }
  if (input.status) {
    params.push(input.status);
    filters.push(`status = $${params.length}`);
  }

  const where = filters.join(" AND ");
  const { limit, offset } = getPagination(input);
  const order = input.sort_order.toUpperCase();

  const [policies, total] = await Promise.all([
    query(
      `SELECT cp.*, creator.email AS created_by_email, updater.email AS updated_by_email
       FROM content_policies cp
       JOIN admin_users creator ON creator.id = cp.created_by
       LEFT JOIN admin_users updater ON updater.id = cp.updated_by
       WHERE ${where}
       ORDER BY cp.${input.sort_by} ${order}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
    queryOne<{ count: number }>(`SELECT COUNT(*)::int AS count FROM content_policies WHERE ${where}`, params)
  ]);

  return {
    policies,
    pagination: getPaginationMeta(total?.count ?? 0, input.page, input.limit)
  };
}

export async function getPolicy(id: string) {
  const policy = await queryOne(
    `SELECT cp.*, creator.email AS created_by_email, updater.email AS updated_by_email
     FROM content_policies cp
     JOIN admin_users creator ON creator.id = cp.created_by
     LEFT JOIN admin_users updater ON updater.id = cp.updated_by
     WHERE cp.id = $1`,
    [id]
  );

  if (!policy) {
    const error = new Error("Policy not found");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  return policy;
}

export async function createPolicy(adminUserId: string, input: {
  title: string;
  policy_type: string;
  content: string;
  status: string;
  version: string;
}) {
  return queryOne(
    `INSERT INTO content_policies (title, policy_type, content, status, version, created_by, updated_by)
     VALUES ($1, $2, $3, $4, $5, $6, $6)
     RETURNING *`,
    [input.title, input.policy_type, input.content, input.status, input.version, adminUserId]
  );
}

export async function updatePolicy(adminUserId: string, id: string, input: Record<string, unknown>) {
  await getPolicy(id);
  return queryOne(
    `UPDATE content_policies
     SET
       title = COALESCE($2, title),
       policy_type = COALESCE($3, policy_type),
       content = COALESCE($4, content),
       status = COALESCE($5, status),
       version = COALESCE($6, version),
       updated_by = $7
     WHERE id = $1
     RETURNING *`,
    [
      id,
      input.title,
      input.policy_type,
      input.content,
      input.status,
      input.version,
      adminUserId
    ]
  );
}

export async function deletePolicy(id: string) {
  await getPolicy(id);
  return queryOne("DELETE FROM content_policies WHERE id = $1 RETURNING id", [id]);
}
