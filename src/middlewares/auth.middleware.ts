import type { FastifyReply, FastifyRequest } from "fastify";
import { queryOne } from "../database/db.js";
import { verifyJwt } from "../utils/security.js";
import type { AuthUser, DbUser, UserRole } from "../types/index.js";

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return reply.status(401).send({
      success: false,
      message: "Authentication required"
    });
  }

  try {
    const token = authHeader.slice("Bearer ".length);
    const payload = verifyJwt(token);
    const user = await queryOne<Pick<DbUser, "id" | "email" | "role" | "account_status">>(
      "SELECT id, email, role, account_status FROM users WHERE id = $1 AND deleted_at IS NULL",
      [payload.id]
    );

    if (!user || user.account_status !== "active") {
      return reply.status(401).send({
        success: false,
        message: "Invalid authentication token"
      });
    }

    request.user = {
      id: user.id,
      email: user.email,
      role: user.role
    } as AuthUser;
  } catch {
    return reply.status(401).send({
      success: false,
      message: "Invalid authentication token"
    });
  }
}

export function requireRole(roles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        message: "Authentication required"
      });
    }

    if (!roles.includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        message: "You do not have permission to perform this action"
      });
    }
  };
}
