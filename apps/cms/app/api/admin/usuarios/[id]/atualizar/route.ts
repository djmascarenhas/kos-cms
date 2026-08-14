import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { updateUserAccess, userRoles, type UserRole, type UserStatus } from "@/lib/users";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const origin = process.env.CMS_URL ?? "https://cms.chapada.ia.br"; const session = await getAdminSession(); const { id } = await params;
  if (!session) return NextResponse.redirect(new URL("/admin/login", origin), 303);
  const form = await request.formData(); const role = String(form.get("role")) as UserRole; const status = String(form.get("status")) as UserStatus; const isPresident = form.get("isPresident") === "on";
  if (!userRoles.includes(role) || !["ativo", "suspenso", "rejeitado"].includes(status)) return NextResponse.redirect(new URL("/admin/usuarios?erro=validacao", origin), 303);
  try { await updateUserAccess(id, role, status, isPresident, session); return NextResponse.redirect(new URL("/admin/usuarios?salvo=1", origin), 303); }
  catch { return NextResponse.redirect(new URL("/admin/usuarios?erro=atualizar", origin), 303); }
}
