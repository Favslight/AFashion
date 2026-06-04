import { query, queryOne } from "../../database/db.js";
import { deleteCloudinaryImage } from "../../utils/image.js";
import { getPagination, getPaginationMeta } from "../admin/admin.schema.js";

interface ListInput {
  page: number;
  limit: number;
  search?: string;
  sort_by: string;
  sort_order: "asc" | "desc";
}

export async function listReports(input: ListInput & { status?: string; entity_type?: string }) {
  const filters: string[] = ["1=1"];
  const params: unknown[] = [];
  addSearch(filters, params, input.search, ["mr.reason", "mr.description"]);
  addEquals(filters, params, "mr.status", input.status);
  addEquals(filters, params, "mr.entity_type", input.entity_type);

  const where = filters.join(" AND ");
  const { limit, offset } = getPagination(input);
  const order = input.sort_order.toUpperCase();

  const [reports, total] = await Promise.all([
    query(
      `SELECT mr.*, reporter.email AS reporter_email, reported.email AS reported_email, reviewer.email AS reviewer_email
       FROM moderation_reports mr
       JOIN users reporter ON reporter.id = mr.reporter_user_id
       LEFT JOIN users reported ON reported.id = mr.reported_user_id
       LEFT JOIN admin_users reviewer ON reviewer.id = mr.reviewed_by
       WHERE ${where}
       ORDER BY mr.${input.sort_by} ${order}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
    queryOne<{ count: number }>(
      `SELECT COUNT(*)::int AS count
       FROM moderation_reports mr
       WHERE ${where}`,
      params
    )
  ]);

  return {
    reports,
    pagination: getPaginationMeta(total?.count ?? 0, input.page, input.limit)
  };
}

export async function getReport(id: string) {
  const report = await queryOne(
    `SELECT mr.*, reporter.email AS reporter_email, reported.email AS reported_email, reviewer.email AS reviewer_email
     FROM moderation_reports mr
     JOIN users reporter ON reporter.id = mr.reporter_user_id
     LEFT JOIN users reported ON reported.id = mr.reported_user_id
     LEFT JOIN admin_users reviewer ON reviewer.id = mr.reviewed_by
     WHERE mr.id = $1`,
    [id]
  );
  if (!report) throwNotFound("Moderation report not found");
  return report;
}

export async function updateReportStatus(adminUserId: string, id: string, input: {
  status: string;
  resolution_note?: string | null;
}) {
  await getReport(id);
  return queryOne(
    `UPDATE moderation_reports
     SET status = $2,
       reviewed_by = $3,
       reviewed_at = NOW(),
       resolution_note = $4
     WHERE id = $1
     RETURNING *`,
    [id, input.status, adminUserId, input.resolution_note ?? null]
  );
}

export async function listBlockedKeywords(input: ListInput & {
  category?: string;
  severity?: string;
  is_active?: boolean;
}) {
  const filters: string[] = ["1=1"];
  const params: unknown[] = [];
  addSearch(filters, params, input.search, ["keyword", "category"]);
  addEquals(filters, params, "category", input.category);
  addEquals(filters, params, "severity", input.severity);
  if (typeof input.is_active === "boolean") {
    params.push(input.is_active);
    filters.push(`is_active = $${params.length}`);
  }

  const where = filters.join(" AND ");
  const { limit, offset } = getPagination(input);
  const order = input.sort_order.toUpperCase();

  const [keywords, total] = await Promise.all([
    query(
      `SELECT bk.*, u.email AS created_by_email
       FROM blocked_keywords bk
       JOIN admin_users u ON u.id = bk.created_by
       WHERE ${where}
       ORDER BY bk.${input.sort_by} ${order}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
    queryOne<{ count: number }>(`SELECT COUNT(*)::int AS count FROM blocked_keywords WHERE ${where}`, params)
  ]);

  return {
    keywords,
    pagination: getPaginationMeta(total?.count ?? 0, input.page, input.limit)
  };
}

export async function createBlockedKeyword(adminUserId: string, input: {
  keyword: string;
  category: string;
  severity: string;
  is_active: boolean;
}) {
  return queryOne(
    `INSERT INTO blocked_keywords (keyword, category, severity, is_active, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [input.keyword, input.category, input.severity, input.is_active, adminUserId]
  );
}

export async function updateBlockedKeyword(id: string, input: Record<string, unknown>) {
  await getBlockedKeyword(id);
  return queryOne(
    `UPDATE blocked_keywords
     SET keyword = COALESCE($2, keyword),
       category = COALESCE($3, category),
       severity = COALESCE($4, severity),
       is_active = COALESCE($5, is_active)
     WHERE id = $1
     RETURNING *`,
    [id, input.keyword, input.category, input.severity, input.is_active]
  );
}

export async function deleteBlockedKeyword(id: string) {
  await getBlockedKeyword(id);
  return queryOne("DELETE FROM blocked_keywords WHERE id = $1 RETURNING id", [id]);
}

export async function listWardrobeItems(input: ListInput & { user_id?: string; category?: string }) {
  const filters: string[] = ["wi.deleted_at IS NULL"];
  const params: unknown[] = [];
  addSearch(filters, params, input.search, ["wi.name", "wi.category", "wi.color", "u.email"]);
  addEquals(filters, params, "wi.user_id", input.user_id);
  addEquals(filters, params, "wi.category", input.category);

  const where = filters.join(" AND ");
  const { limit, offset } = getPagination(input);
  const order = input.sort_order.toUpperCase();

  const [items, total] = await Promise.all([
    query(
      `SELECT wi.*, u.email AS owner_email, u.full_name AS owner_name
       FROM wardrobe_items wi
       JOIN users u ON u.id = wi.user_id
       WHERE ${where}
       ORDER BY wi.${input.sort_by} ${order}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
    queryOne<{ count: number }>(
      `SELECT COUNT(*)::int AS count
       FROM wardrobe_items wi
       JOIN users u ON u.id = wi.user_id
       WHERE ${where}`,
      params
    )
  ]);

  return {
    items,
    pagination: getPaginationMeta(total?.count ?? 0, input.page, input.limit)
  };
}

