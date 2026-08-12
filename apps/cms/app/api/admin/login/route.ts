import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

const SESSION_COOKIE = "kos_cms_admin";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;
const CMS_ORIGIN = process.env.CMS_URL ?? "https://cms.chapada.ia.br";

function matches(value: string, expected: string) {
  const received = Buffer.from(value);
  const configured = Buffer.from(expected);
  return received.length === configured.length && timingSafeEqual(received, configured);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const configuredEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const configuredPassword = process.env.ADMIN_PASSWORD;
  const secret = process.env.AUTH_SECRET;

  if (!configuredEmail || !configuredPassword || !secret || !matches(email, configuredEmail) || !matches(password, configuredPassword)) {
    return NextResponse.redirect(new URL("/admin/login?error=1", CMS_ORIGIN), 303);
  }

  const payload = Buffer.from(JSON.stringify({ email, expiresAt: Date.now() + SESSION_DURATION_SECONDS * 1000 })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  const response = NextResponse.redirect(new URL("/admin", CMS_ORIGIN), 303);
  response.cookies.set(SESSION_COOKIE, `${payload}.${signature}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: SESSION_DURATION_SECONDS, path: "/" });
  return response;
}
