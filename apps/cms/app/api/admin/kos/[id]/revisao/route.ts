import { isIP } from "node:net";
import { NextResponse } from "next/server";
import { KosAnalysisError, reviewKosAnalysis, type KosReviewDecision } from "../../../../../../lib/kos-analysis";
import { requireAdmin } from "../../../../../../lib/session";

export async function POST(request: Request, context: RouteContext<"/api/admin/kos/[id]/revisao">) {
  const session = await requireAdmin("gestao");
  const { id } = await context.params;
  const origin = process.env.CMS_URL ?? "https://cms.chapada.ia.br";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.redirect(new URL("/admin/kos?error=validation", origin), 303);
  const form = await request.formData();
  const decision = String(form.get("decision") ?? "") as KosReviewDecision;
  const notes = String(form.get("notes") ?? "").trim().slice(0, 5000);
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  try {
    await reviewKosAnalysis(id, decision, notes, session, {
      ip: forwarded && isIP(forwarded) ? forwarded : null,
      userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
    });
    return NextResponse.redirect(new URL(`/admin/kos/${id}?revisada=1`, origin), 303);
  } catch (error) {
    const code = error instanceof KosAnalysisError ? error.code : "review_error";
    return NextResponse.redirect(new URL(`/admin/kos/${id}?error=${encodeURIComponent(code)}`, origin), 303);
  }
}
