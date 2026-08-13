import { createHash, randomUUID } from "node:crypto";
import { mkdir, rename, unlink, writeFile } from "node:fs/promises";
import { isIP } from "node:net";
import path from "node:path";
import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../../lib/session";
import { updateDocument } from "../../../../../lib/documents";
import { canPublish, hasRole } from "../../../../../lib/users";

export const runtime = "nodejs";
const storageDirectory = process.env.DOCUMENT_STORAGE_PATH ?? "/opt/kos-cms/documents";
const MAX_FILE_SIZE = 20 * 1024 * 1024;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const origin = process.env.CMS_URL ?? "https://cms.chapada.ia.br";
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login", origin), 303);
  if (!hasRole(session, "gestao")) return NextResponse.redirect(new URL("/admin?acesso=negado", origin), 303);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.redirect(new URL("/admin/documentos?error=validation", origin), 303);

  const form = await request.formData();
  const candidate = form.get("file");
  const file = candidate instanceof File && candidate.size > 0 ? candidate : null;
  const title = String(form.get("title") ?? "").trim();
  const typeId = String(form.get("typeId") ?? "").trim();
  const documentNumber = String(form.get("documentNumber") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const issuingBody = String(form.get("issuingBody") ?? "").trim();
  const documentDate = String(form.get("documentDate") ?? "").trim();
  const referenceYearText = String(form.get("referenceYear") ?? "").trim();
  const requestedStatus = String(form.get("status") ?? "draft");
  const requestedVisibility = String(form.get("visibility") ?? "internal");
  const status = canPublish(session) ? requestedStatus : "draft";
  const visibility = canPublish(session) ? requestedVisibility : (requestedVisibility === "restricted" ? "restricted" : "internal");
  const referenceYear = referenceYearText ? Number(referenceYearText) : null;
  const invalidFile = file && (file.type !== "application/pdf" || file.size > MAX_FILE_SIZE);
  const invalid = invalidFile || !title || title.length > 300 || !/^[0-9a-f-]{36}$/i.test(typeId) || (referenceYear !== null && (!Number.isInteger(referenceYear) || referenceYear < 1900 || referenceYear > 2200)) || !["draft", "published", "archived"].includes(status) || !["public", "restricted", "internal"].includes(visibility) || description.length > 3000 || issuingBody.length > 300 || documentNumber.length > 100 || (documentDate && !/^\d{4}-\d{2}-\d{2}$/.test(documentDate));
  if (invalid) return NextResponse.redirect(new URL(`/admin/documentos/${id}?error=validation`, origin), 303);

  let storedPath: string | null = null;
  try {
    let sha256: string | null = null;
    if (file) {
      const bytes = Buffer.from(await file.arrayBuffer());
      await mkdir(storageDirectory, { recursive: true });
      storedPath = path.join(storageDirectory, `${randomUUID()}.pdf`);
      await writeFile(storedPath, bytes, { flag: "wx", mode: 0o640 });
      sha256 = createHash("sha256").update(bytes).digest("hex");
    }
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const oldPath = await updateDocument(id, { typeId, title, documentNumber: documentNumber || null, referenceYear, description: description || null, issuingBody: issuingBody || null, documentDate: documentDate || null, status: status as "draft" | "published" | "archived", visibility: visibility as "public" | "restricted" | "internal", storagePath: storedPath, sha256, originalFilename: file?.name.slice(0, 500) ?? null, mimeType: file?.type ?? null, fileSizeBytes: file?.size ?? null, actor: session, requestAudit: { ip: forwarded && isIP(forwarded) ? forwarded : null, userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? null } });
    if (storedPath && oldPath && path.dirname(oldPath) === storageDirectory) {
      const archiveDirectory = path.join(storageDirectory, "archive");
      await mkdir(archiveDirectory, { recursive: true });
      await rename(oldPath, path.join(archiveDirectory, `${randomUUID()}.pdf`)).catch(() => undefined);
    }
    return NextResponse.redirect(new URL(`/admin/documentos/${id}?saved=1`, origin), 303);
  } catch {
    if (storedPath) await unlink(storedPath).catch(() => undefined);
    return NextResponse.redirect(new URL(`/admin/documentos/${id}?error=save`, origin), 303);
  }
}
