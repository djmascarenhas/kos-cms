import Link from "next/link";
import { getDriveInventoryComparison } from "../../../../lib/documents";
import { requireAdmin } from "../../../../lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Portal versus Drive | CMS", robots: { index: false, follow: false } };

const statusLabel = {
  linked: "Vinculado",
  drive_only: "Somente no Drive",
  portal_only: "Somente no portal",
};

const duplicateLabel = {
  pending_hash: "Aguardando hash",
  candidate_by_metadata: "Possível duplicidade",
  unique_hash: "Conteúdo único",
  confirmed_duplicate: "Duplicidade confirmada",
  not_duplicate: "Não duplicado",
};

function bytes(value: number | null) {
  if (value === null) return "Tamanho não informado";
  return new Intl.NumberFormat("pt-BR", { style: "unit", unit: "megabyte", maximumFractionDigits: 2 }).format(value / 1_048_576);
}

export default async function DriveInventoryPage() {
  await requireAdmin();
  const { scan, rows, portalNativeCount } = await getDriveInventoryComparison();
  const linked = rows.filter((row) => row.comparisonStatus === "linked").length;
  const driveOnly = rows.filter((row) => row.comparisonStatus === "drive_only").length;
  const portalOnly = rows.filter((row) => row.comparisonStatus === "portal_only").length;
  const duplicateCandidates = rows.filter((row) => row.duplicateReviewStatus === "candidate_by_metadata").length;

  return <main className="min-h-screen bg-[#f2f7fb] text-[#40566a]">
    <header className="border-b border-[#cbdce8] bg-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4"><Link href="/admin/documentos" className="font-bold text-[#17375e]">← Gestão documental</Link>{scan ? <a href={scan.rootFolderUrl} target="_blank" rel="noreferrer" className="text-sm font-bold text-[#315f7d] hover:underline">Abrir acervo no Drive ↗</a> : null}</div></header>
    <section className="mx-auto max-w-7xl px-6 py-12">
      <p className="text-sm font-bold uppercase tracking-[.16em] text-[#28738c]">Conciliação documental</p>
      <h1 className="mt-3 text-4xl font-bold text-[#17375e]">Portal versus Drive</h1>
      <p className="mt-4 max-w-3xl leading-7">Confira se cada arquivo acessível no Google Drive possui um registro correspondente no Portal CMS. A tela também sinaliza integridade pendente, possíveis duplicidades e registros órfãos.</p>

      {!scan ? <p role="alert" className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5 font-bold text-amber-900">Nenhum inventário do Google Drive foi importado.</p> : <>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Arquivos no Drive", scan.fileCount],
            ["Vinculados ao portal", linked],
            ["Somente no Drive", driveOnly],
            ["Somente no portal", portalOnly],
          ].map(([label, value]) => <article key={label} className="rounded-2xl border border-[#d5e3ec] bg-white p-5 shadow-[0_8px_24px_rgba(31,88,114,.06)]"><p className="text-sm font-bold text-[#60758a]">{label}</p><p className="mt-2 text-3xl font-bold text-[#1f5872]">{value}</p></article>)}
        </div>
        <div className="mt-5 rounded-2xl border border-[#c9ddea] bg-[#e8f2f8] p-5 text-sm leading-6"><strong className="text-[#234c68]">Inventário de {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Cuiaba" }).format(new Date(scan.scannedAt))}:</strong> {scan.folderCount} pastas, {scan.fileCount} arquivos e {bytes(scan.totalSizeBytes)}. Existem {portalNativeCount} registros próprios do portal sem origem no Drive e {duplicateCandidates} arquivos sinalizados como possíveis duplicidades por nome e tamanho.</div>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-[#d5e3ec] bg-white">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-[#e8f2f8] text-[#36566c]"><tr><th className="p-4">Conciliação</th><th className="p-4">Arquivo e caminho</th><th className="p-4">Proprietário no Drive</th><th className="p-4">Integridade</th><th className="p-4">Duplicidade</th><th className="p-4">Acesso</th></tr></thead>
            <tbody>{rows.map((row) => <tr key={`${row.comparisonStatus}-${row.driveFileId}`} className="border-t border-[#e2ebf1] align-top">
              <td className="p-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${row.comparisonStatus === "linked" ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}>{statusLabel[row.comparisonStatus]}</span></td>
              <td className="p-4"><strong className="block max-w-xl text-[#234c68]">{row.originalFilename}</strong><span className="mt-1 block max-w-xl break-words text-xs text-[#60798c]">{row.drivePath}</span><span className="mt-1 block text-xs">{bytes(row.fileSizeBytes)}</span></td>
              <td className="p-4">{row.driveOwnerName ?? "Não identificado"}<span className="block text-xs">{row.driveOwnerEmail ?? "—"}</span></td>
              <td className="p-4 font-semibold">{row.integrityHashStatus === "verified" ? "SHA-256 verificado" : row.integrityHashStatus === "unavailable" ? "Hash indisponível" : "SHA-256 pendente"}</td>
              <td className={`p-4 font-semibold ${row.duplicateReviewStatus === "candidate_by_metadata" ? "text-amber-800" : ""}`}>{duplicateLabel[row.duplicateReviewStatus]}</td>
              <td className="p-4"><a href={row.sourceUrl} target="_blank" rel="noreferrer" className="font-bold text-[#315f7d] hover:underline">Abrir no Drive ↗</a>{row.documentId ? <Link href={`/admin/documentos/${row.documentId}/historico`} className="mt-2 block font-bold text-[#087f5b] hover:underline">Ver histórico</Link> : null}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </>}
    </section>
  </main>;
}
