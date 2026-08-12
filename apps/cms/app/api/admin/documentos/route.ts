import { createHash, randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getAdminSession } from "../../../admin/actions";
import { createDocument } from "../../../../lib/documents";

export const runtime = "nodejs";
const storageDirectory = process.env.DOCUMENT_STORAGE_PATH ?? "/opt/kos-cms/documents";
const MAX_FILE_SIZE = 20 * 1024 * 1024;

export async function POST(request: Request) {
  const origin = process.env.CMS_URL ?? "https://cms.chapada.ia.br";
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login", origin), 303);
  const form = await request.formData();
  const file = form.get("file");
  const title = String(form.get("title") ?? "").trim();
  const typeId = String(form.get("typeId") ?? "").trim();
  const documentNumber = String(form.get("documentNumber") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const issuingBody = String(form.get("issuingBody") ?? "").trim();
  const documentDate = String(form.get("documentDate") ?? "").trim();
  const referenceYearText = String(form.get("referenceYear") ?? "").trim();
  const status = String(form.get("status") ?? "draft");
  const visibility = String(form.get("visibility") ?? "public");
  const referenceYear = referenceYearText ? Number(referenceYearText) : null;
  if (!(file instanceof File) || file.type !== "application/pdf" || file.size < 1 || file.size > MAX_FILE_SIZE || !title || title.length > 300 || !/^[0-9a-f-]{36}$/i.test(typeId) || (referenceYear !== null && (!Number.isInteger(referenceYear) || referenceYear < 1900 || referenceYear > 2200)) || !["draft", "published"].includes(status) || !["public", "restricted", "internal"].includes(visibility) || description.length > 3000 || issuingBody.length > 300 || documentNumber.length > 100 || (documentDate && !/^\d{4}-\d{2}-\d{2}$/.test(documentDate))) return NextResponse.redirect(new URL("/admin/documentos?error=validation", origin), 303);
  const bytes = Buffer.from(await file.arrayBuffer());
  const storedPath = path.join(storageDirectory, `${randomUUID()}.pdf`);
  try {
    await mkdir(storageDirectory, { recursive: true });
    await writeFile(storedPath, bytes, { flag: "wx", mode: 0o640 });
    await createDocument({ typeId, title, documentNumber: documentNumber || null, referenceYear, description: description || null, issuingBody: issuingBody || null, documentDate: documentDate || null, status: status as "draft" | "published", visibility: visibility as "public" | "restricted" | "internal", storagePath: storedPath, sha256: createHash("sha256").update(bytes).digest("hex"), createdBy: session.email });
    return NextResponse.redirect(new URL("/admin/documentos?saved=1", origin), 303);
  } catch {
    await unlink(storedPath).catch(() => undefined);
    return NextResponse.redirect(new URL("/admin/documentos?error=save", origin), 303);
  }
}
