import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { AuthAdmin, AuthUser, DbAdminUser, DbUser, PublicAdminUser, PublicUser } from "../types/index.js";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function createRandomToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function signJwt(user: AuthUser) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
  );
}

export function signAdminJwt(admin: AuthAdmin) {
  return jwt.sign(
    {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      token_type: "admin"
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
  );
}

export function verifyJwt(token: string): AuthUser {
  const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
  if (!payload.sub || !payload.email || !payload.role) {
    throw new Error("Invalid token payload");
  }

  return {
    id: String(payload.sub),
    email: String(payload.email),
    role: payload.role as AuthUser["role"]
  };
}

export function verifyAdminJwt(token: string): AuthAdmin {
  const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
  if (!payload.sub || !payload.email || !payload.role || payload.token_type !== "admin") {
    throw new Error("Invalid admin token payload");
  }

  return {
    id: String(payload.sub),
    email: String(payload.email),
    role: payload.role as AuthAdmin["role"]
  };
}

export function sanitizeUser(user: DbUser): PublicUser {
  const { password_hash: _passwordHash, deleted_at: _deletedAt, ...safeUser } = user;
  return safeUser;
}

export function sanitizeAdminUser(admin: DbAdminUser): PublicAdminUser {
  const { password_hash: _passwordHash, ...safeAdmin } = admin;
  return safeAdmin;
}
