"use server";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE = "kos_cms_admin";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;

type Session = { email: string; expiresAt: number };

function config() {
  return {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    secret: process.env.AUTH_SECRET,
  };
}

function signature(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function credentialsMatch(value: string, expected: string) {
  const received = Buffer.from(value);
  const configured = Buffer.from(expected);
  return received.length === configured.length && timingSafeEqual(received, configured);
}

async function readSession(): Promise<Session | null> {
  const { secret } = config();
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!secret || !value) return null;

  const [payload, receivedSignature] = value.split(".");
  if (!payload || !receivedSignature) return null;

  const expectedSignature = signature(payload, secret);
  if (!credentialsMatch(receivedSignature, expectedSignature)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Session;
    return session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const session = await readSession();
  if (!session) redirect("/admin/login");
  return session;
}

export async function login(formData: FormData) {
  const { email, password, secret } = config();
  const submittedEmail = String(formData.get("email") ?? "").trim().toLowerCase();
  const submittedPassword = String(formData.get("password") ?? "");

  if (!email || !password || !secret || !credentialsMatch(submittedEmail, email.toLowerCase()) || !credentialsMatch(submittedPassword, password)) {
    redirect("/admin/login?error=1");
  }

  const session: Session = { email: submittedEmail, expiresAt: Date.now() + SESSION_DURATION_SECONDS * 1000 };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const value = `${payload}.${signature(payload, secret)}`;
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
  });
  redirect("/admin");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", { httpOnly: true, maxAge: 0, path: "/" });
  redirect("/admin/login");
}
