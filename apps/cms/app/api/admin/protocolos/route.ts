import { createHash, randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { isIP } from "node:net";
import path from "node:path";
import { NextResponse } from "next/server";
import { createReceivedProtocol, type ProtocolOriginChannel, type ProtocolPriority, type ProtocolVisibility } from "../../../../lib/protocols";
import { getAdminSession } from "../../../../lib/session";
import { hasRole } from "../../../../lib/users";

export const runtime = "nodejs";
const storageRoot = process.env.DOCUMENT_STORAGE_PATH ?? "/opt/kos-cms/documents";
const storageDirectory = path.join(storageRoot, "received");
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const mimeExtensions: Record<string, string> = { "application/pdf": ".pdf", "image/jpeg": ".jpg", "image/png": ".png" };

export async function POST(request: Request) {
  const origin = process.env.CMS_URL ?? "https://cms.chapada.ia.br";
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login", origin), 303);
  const form = await request.formData();
  const file = form.get("file");
  const receivedAt = String(form.get("receivedAt") ?? "").trim();
  const senderName = String(form.get("senderName") ?? "").trim();
  const senderOrganization = String(form.get("senderOrganization") ?? "").trim();
  const senderEmail = String(form.get("senderEmail") ?? "").trim().toLowerCase();
  const senderPhone = String(form.get("senderPhone") ?? "").trim();
  const originChannel = String(form.get("originChannel") ?? "");
  const subject = String(form.get("subject") ?? "").trim();
  const summary = String(form.get("summary") ?? "").trim();
  const priority = String(form.get("priority") ?? "normal");
  const responseDueDate = String(form.get("responseDueDate") ?? "").trim();
  const requestedVisibility = String(form.get("visibility") ?? "internal");
  const visibility = requestedVisibility === "public" && !hasRole(session, "diretoria_cms") ? "internal" : requestedVisibility;
  const validDate = /^\d{4}-\d{2}-\d{2}$/;
  const validEmail = !senderEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail);
  const invalid = !(file instanceof File) || file.size < 1 || file.size > MAX_FILE_SIZE || !mimeExtensions[file.type]
    || !validDate.test(receivedAt) || (responseDueDate && (!validDate.test(responseDueDate) || responseDueDate < receivedAt))
    || senderName.length < 2 || senderName.length > 200 || senderOrganization.length > 250
    || !validEmail || senderEmail.length > 254 || senderPhone.length > 40 || subject.length < 3
    || subject.length > 500 || summary.length > 4000
    || !["presencial", "email", "correios", "sistema", "outro"].includes(originChannel)
    || !["baixa", "normal", "alta", "urgente"].includes(priority)
    || !["public", "internal", "restricted"].includes(visibility);
  if (invalid) return NextResponse.redirect(new URL("/admin/protocolos/novo?error=validation", origin), 303);

  const bytes = Buffer.from(await file.arrayBuffer());
  const storedPath = path.join(storageDirectory, `${randomUUID()}${mimeExtensions[file.type]}`);
  try {
    await mkdir(storageDirectory, { recursive: true });
    await writeFile(storedPath, bytes, { flag: "wx", mode: 0o640 });
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const created = await createReceivedProtocol({
      receivedAt, senderName, senderOrganization: senderOrganization || null,
      senderEmail: senderEmail || null, senderPhone: senderPhone || null,
      originChannel: originChannel as ProtocolOriginChannel, subject, summary: summary || null,
      priority: priority as ProtocolPriority, responseDueDate: responseDueDate || null,
      visibility: visibility as ProtocolVisibility, storagePath: storedPath,
      sha256: createHash("sha256").update(bytes).digest("hex"), originalFilename: file.name.slice(0, 500),
      mimeType: file.type, fileSizeBytes: file.size, actor: session,
      requestAudit: { ip: forwarded && isIP(forwarded) ? forwarded : null, userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? null },
    });
    return NextResponse.redirect(new URL(`/admin/protocolos/${created.id}?created=1`, origin), 303);
  } catch {
    await unlink(storedPath).catch(() => undefined);
    return NextResponse.redirect(new URL("/admin/protocolos/novo?error=save", origin), 303);
  }
}
