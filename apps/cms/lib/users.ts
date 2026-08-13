import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { Pool, type PoolClient } from "pg";

export const userRoles = ["publico", "membro_conselho", "gestao", "diretoria_cms", "master"] as const;
export type UserRole = (typeof userRoles)[number];
export type UserStatus = "pendente" | "ativo" | "suspenso" | "rejeitado";

export type CmsUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  councilPosition: string | null;
  councilSegment: string | null;
  isCmsPresident: boolean;
  approvedAt: string | null;
  createdAt: string;
  lastLoginAt: string | null;
};

export type UserSession = Pick<CmsUser, "id" | "fullName" | "email" | "role" | "isCmsPresident"> & {
  expiresAt: number;
};

const roleWeight: Record<UserRole, number> = {
  publico: 0,
  membro_conselho: 1,
  gestao: 2,
  diretoria_cms: 3,
  master: 4,
};

let pool: Pool | undefined;

function database() {
  const connectionString = process.env.ADMIN_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured");
  pool ??= new Pool({ connectionString, max: 3, idleTimeoutMillis: 10_000 });
  return pool;
}

const userSelect = `SELECT id, full_name AS "fullName", email, role::text AS role,
  status::text AS status, council_position AS "councilPosition", council_segment AS "councilSegment",
  is_cms_president AS "isCmsPresident", approved_at::text AS "approvedAt",
  created_at::text AS "createdAt", last_login_at::text AS "lastLoginAt" FROM cms_users`;

export function hasRole(user: Pick<UserSession, "role">, minimum: UserRole) {
  return roleWeight[user.role] >= roleWeight[minimum];
}

export function canPublish(user: Pick<UserSession, "role">) {
  return hasRole(user, "diretoria_cms");
}

export function canApproveUsers(user: Pick<UserSession, "role" | "isCmsPresident">) {
  return user.role === "master" || user.isCmsPresident;
}

export function roleLabel(role: UserRole) {
  return ({
    publico: "Público",
    membro_conselho: "Membro do Conselho",
    gestao: "Gestão",
    diretoria_cms: "Diretoria do CMS",
    master: "Master",
  } satisfies Record<UserRole, string>)[role];
}

export function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

function verifyPassword(password: string, encoded: string) {
  const [algorithm, saltText, hashText] = encoded.split("$");
  if (algorithm !== "scrypt" || !saltText || !hashText) return false;
  try {
    const expected = Buffer.from(hashText, "base64url");
    const actual = scryptSync(password, Buffer.from(saltText, "base64url"), expected.length);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function constantTimeMatch(value: string, expected: string) {
  const received = Buffer.from(value);
  const configured = Buffer.from(expected);
  return received.length === configured.length && timingSafeEqual(received, configured);
}

export async function getActiveUser(id: string) {
  const result = await database().query<CmsUser>(`${userSelect} WHERE id = $1 AND status = 'ativo'`, [id]);
  return result.rows[0] ?? null;
}

async function bootstrapLegacyMaster(email: string, password: string) {
  const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredEmail || !configuredPassword || !constantTimeMatch(email, configuredEmail) || !constantTimeMatch(password, configuredPassword)) return null;
  const result = await database().query<CmsUser>(
    `INSERT INTO cms_users (full_name, email, password_hash, role, status, approved_at)
     VALUES ('Administrador Master', $1, $2, 'master', 'ativo', now())
     ON CONFLICT (lower(email)) DO UPDATE SET role = 'master', status = 'ativo', updated_at = now()
     RETURNING id, full_name AS "fullName", email, role::text AS role, status::text AS status,
       council_position AS "councilPosition", council_segment AS "councilSegment",
       is_cms_president AS "isCmsPresident", approved_at::text AS "approvedAt",
       created_at::text AS "createdAt", last_login_at::text AS "lastLoginAt"`,
    [email, hashPassword(password)],
  );
  return result.rows[0] ?? null;
}

export type AuthenticationResult =
  | { kind: "ok"; user: CmsUser }
  | { kind: "invalid" | "pending" | "suspended" };

export async function authenticateUser(email: string, password: string): Promise<AuthenticationResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const result = await database().query<CmsUser & { passwordHash: string }>(
    `${userSelect.replace(" FROM cms_users", ", password_hash AS \"passwordHash\" FROM cms_users")} WHERE lower(email) = $1`,
    [normalizedEmail],
  );
  let user: (CmsUser & { passwordHash?: string }) | null = result.rows[0] ?? null;
  if (!user) user = await bootstrapLegacyMaster(normalizedEmail, password);
  if (!user) return { kind: "invalid" };
  if (user.status === "pendente") return { kind: "pending" };
  if (user.status !== "ativo") return { kind: "suspended" };
  if ("passwordHash" in user && user.passwordHash && !verifyPassword(password, user.passwordHash)) return { kind: "invalid" };
  if (!("passwordHash" in user) && !(process.env.ADMIN_PASSWORD && constantTimeMatch(password, process.env.ADMIN_PASSWORD))) return { kind: "invalid" };
  await database().query("UPDATE cms_users SET last_login_at = now(), updated_at = now() WHERE id = $1", [user.id]);
  return { kind: "ok", user };
}

