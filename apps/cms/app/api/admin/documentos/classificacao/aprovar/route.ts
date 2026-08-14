import { isIP } from "node:net";
import { NextResponse } from "next/server";
import { approveDocumentClassificationPlan } from "../../../../../../lib/documents";
import { getAdminSession } from "../../../../../../lib/session";
import { hasRole } from "../../../../../../lib/users";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const origin = process.env.CMS_URL ?? "https://cms.chapada.ia.br";
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login", origin), 303);
  if (!hasRole(session, "diretoria_cms")) return NextResponse.redirect(new URL("/admin?acesso=negado", origin), 303);

  const form = await request.formData();
  const decisionNotes = String(form.get("decisionNotes") ?? "").trim();
  if (decisionNotes.length > 1000) return NextResponse.redirect(new URL("/admin/documentos/classificacao?error=validation", origin), 303);

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  try {
    await approveDocumentClassificationPlan(session, decisionNotes, {
      ip: forwarded && isIP(forwarded) ? forwarded : null,
      userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
    });
    return NextResponse.redirect(new URL("/admin/documentos/classificacao?saved=1", origin), 303);
  } catch {
    return NextResponse.redirect(new URL("/admin/documentos/classificacao?error=save", origin), 303);
  }
}
