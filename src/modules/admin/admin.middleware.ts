import type { FastifyReply, FastifyRequest } from "fastify";
import { queryOne } from "../../database/db.js";
import type { DbAdminUser, DbUser } from "../../types/index.js";
import { verifyAdminJwt } from "../../utils/security.js";

export async function authenticateAdmin(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return reply.status(401).send({
      success: false,
      message: "Admin authentication required"
    });
  }

  try {
    const token = authHeader.slice("Bearer ".length);
    const payload = verifyAdminJwt(token);
    const admin = await queryOne<Pick<DbAdminUser, "id" | "email" | "role" | "status">>(
      "SELECT id, email, role, status FROM admin_users WHERE id = $1",
      [payload.id]
    );

    if (!admin || admin.status !== "active") {
      return reply.status(401).send({
        success: false,
        message: "Invalid admin authentication token"
      });
    }

    request.admin = {
      id: admin.id,
      email: admin.email,
      role: admin.role
    };
  } catch {
    return reply.status(401).send({
      success: false,
      message: "Invalid admin authentication token"
    });
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  if (!request.admin || !["admin", "super_admin"].includes(request.admin.role)) {
    return reply.status(403).send({
      success: false,
      message: "Admin access required"
    });
  }
}

export async function requireSuperAdmin(request: FastifyRequest, reply: FastifyReply) {
  if (!request.admin || request.admin.role !== "super_admin") {
    return reply.status(403).send({
      success: false,
      message: "Super admin access required"
    });
  }
}

export async function auditAdminAction(
  request: FastifyRequest,
  input: {
    action: string;
    entity_type: string;
    entity_id?: string | null;
    metadata?: Record<string, unknown>;
  }
) {
  await queryOne(
    `INSERT INTO admin_audit_logs (
       admin_user_id,
       action,
       entity_type,
       entity_id,
       metadata,
       ip_address,
       user_agent
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id`,
    [
      request.admin!.id,
      input.action,
      input.entity_type,
      input.entity_id ?? null,
      input.metadata ?? {},
      request.ip,
      request.headers["user-agent"] ?? null
    ]
  );
}

export async function ensureAdminCanModifyTargetUser(adminUserId: string, targetUserId: string) {
  const [admin, target] = await Promise.all([
    queryOne<Pick<DbAdminUser, "id" | "role">>("SELECT id, role FROM admin_users WHERE id = $1 AND status = 'active'", [adminUserId]),
    queryOne<Pick<DbUser, "id" | "role">>("SELECT id, role FROM users WHERE id = $1 AND deleted_at IS NULL", [targetUserId])
  ]);

  if (!target) {
    const error = new Error("User not found");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  if (!admin || !["admin", "super_admin"].includes(admin.role)) {
    const error = new Error("Admin access required");
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }

  if (admin.role !== "super_admin" && ["admin", "super_admin"].includes(target.role)) {
    const error = new Error("Only super admins can modify admin accounts");
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }

  return target;
}
