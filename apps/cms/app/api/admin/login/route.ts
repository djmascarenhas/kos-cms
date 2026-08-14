import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_DURATION_SECONDS, signSession } from "../../../../lib/session";
import { authenticateUser } from "../../../../lib/users";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const result = await authenticateUser(email, password);
  const origin = process.env.CMS_URL ?? "https://cms.chapada.ia.br";
  if (result.kind !== "ok") {
    const reason = result.kind === "pending" ? "pendente" : result.kind === "suspended" ? "suspenso" : "credenciais";
    return NextResponse.redirect(new URL(`/admin/login?erro=${reason}`, origin), 303);
  }
  if (result.user.role === "publico") return NextResponse.redirect(new URL("/admin/login?erro=sem_acesso", origin), 303);
  const value = signSession({
    id: result.user.id,
    fullName: result.user.fullName,
    email: result.user.email,
    role: result.user.role,
    isCmsPresident: result.user.isCmsPresident,
  });
  const response = NextResponse.redirect(new URL("/admin", origin), 303);
  response.cookies.set(SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
  });
  return response;
}
