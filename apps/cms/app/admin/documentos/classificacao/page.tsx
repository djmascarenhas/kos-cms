import Link from "next/link";
import { getDocumentClassificationPlan } from "../../../../lib/documents";
import { requireAdmin } from "../../../../lib/session";
import { hasRole } from "../../../../lib/users";

export const dynamic = "force-dynamic";
export const metadata = { title: "Classificação documental | CMS", robots: { index: false, follow: false } };

const visibilityLabel = { public: "Público", internal: "Interno", restricted: "Restrito" };
const duplicateLabel = {
  not_applicable: "Sem duplicidade",
  official_exemplar: "Exemplar oficial recomendado",
  secondary_copy: "Cópia secundária — não excluir",
};

export default async function DocumentClassificationPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const session = await requireAdmin();
  const [{ batch, proposals }, state] = await Promise.all([getDocumentClassificationPlan(), searchParams]);
  const mayApprove = hasRole(session, "diretoria_cms");

  return <main className="min-h-screen bg-[#f2f7fb] text-[#40566a]">
    <header className="border-b border-[#cbdce8] bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <Link href="/admin/documentos" className="font-bold text-[#17375e]">← Gestão documental</Link>
        <Link href="/admin/documentos/drive" className="text-sm font-bold text-[#087f5b]">Portal versus Drive</Link>
      </div>
    </header>
    <section className="mx-auto max-w-7xl px-6 py-12">
      <p className="text-sm font-bold uppercase tracking-[.16em] text-[#28738c]">Etapa 3 · revisão humana</p>
      <h1 className="mt-3 text-4xl font-bold text-[#17375e]">Classificação e organização documental</h1>
      <p className="mt-4 max-w-4xl leading-7">Compare o local atual com o destino recomendado pela Política de Gestão Documental. A aprovação registra a classificação e a visibilidade no portal, mas <strong>não autoriza movimentar, renomear ou excluir arquivos no Google Drive</strong>.</p>

      {state.saved ? <p role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-900">Classificação aprovada e registrada no histórico. A movimentação no Drive permanece bloqueada.</p> : null}
      {state.error ? <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 font-bold text-red-900">Não foi possível registrar a aprovação. O plano continua sem autorização de movimentação.</p> : null}

      {!batch ? <p role="alert" className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5 font-bold text-amber-900">Nenhum plano de classificação foi importado.</p> : <>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Documentos analisados", batch.documentCount],
            ["Fora da classe recomendada", batch.misplacedCount],
            ["Acesso restrito", batch.restrictedCount],
            ["Arquivos em grupos duplicados", batch.duplicateFileCount],
          ].map(([label, value]) => <article key={label} className="rounded-2xl border border-[#d5e3ec] bg-white p-5 shadow-[0_8px_24px_rgba(31,88,114,.06)]"><p className="text-sm font-bold text-[#60758a]">{label}</p><p className="mt-2 text-3xl font-bold text-[#1f5872]">{value}</p></article>)}
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <article className="rounded-2xl border border-[#c9ddea] bg-[#e8f2f8] p-5 text-sm leading-6">
            <h2 className="text-lg font-bold text-[#234c68]">Decisão sobre as pastas 16, 17 e 18</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li><strong>16:</strong> normas seguem para 09; a ata localizada segue para 06.</li>
              <li><strong>17:</strong> recebidos seguem para 10; cadastro de membros aguarda a classe 13.</li>
              <li><strong>18:</strong> pautas e agendas seguem para 02.</li>
            </ul>
          </article>
          <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
            <h2 className="text-lg font-bold">Alteração formal da Política</h2>
            <p className="mt-3"><strong>{batch.requiresPolicyAmendmentCount} documentos</strong> foram propostos para as novas classes 13 — Governança e Cadastro Institucional e 14 — Planejamento e Gestão do SUS. Essas classes dependem de aprovação formal da alteração da Política antes de qualquer reorganização no Drive.</p>
          </article>
        </div>

        <div className="mt-6 rounded-2xl border border-[#d5e3ec] bg-white p-5">
          <p className="font-bold text-[#234c68]">Situação: {batch.status === "approved" ? "classificação aprovada" : "aguardando decisão da Diretoria"}</p>
          <p className="mt-2 text-sm">Política analisada: {batch.policyTitle} ({batch.policyEditionYear ?? "ano não informado"}). Movimentação no Drive: <strong>{batch.movementAuthorized ? "autorizada" : "não autorizada"}</strong>.</p>
          {batch.approvedAt ? <p className="mt-2 text-sm">Aprovada por {batch.approvedByName ?? "usuário autorizado"} em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Cuiaba" }).format(new Date(batch.approvedAt))}.</p> : null}
        </div>

        {batch.status === "pending_directorate" ? <form method="post" action="/api/admin/documentos/classificacao/aprovar" className="mt-6 rounded-2xl border border-[#d5e3ec] bg-white p-6">
          <label className="grid gap-2 font-semibold text-[#315f7d]"><span>Observação da decisão (opcional)</span><textarea name="decisionNotes" maxLength={1000} rows={3} className="input" placeholder="Registre ressalvas ou orientações da Diretoria." /></label>
          {mayApprove ? <button className="mt-4 rounded-xl bg-[#087f5b] px-6 py-3 font-bold text-white hover:bg-[#056a4b]">Aprovar classificação e registrar histórico</button> : <p className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm font-bold text-sky-900">Somente a Diretoria do CMS ou o usuário master pode aprovar. Você pode consultar todo o plano.</p>}
          <p className="mt-3 text-xs font-semibold text-[#60758a]">Esta ação não altera caminhos ou nomes no Google Drive e não exclui duplicidades.</p>
        </form> : null}

        <h2 className="mt-12 text-2xl font-bold text-[#1f5872]">Plano documento por documento</h2>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-[#d5e3ec] bg-white">
          <table className="w-full min-w-[1500px] text-left text-sm">
            <thead className="bg-[#e8f2f8] text-[#36566c]"><tr><th className="p-4">Arquivo atual</th><th className="p-4">Classificação</th><th className="p-4">Destino recomendado</th><th className="p-4">Nome proposto</th><th className="p-4">Acesso e guarda</th><th className="p-4">Revisão</th></tr></thead>
            <tbody>{proposals.map((proposal) => <tr key={proposal.id} className="border-t border-[#e2ebf1] align-top">
              <td className="p-4"><strong className="block max-w-sm text-[#234c68]">{proposal.originalFilename}</strong><span className="mt-2 block max-w-sm break-words text-xs">{proposal.currentPath}</span>{proposal.sourceUrl ? <a href={proposal.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 block font-bold text-[#315f7d] hover:underline">Abrir no Drive ↗</a> : null}</td>
              <td className="p-4"><strong className="text-[#234c68]">{proposal.classificationType}</strong><span className="mt-2 block max-w-xs text-xs leading-5">{proposal.classificationRationale}</span></td>
              <td className="p-4"><span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-900">Pasta {proposal.folderCode}</span><strong className="mt-2 block">{proposal.recommendedFolder}</strong><span className="mt-2 block max-w-sm break-words text-xs">{proposal.recommendedPath}</span></td>
              <td className="p-4"><span className="block max-w-sm break-words font-semibold">{proposal.proposedFilename}</span><span className="mt-2 block max-w-sm text-xs"><strong>Assunto:</strong> {proposal.subject}</span><span className="mt-1 block max-w-sm text-xs"><strong>Origem:</strong> {proposal.origin}</span></td>
              <td className="p-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${proposal.recommendedVisibility === "restricted" ? "bg-red-100 text-red-900" : proposal.recommendedVisibility === "internal" ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"}`}>{visibilityLabel[proposal.recommendedVisibility]}</span><span className="mt-2 block max-w-xs text-xs"><strong>Temporalidade:</strong> {proposal.retentionRule}</span><span className="mt-1 block max-w-xs text-xs"><strong>Destino final:</strong> {proposal.finalDestination}</span></td>
              <td className="p-4"><span className="block font-semibold">{duplicateLabel[proposal.duplicateDisposition]}</span>{proposal.requiresPolicyAmendment ? <span className="mt-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-950">Requer alterar a Política</span> : null}<span className="mt-2 block text-xs font-bold">Movimentação: não autorizada</span></td>
            </tr>)}</tbody>
          </table>
        </div>
      </>}
    </section>
  </main>;
}