export async function getWardrobeItem(id: string) {
  const item = await queryOne(
    `SELECT wi.*, u.email AS owner_email, u.full_name AS owner_name
     FROM wardrobe_items wi
     JOIN users u ON u.id = wi.user_id
     WHERE wi.id = $1 AND wi.deleted_at IS NULL`,
    [id]
  );
  if (!item) throwNotFound("Wardrobe item not found");
  return item;
}

export async function deleteWardrobeItem(id: string) {
  const item = await getWardrobeItem(id) as { image_public_id?: string };
  const deleted = await queryOne(
    `UPDATE wardrobe_items
     SET deleted_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id`,
    [id]
  );
  if (item.image_public_id) {
    await deleteCloudinaryImage(item.image_public_id);
  }
  return deleted;
}

export async function listOutfits(input: ListInput & { user_id?: string; occasion_id?: string; is_saved?: boolean }) {
  const filters: string[] = ["1=1"];
  const params: unknown[] = [];
  addSearch(filters, params, input.search, ["o.title", "o.ai_summary", "u.email", "oc.name"]);
  addEquals(filters, params, "o.user_id", input.user_id);
  addEquals(filters, params, "o.occasion_id", input.occasion_id);
  if (typeof input.is_saved === "boolean") {
    params.push(input.is_saved);
    filters.push(`o.is_saved = $${params.length}`);
  }

  const where = filters.join(" AND ");
  const { limit, offset } = getPagination(input);
  const order = input.sort_order.toUpperCase();

  const [outfits, total] = await Promise.all([
    query(
      `SELECT o.*, u.email AS owner_email, u.full_name AS owner_name, oc.name AS occasion_name, oc.slug AS occasion_slug
       FROM outfits o
       JOIN users u ON u.id = o.user_id
       LEFT JOIN outfit_occasions oc ON oc.id = o.occasion_id
       WHERE ${where}
       ORDER BY o.${input.sort_by} ${order}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
    queryOne<{ count: number }>(
      `SELECT COUNT(*)::int AS count
       FROM outfits o
       JOIN users u ON u.id = o.user_id
       LEFT JOIN outfit_occasions oc ON oc.id = o.occasion_id
       WHERE ${where}`,
      params
    )
  ]);

  return {
    outfits,
    pagination: getPaginationMeta(total?.count ?? 0, input.page, input.limit)
  };
}

export async function getOutfit(id: string) {
  const outfit = await queryOne(
    `SELECT o.*, u.email AS owner_email, u.full_name AS owner_name, oc.name AS occasion_name, oc.slug AS occasion_slug
     FROM outfits o
     JOIN users u ON u.id = o.user_id
     LEFT JOIN outfit_occasions oc ON oc.id = o.occasion_id
     WHERE o.id = $1`,
    [id]
  );
  if (!outfit) throwNotFound("Outfit not found");

  const items = await query(
    `SELECT wi.*, oi.item_role
     FROM outfit_items oi
     JOIN wardrobe_items wi ON wi.id = oi.wardrobe_item_id
     WHERE oi.outfit_id = $1
     ORDER BY oi.created_at ASC`,
    [id]
  );

  return { outfit, items };
}

export async function deleteOutfit(id: string) {
  await getOutfit(id);
  return queryOne("DELETE FROM outfits WHERE id = $1 RETURNING id", [id]);
}

async function getBlockedKeyword(id: string) {
  const keyword = await queryOne("SELECT * FROM blocked_keywords WHERE id = $1", [id]);
  if (!keyword) throwNotFound("Blocked keyword not found");
  return keyword;
}

function addSearch(filters: string[], params: unknown[], search: string | undefined, columns: string[]) {
  if (!search) return;
  params.push(`%${search}%`);
  filters.push(`(${columns.map((column) => `${column} ILIKE $${params.length}`).join(" OR ")})`);
}

function addEquals(filters: string[], params: unknown[], column: string, value: unknown) {
  if (value === undefined || value === null || value === "") return;
  params.push(value);
  filters.push(`${column} = $${params.length}`);
}

function throwNotFound(message: string): never {
  const error = new Error(message);
  (error as Error & { statusCode?: number }).statusCode = 404;
  throw error;
}
