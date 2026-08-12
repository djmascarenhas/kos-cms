import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicFooter, PublicHeader } from "../../../components/institutional-shell";
import { DocumentReference } from "../../../components/document-reference";
import { getProposalBySlug } from "../../../lib/proposal";

export const dynamic = "force-dynamic";

const monitoringLabel = {
  awaiting_information: "Aguardando atualização oficial",
  under_analysis: "Em análise",
  in_progress: "Em andamento",
  completed: "Concluída",
  suspended: "Suspensa",
};

const traceLabel: Record<string, string> = { identified: "Identificada", partial: "Parcial", not_identified: "Não localizada" };

export default async function ProposalPage({ params }: { params: Promise<{ slug: string }> }) {
  const proposal = await getProposalBySlug((await params).slug);
  if (!proposal) notFound();

  return <main id="conteudo-principal" className="min-h-screen bg-[#f2f7fb] text-[#40566a]">
    <PublicHeader />
    <section className="border-b border-[#c9ddea] bg-gradient-to-br from-[#e9f3f9] via-[#f4f9fc] to-[#e5f1f7]"><div className="mx-auto max-w-7xl px-6 py-14 md:py-20"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#28738c]">Eixo {proposal.axisOrdinal} · Proposta {proposal.proposalOrdinal}</p><h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight text-[#17375e] md:text-5xl">{proposal.title}</h1><p className="mt-5 max-w-4xl text-lg leading-8 text-[#405f73]">{proposal.proposalText}</p></div></section>
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="grid gap-4 md:grid-cols-4"><Info label="Situação" value={monitoringLabel[proposal.monitoringStatus]} /><Info label="Esfera responsável" value={proposal.responsibleSphere ?? "Não informada"} /><Info label="Responsável indicado" value={proposal.responsibleName ?? "Aguardando indicação"} /><Info label="Prazo aprovado" value={proposal.deadlineText ?? "Não definido"} /></div>
      <section className="mt-8 rounded-2xl border border-[#d5e3ec] bg-white p-6 shadow-[0_8px_24px_rgba(31,88,114,.06)]"><div className="flex items-center justify-between gap-4"><h2 className="text-xl font-bold text-[#1f5872]">Andamento</h2><strong className="text-[#234c68]">{proposal.progressPercent}%</strong></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-[#e4edf3]"><div className="h-full rounded-full bg-[#4d8099]" style={{ width: `${proposal.progressPercent}%` }} /></div><p className="mt-4 text-sm leading-6 text-[#60758a]">{proposal.publicNotes ?? "Ainda não foi publicada atualização de execução para esta proposta."}</p>{proposal.expectedCompletion ? <p className="mt-3 text-sm"><strong className="text-[#234c68]">Previsão de conclusão:</strong> {new Date(`${proposal.expectedCompletion}T12:00:00`).toLocaleDateString("pt-BR")}</p> : null}</section>
      <div className="mt-8 grid gap-6 lg:grid-cols-2"><Analysis title="Análise no PMS 2026–2029" status={proposal.pmsStatus} rationale={proposal.pmsRationale} reference={proposal.pmsReference} documentId={proposal.pmsDocumentId} href="/pms-2026-2029" /><Analysis title="Análise na PAS 2026" status={proposal.pasStatus} rationale={proposal.pasRationale} reference={proposal.pasReference} documentId={proposal.pasDocumentId} href="/pas-2026" /></div>
      <section className="mt-8 rounded-2xl border border-[#d5e3ec] bg-white p-6"><h2 className="text-xl font-bold text-[#1f5872]">Registro da Conferência</h2><div className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><p><strong className="block text-[#234c68]">Eixo temático</strong>{proposal.axisTitle}</p><p><strong className="block text-[#234c68]">Aprovação</strong>{proposal.approvalNotes ?? "Sem observação"}</p><p><strong className="block text-[#234c68]">Página da fonte</strong>{proposal.sourcePage ? `Página ${proposal.sourcePage}` : "Não informada"}</p></div></section>
    </section>
    <PublicFooter />
  </main>;
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-[#d5e3ec] bg-white p-5 shadow-[0_8px_24px_rgba(31,88,114,.06)]"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#60758a]">{label}</p><p className="mt-3 font-bold leading-6 text-[#234c68]">{value}</p></div>; }

function Analysis({ title, status, rationale, reference, documentId, href }: { title: string; status: string | null; rationale: string | null; reference: string | null; documentId: string | null; href: string }) { return <article className="rounded-2xl border border-[#d5e3ec] bg-white p-6 shadow-[0_8px_24px_rgba(31,88,114,.06)]"><div className="flex flex-wrap items-start justify-between gap-3"><h2 className="text-xl font-bold text-[#1f5872]">{title}</h2><span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-800">{status ? traceLabel[status] : "Sem análise"}</span></div><p className="mt-4 leading-7">{rationale ?? "Análise ainda não registrada."}</p>{reference ? <p className="mt-4 rounded-xl border border-[#dbe7ef] bg-[#f4f8fb] px-4 py-3 text-sm"><strong className="text-[#234c68]">Referência:</strong> <DocumentReference reference={reference} documentId={documentId} /></p> : null}<Link href={href} className="mt-5 inline-flex font-bold text-[#28738c] hover:text-[#1f5872]">Ver análise completa -&gt;</Link></article>; }
