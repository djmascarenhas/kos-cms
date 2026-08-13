import { NextResponse } from "next/server";
import { registerCouncilMember } from "../../../../lib/users";

export const runtime = "nodejs";

function validPassword(value: string) {
  return value.length >= 10 && value.length <= 128 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /[0-9]/.test(value);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const fullName = String(form.get("fullName") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const councilPosition = String(form.get("councilPosition") ?? "").trim();
  const councilSegment = String(form.get("councilSegment") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const confirmation = String(form.get("passwordConfirmation") ?? "");
  const origin = new URL(request.url).origin;
  const valid = fullName.length >= 3 && fullName.length <= 160 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254 && councilPosition.length >= 2 && councilPosition.length <= 160 && councilSegment.length <= 160 && validPassword(password) && password === confirmation;
  if (!valid) return NextResponse.redirect(new URL("/admin/cadastro?erro=validacao", origin), 303);
  try {
    const result = await registerCouncilMember({ fullName, email, password, councilPosition, councilSegment });
    if (!result.created) return NextResponse.redirect(new URL("/admin/cadastro?erro=existente", origin), 303);
    return NextResponse.redirect(new URL("/admin/login?cadastro=pendente", origin), 303);
  } catch {
    return NextResponse.redirect(new URL("/admin/cadastro?erro=salvar", origin), 303);
  }
}
