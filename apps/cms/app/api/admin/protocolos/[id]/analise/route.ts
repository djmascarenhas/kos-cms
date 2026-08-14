import { isIP } from "node:net";
import { NextResponse } from "next/server";
import { createKosAnalysis, KosAnalysisError } from "../../../../../../lib/kos-analysis";
import { requireAdmin } from "../../../../../../lib/session";

export async function POST(request: Request, context: RouteContext<"/api/admin/protocolos/[id]/analise">) {
  const session = await requireAdmin();
  const { id } = await context.params;
  const origin = new URL(request.url).origin;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.redirect(new URL("/admin/protocolos?error=validation", origin), 303);
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  try {
    const analysis = await createKosAnalysis(id, session, {
      ip: forwarded && isIP(forwarded) ? forwarded : null,
      userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
    });
    return NextResponse.redirect(new URL(`/admin/kos/${analysis.id}?${analysis.reused ? "existente=1" : "criada=1"}`, origin), 303);
  } catch (error) {
    const code = error instanceof KosAnalysisError ? error.code : "processing_error";
    return NextResponse.redirect(new URL(`/admin/protocolos/${id}?kosError=${encodeURIComponent(code)}`, origin), 303);
  }
}
