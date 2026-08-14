import { isIP } from "node:net";
import { NextResponse } from "next/server";
import { resetPasswordWithToken } from "../../../../lib/users";

export const runtime = "nodejs";
const cmsUrl = process.env.CMS_URL ?? "https://cms.chapada.ia.br";

function validPassword(value: string) {
  return value.length >= 10 && value.length <= 128 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /[0-9]/.test(value);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const token = String(form.get("token") ?? "");
  const password = String(form.get("password") ?? "");
  const confirmation = String(form.get("passwordConfirmation") ?? "");
  if (!/^[A-Za-z0-9_-]{43}$/.test(token) || !validPassword(password) || password !== confirmation) {
    return NextResponse.redirect(new URL(`/admin/redefinir-senha?token=${encodeURIComponent(token)}&erro=validacao`, cmsUrl), 303);
  }
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const ip = forwarded && isIP(forwarded) ? forwarded : null;
  try {
    const changed = await resetPasswordWithToken({ token, password, ip, userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? null });
    if (!changed) return NextResponse.redirect(new URL("/admin/redefinir-senha?erro=expirado", cmsUrl), 303);
    return NextResponse.redirect(new URL("/admin/login?senha=alterada", cmsUrl), 303);
  } catch {
    return NextResponse.redirect(new URL("/admin/redefinir-senha?erro=indisponivel", cmsUrl), 303);
  }
}
