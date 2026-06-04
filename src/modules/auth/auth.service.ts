import { getClient, queryOne } from "../../database/db.js";
import { DEFAULT_PLAN_NAME } from "../../utils/constants.js";
import {
  createRandomToken,
  hashPassword,
  hashToken,
  sanitizeUser,
  signJwt,
  verifyPassword
} from "../../utils/security.js";
import type { DbUser, PublicUser } from "../../types/index.js";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail
} from "../emails/email.service.js";

export async function signup(input: { full_name: string; email: string; password: string }) {
  const client = await getClient();
  const passwordHash = await hashPassword(input.password);
  const verificationToken = createRandomToken();
  const verificationHash = hashToken(verificationToken);

  try {
    await client.query("BEGIN");

    const existing = await client.query<Pick<DbUser, "id">>(
      "SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL",
      [input.email]
    );

    if (existing.rowCount) {
      const error = new Error("Email is already registered");
      (error as Error & { statusCode?: number }).statusCode = 409;
      throw error;
    }

    const userResult = await client.query<DbUser>(
      `INSERT INTO users (full_name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [input.full_name, input.email, passwordHash]
    );

    const user = userResult.rows[0];
    if (!user) {
      throw new Error("Unable to create user");
    }

    await client.query(
      `INSERT INTO email_verifications (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
      [user.id, verificationHash]
    );

    await client.query(
      `INSERT INTO user_subscriptions (user_id, plan_id, status)
       SELECT $1, id, 'active'
       FROM subscription_plans
       WHERE name = $2`,
      [user.id, DEFAULT_PLAN_NAME]
    );

    await client.query("COMMIT");

    await sendVerificationEmail(user.email, user.full_name, verificationToken);

    const safeUser = sanitizeUser(user);
    return {
      user: safeUser,
      token: signJwt({ id: user.id, email: user.email, role: user.role })
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function login(input: { email: string; password: string }) {
  const user = await queryOne<DbUser>(
    "SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL",
    [input.email]
  );

  if (!user || !(await verifyPassword(input.password, user.password_hash))) {
    const error = new Error("Invalid email or password");
    (error as Error & { statusCode?: number }).statusCode = 401;
    throw error;
  }

  if (user.account_status !== "active") {
    const error = new Error("Account is not active");
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }

  return {
    user: sanitizeUser(user),
    token: signJwt({ id: user.id, email: user.email, role: user.role })
  };
}

export async function verifyEmail(token: string) {
  const tokenHash = hashToken(token);
  const record = await queryOne<{ id: string; user_id: string }>(
    `SELECT id, user_id
     FROM email_verifications
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()`,
    [tokenHash]
  );

  if (!record) {
    const error = new Error("Verification token is invalid or expired");
    (error as Error & { statusCode?: number }).statusCode = 400;
    throw error;
  }

  const client = await getClient();
  try {
    await client.query("BEGIN");
    await client.query("UPDATE email_verifications SET used_at = NOW() WHERE id = $1", [record.id]);
    const userResult = await client.query<DbUser>(
      "UPDATE users SET email_verified = TRUE WHERE id = $1 RETURNING *",
      [record.user_id]
    );
    await client.query("COMMIT");

    const user = userResult.rows[0];
    if (user) {
      await sendWelcomeEmail(user.email, user.full_name);
      return sanitizeUser(user);
    }

    return null;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function forgotPassword(email: string) {
  const user = await queryOne<DbUser>(
    "SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL",
    [email]
  );

  if (!user) {
    return;
  }

  const token = createRandomToken();
  await queryOne(
    `INSERT INTO password_resets (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '30 minutes')
     RETURNING id`,
    [user.id, hashToken(token)]
  );
  await sendPasswordResetEmail(user.email, user.full_name, token);
}

export async function resetPassword(input: { token: string; password: string }) {
  const tokenHash = hashToken(input.token);
  const record = await queryOne<{ id: string; user_id: string }>(
    `SELECT id, user_id
     FROM password_resets
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()`,
    [tokenHash]
  );

  if (!record) {
    const error = new Error("Password reset token is invalid or expired");
    (error as Error & { statusCode?: number }).statusCode = 400;
    throw error;
  }

  const passwordHash = await hashPassword(input.password);
  const client = await getClient();
  try {
    await client.query("BEGIN");
    await client.query("UPDATE password_resets SET used_at = NOW() WHERE id = $1", [record.id]);
    await client.query("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, record.user_id]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getMe(userId: string): Promise<PublicUser | null> {
  const user = await queryOne<DbUser>(
    "SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL",
    [userId]
  );
  return user ? sanitizeUser(user) : null;
}
