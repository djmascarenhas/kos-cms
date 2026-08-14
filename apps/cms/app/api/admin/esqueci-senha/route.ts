import { isIP } from "node:net";
import { NextResponse } from "next/server";
import { sendPasswordResetEmail } from "../../../../lib/email";
import { createPasswordResetLink } from "../../../../lib/users";

export const runtime = "nodejs";

const cmsUrl = process.env.CMS_URL ?? "https://cms.chapada.ia.br";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.redirect(new URL("/admin/esqueci-senha?erro=validacao", cmsUrl), 303);
  }
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const ip = forwarded && isIP(forwarded) ? forwarded : null;
  try {
    const reset = await createPasswordResetLink({ email, ip, userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? null });
    if (!reset) return NextResponse.redirect(new URL(`/admin/cadastro?email=${encodeURIComponent(email)}&origem=recuperacao`, cmsUrl), 303);
    const resetUrl = new URL("/admin/redefinir-senha", cmsUrl);
    resetUrl.searchParams.set("token", reset.token);
    await sendPasswordResetEmail({ to: reset.email, fullName: reset.fullName, resetUrl: resetUrl.toString() });
    return NextResponse.redirect(new URL("/admin/login?senha=email_enviado", cmsUrl), 303);
  } catch {
    return NextResponse.redirect(new URL("/admin/esqueci-senha?erro=email", cmsUrl), 303);
  }
}
