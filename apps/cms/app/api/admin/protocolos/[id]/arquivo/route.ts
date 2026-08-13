import { readFile } from "node:fs/promises";
import path from "node:path";
import { getProtocolFile } from "../../../../../../lib/protocols";
import { getAdminSession } from "../../../../../../lib/session";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return new Response("Não autorizado", { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Registro inválido", { status: 400 });
  const file = await getProtocolFile(id, session);
  if (!file) return new Response("Arquivo não encontrado", { status: 404 });
  const storageRoot = path.resolve(/* turbopackIgnore: true */ process.env.DOCUMENT_STORAGE_PATH ?? "/opt/kos-cms/documents");
  const resolved = path.resolve(file.storagePath);
  if (resolved !== storageRoot && !resolved.startsWith(`${storageRoot}${path.sep}`)) return new Response("Caminho inválido", { status: 403 });
  try {
    const bytes = await readFile(resolved);
    return new Response(new Uint8Array(bytes), { headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.originalFilename)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch { return new Response("Arquivo não encontrado", { status: 404 }); }
}