export async function registerCouncilMember(input: {
  fullName: string;
  email: string;
  password: string;
  councilPosition: string;
  councilSegment: string;
}) {
  const email = input.email.trim().toLowerCase();
  const existing = await database().query<{ status: UserStatus }>("SELECT status::text AS status FROM cms_users WHERE lower(email) = $1", [email]);
  if (existing.rows[0]) return { created: false, status: existing.rows[0].status };
  await database().query(
    `INSERT INTO cms_users (full_name, email, password_hash, role, status, council_position, council_segment)
     VALUES ($1, $2, $3, 'membro_conselho', 'pendente', $4, $5)`,
    [input.fullName.trim(), email, hashPassword(input.password), input.councilPosition.trim(), input.councilSegment.trim() || null],
  );
  return { created: true, status: "pendente" as const };
}

export async function requestPasswordChange(input: { email: string; password: string; ip: string | null; userAgent: string | null }) {
  const connection = await database().connect();
  try {
    await connection.query("BEGIN");
    const user = await connection.query<{ id: string }>("SELECT id FROM cms_users WHERE lower(email) = $1 AND status = 'ativo' FOR UPDATE", [input.email.trim().toLowerCase()]);
    if (user.rows[0]) {
      await connection.query("UPDATE password_reset_requests SET status = 'cancelado', reviewed_at = now() WHERE user_id = $1 AND status = 'pendente'", [user.rows[0].id]);
      await connection.query(
        `INSERT INTO password_reset_requests (user_id, requested_password_hash, request_ip, user_agent)
         VALUES ($1, $2, $3::inet, $4)`,
        [user.rows[0].id, hashPassword(input.password), input.ip, input.userAgent],
      );
    }
    await connection.query("COMMIT");
  } catch (error) {
    await connection.query("ROLLBACK");
    throw error;
  } finally {
    connection.release();
  }
}

