import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getDownloadableDocument } from "../../../../lib/documents";

export const runtime = "nodejs";
const storageDirectory = path.resolve(/* turbopackIgnore: true */ process.env.DOCUMENT_STORAGE_PATH ?? "/opt/kos-cms/documents");

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Documento não encontrado", { status: 404 });
  const document = await getDownloadableDocument(id);
  if (document?.sourceType === "google_drive" && document.sourceUrl) return NextResponse.redirect(document.sourceUrl, 302);
  if (!document?.storagePath) return new NextResponse("Arquivo não disponível", { status: 404 });
  const resolvedPath = path.resolve(document.storagePath);
  if (!resolvedPath.startsWith(`${storageDirectory}${path.sep}`)) return new NextResponse("Arquivo não disponível", { status: 404 });
  try {
    const file = await readFile(resolvedPath);
    const filename = `${document.title.replace(/[^a-zA-Z0-9À-ÿ _-]/g, "").trim() || "documento"}.pdf`;
    return new NextResponse(file, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(filename)}`, "Cache-Control": "public, max-age=3600" } });
  } catch {
    return new NextResponse("Arquivo não disponível", { status: 404 });
  }
}
