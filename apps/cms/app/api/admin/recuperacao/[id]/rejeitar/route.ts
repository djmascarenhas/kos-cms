import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { reviewPasswordRequest } from "@/lib/users";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const origin = process.env.CMS_URL ?? "https://cms.chapada.ia.br"; const session = await getAdminSession(); const { id } = await params;
  if (!session) return NextResponse.redirect(new URL("/admin/login", origin), 303);
  try { await reviewPasswordRequest(id, false, session); return NextResponse.redirect(new URL("/admin/usuarios?salvo=1", origin), 303); }
  catch { return NextResponse.redirect(new URL("/admin/usuarios?erro=senha", origin), 303); }
}
