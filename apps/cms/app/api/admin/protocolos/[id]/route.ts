import { isIP } from "node:net";
import { NextResponse } from "next/server";
import { protocolStatuses, updateReceivedProtocol, type ProtocolLinkRelation, type ProtocolPriority, type ProtocolStatus, type ProtocolVisibility } from "../../../../../lib/protocols";
import { getAdminSession } from "../../../../../lib/session";
import { hasRole } from "../../../../../lib/users";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const origin = process.env.CMS_URL ?? "https://cms.chapada.ia.br";
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login", origin), 303);
  if (!hasRole(session, "gestao")) return NextResponse.redirect(new URL("/admin?acesso=negado", origin), 303);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.redirect(new URL("/admin/protocolos?error=validation", origin), 303);
  const form = await request.formData();
  const status = String(form.get("status") ?? "");
  const priority = String(form.get("priority") ?? "");
  const responseDueDate = String(form.get("responseDueDate") ?? "").trim();
  const requestedVisibility = String(form.get("visibility") ?? "");
  const visibility = requestedVisibility === "public" && !hasRole(session, "diretoria_cms") ? "internal" : requestedVisibility;
  const assignedArea = String(form.get("assignedArea") ?? "").trim();
  const responsibleUserId = String(form.get("responsibleUserId") ?? "").trim();
  const notes = String(form.get("notes") ?? "").trim();
  const linkedDocumentId = String(form.get("linkedDocumentId") ?? "").trim();
  const linkRelation = String(form.get("linkRelation") ?? "").trim();
  const linkNotes = String(form.get("linkNotes") ?? "").trim();
  const uuid = /^[0-9a-f-]{36}$/i;
  const invalid = !protocolStatuses.includes(status as ProtocolStatus)
    || !["baixa", "normal", "alta", "urgente"].includes(priority)
    || !["public", "internal", "restricted"].includes(visibility)
    || (responseDueDate && !/^\d{4}-\d{2}-\d{2}$/.test(responseDueDate))
    || assignedArea.length > 250 || (responsibleUserId && !uuid.test(responsibleUserId))
    || notes.length < 3 || notes.length > 3000 || (linkedDocumentId && !uuid.test(linkedDocumentId))
    || Boolean(linkedDocumentId) !== Boolean(linkRelation)
    || (linkRelation && !["resposta", "parecer", "oficio", "deliberacao", "outro"].includes(linkRelation))
    || linkNotes.length > 1000;
  if (invalid) return NextResponse.redirect(new URL(`/admin/protocolos/${id}?error=validation`, origin), 303);
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  try {
    await updateReceivedProtocol(id, {
      status: status as ProtocolStatus, priority: priority as ProtocolPriority,
      responseDueDate: responseDueDate || null, visibility: visibility as ProtocolVisibility,
      assignedArea: assignedArea || null, responsibleUserId: responsibleUserId || null,
      notes, linkedDocumentId: linkedDocumentId || null,
      linkRelation: (linkRelation || null) as ProtocolLinkRelation | null, linkNotes: linkNotes || null,
      actor: session, requestAudit: { ip: forwarded && isIP(forwarded) ? forwarded : null,
        userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? null },
    });
    return NextResponse.redirect(new URL(`/admin/protocolos/${id}?saved=1`, origin), 303);
  } catch {
    return NextResponse.redirect(new URL(`/admin/protocolos/${id}?error=save`, origin), 303);
  }
}
