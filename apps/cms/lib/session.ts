import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getActiveUser, hasRole, type UserRole, type UserSession } from "./users";

export const SESSION_COOKIE = "kos_cms_admin";
export const SESSION_DURATION_SECONDS = 60 * 60 * 8;

function signature(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function signaturesMatch(value: string, expected: string) {
  const received = Buffer.from(value);
  const configured = Buffer.from(expected);
  return received.length === configured.length && timingSafeEqual(received, configured);
}

export function signSession(user: Omit<UserSession, "expiresAt">) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  const session: UserSession = { ...user, expiresAt: Date.now() + SESSION_DURATION_SECONDS * 1000 };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${signature(payload, secret)}`;
}

export async function getAdminSession(): Promise<UserSession | null> {
  const secret = process.env.AUTH_SECRET;
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!secret || !value) return null;
  const [payload, receivedSignature] = value.split(".");
  if (!payload || !receivedSignature || !signaturesMatch(receivedSignature, signature(payload, secret))) return null;
  try {
    const signed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as UserSession;
    if (!signed.id || signed.expiresAt <= Date.now()) return null;
    const current = await getActiveUser(signed.id);
    if (!current || current.role === "publico") return null;
    return { id: current.id, fullName: current.fullName, email: current.email, role: current.role, isCmsPresident: current.isCmsPresident, expiresAt: signed.expiresAt };
  } catch { return null; }
}

export async function requireAdmin(minimumRole: UserRole = "membro_conselho") {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!hasRole(session, minimumRole)) redirect("/admin?acesso=negado");
  return session;
}