export async function createPasswordResetLink(input: { email: string; ip: string | null; userAgent: string | null }) {
  const email = input.email.trim().toLowerCase();
  const connection = await database().connect();
  try {
    await connection.query("BEGIN");
    const account = await connection.query<{ id: string; fullName: string; email: string }>(
      `SELECT id, full_name AS "fullName", email FROM cms_users
       WHERE lower(email) = $1 AND status = 'ativo' FOR UPDATE`,
      [email],
    );
    const user = account.rows[0];
    if (!user) {
      await connection.query("COMMIT");
      return null;
    }
    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await connection.query(
      `UPDATE password_reset_tokens SET used_at = now()
       WHERE user_id = $1 AND used_at IS NULL`,
      [user.id],
    );
    await connection.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, requested_ip, user_agent)
       VALUES ($1, $2, now() + interval '2 minutes', $3::inet, $4)`,
      [user.id, tokenHash, input.ip, input.userAgent],
    );
    await connection.query("COMMIT");
    return { ...user, token };
  } catch (error) {
    await connection.query("ROLLBACK");
    throw error;
  } finally {
    connection.release();
  }
}

export async function resetPasswordWithToken(input: { token: string; password: string; ip: string | null; userAgent: string | null }) {
  const tokenHash = createHash("sha256").update(input.token).digest("hex");
  const connection = await database().connect();
  try {
    await connection.query("BEGIN");
    const result = await connection.query<{ userId: string; fullName: string; email: string }>(
      `SELECT token.user_id AS "userId", account.full_name AS "fullName", account.email
       FROM password_reset_tokens token JOIN cms_users account ON account.id = token.user_id
       WHERE token.token_hash = $1 AND token.used_at IS NULL AND token.expires_at > now()
         AND account.status = 'ativo' FOR UPDATE OF token, account`,
      [tokenHash],
    );
    const reset = result.rows[0];
    if (!reset) {
      await connection.query("ROLLBACK");
      return false;
    }
    await connection.query(
      `UPDATE cms_users SET password_hash = $2, password_changed_at = now(), updated_at = now() WHERE id = $1`,
      [reset.userId, hashPassword(input.password)],
    );
    await connection.query(
      `UPDATE password_reset_tokens SET used_at = now() WHERE token_hash = $1`,
      [tokenHash],
    );
    await connection.query(
      `UPDATE password_reset_tokens SET used_at = now()
       WHERE user_id = $1 AND used_at IS NULL AND token_hash <> $2`,
      [reset.userId, tokenHash],
    );
    await connection.query(
      `INSERT INTO audit_logs (entity_type, entity_id, action, details, actor_name, actor_email, source_ip, user_agent)
       VALUES ('user', $1, 'password_reset_completed', $2::jsonb, $3, $4, $5::inet, $6)`,
      [reset.userId, JSON.stringify({ via: "email_link" }), reset.fullName, reset.email, input.ip, input.userAgent],
    );
    await connection.query("COMMIT");
    return true;
  } catch (error) {
    await connection.query("ROLLBACK");
    throw error;
  } finally {
    connection.release();
  }
}

export type PasswordRequest = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  requestedAt: string;
};

export async function listUsersAndRequests() {
  const [users, requests] = await Promise.all([
    database().query<CmsUser>(`${userSelect} ORDER BY CASE status WHEN 'pendente' THEN 0 ELSE 1 END, created_at DESC`),
    database().query<PasswordRequest>(
      `SELECT request.id, request.user_id AS "userId", account.full_name AS "fullName", account.email,
       request.requested_at::text AS "requestedAt" FROM password_reset_requests request
       JOIN cms_users account ON account.id = request.user_id WHERE request.status = 'pendente'
       ORDER BY request.requested_at`,
    ),
  ]);
  return { users: users.rows, passwordRequests: requests.rows };
}

async function addUserAudit(connection: PoolClient, actor: UserSession, targetId: string, action: string, details: Record<string, unknown>) {
  await connection.query(
    `INSERT INTO audit_logs (entity_type, entity_id, action, details, actor_user_id, actor_name, actor_email, actor_role)
     VALUES ('user', $1, $2, $3::jsonb, $4, $5, $6, $7)`,
    [targetId, action, JSON.stringify(details), actor.id, actor.fullName, actor.email, actor.role],
  );
}

export async function approveUser(userId: string, actor: UserSession) {
  if (!canApproveUsers(actor)) throw new Error("forbidden");
  const connection = await database().connect();
  try {
    await connection.query("BEGIN");
    const target = await connection.query<{ fullName: string; email: string }>(
      `UPDATE cms_users SET status = 'ativo', role = 'membro_conselho', approved_by = $2,
       approved_at = now(), updated_at = now() WHERE id = $1 AND status = 'pendente'
       RETURNING full_name AS "fullName", email`,
      [userId, actor.id],
    );
    if (!target.rows[0]) throw new Error("not_found");
    await addUserAudit(connection, actor, userId, "user_approved", { role: "membro_conselho", ...target.rows[0] });
    await connection.query("COMMIT");
  } catch (error) {
    await connection.query("ROLLBACK");
    throw error;
  } finally { connection.release(); }
}

export async function rejectUser(userId: string, actor: UserSession) {
  if (!canApproveUsers(actor)) throw new Error("forbidden");
  const connection = await database().connect();
  try {
    await connection.query("BEGIN");
    const target = await connection.query<{ email: string }>("UPDATE cms_users SET status = 'rejeitado', is_cms_president = false, updated_at = now() WHERE id = $1 AND status = 'pendente' RETURNING email", [userId]);
    if (!target.rows[0]) throw new Error("not_found");
    await addUserAudit(connection, actor, userId, "user_rejected", target.rows[0]);
    await connection.query("COMMIT");
  } catch (error) { await connection.query("ROLLBACK"); throw error; }
  finally { connection.release(); }
}

export async function updateUserAccess(userId: string, role: UserRole, status: UserStatus, isPresident: boolean, actor: UserSession) {
  if (actor.role !== "master") throw new Error("forbidden");
  if (!userRoles.includes(role) || !["ativo", "suspenso", "rejeitado"].includes(status)) throw new Error("validation");
  if (isPresident && role !== "diretoria_cms") throw new Error("president_role");
  if (userId === actor.id && (role !== "master" || status !== "ativo")) throw new Error("self_lockout");
  const connection = await database().connect();
  try {
    await connection.query("BEGIN");
    if (isPresident) await connection.query("UPDATE cms_users SET is_cms_president = false, updated_at = now() WHERE is_cms_president = true AND id <> $1", [userId]);
    const target = await connection.query<{ email: string }>(
      `UPDATE cms_users SET role = $2, status = $3, is_cms_president = $4,
       approved_by = CASE WHEN $3 = 'ativo' THEN COALESCE(approved_by, $5) ELSE approved_by END,
       approved_at = CASE WHEN $3 = 'ativo' THEN COALESCE(approved_at, now()) ELSE approved_at END,
       updated_at = now() WHERE id = $1 RETURNING email`,
      [userId, role, status, isPresident, actor.id],
    );
    if (!target.rows[0]) throw new Error("not_found");
    await addUserAudit(connection, actor, userId, "user_access_updated", { email: target.rows[0].email, role, status, isPresident });
    await connection.query("COMMIT");
  } catch (error) { await connection.query("ROLLBACK"); throw error; }
  finally { connection.release(); }
}

export async function reviewPasswordRequest(requestId: string, approve: boolean, actor: UserSession) {
  if (!canApproveUsers(actor)) throw new Error("forbidden");
  const connection = await database().connect();
  try {
    await connection.query("BEGIN");
    const request = await connection.query<{ userId: string; passwordHash: string; email: string }>(
      `SELECT request.user_id AS "userId", request.requested_password_hash AS "passwordHash", account.email
       FROM password_reset_requests request JOIN cms_users account ON account.id = request.user_id
       WHERE request.id = $1 AND request.status = 'pendente' FOR UPDATE`,
      [requestId],
    );
    if (!request.rows[0]) throw new Error("not_found");
    if (approve) await connection.query("UPDATE cms_users SET password_hash = $2, password_changed_at = now(), updated_at = now() WHERE id = $1", [request.rows[0].userId, request.rows[0].passwordHash]);
    await connection.query("UPDATE password_reset_requests SET status = $2, reviewed_by = $3, reviewed_at = now() WHERE id = $1", [requestId, approve ? "aprovado" : "rejeitado", actor.id]);
    await addUserAudit(connection, actor, request.rows[0].userId, approve ? "password_change_approved" : "password_change_rejected", { email: request.rows[0].email });
    await connection.query("COMMIT");
  } catch (error) { await connection.query("ROLLBACK"); throw error; }
  finally { connection.release(); }
}
