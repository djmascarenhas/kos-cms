import Link from "next/link";
import { requireAdmin } from "../../../lib/session";
import { listProposalMonitoring, proposalSlug } from "../../../lib/proposal";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gestão de propostas | CMS", robots: { index: false, follow: false } };

const labels = { awaiting_information: "Aguardando atualização", under_analysis: "Em análise", in_progress: "Em andamento", completed: "Concluída", suspended: "Suspensa" };

export default async function AdminProposalsPage() {
  await requireAdmin("gestao");
  const proposals = await listProposalMonitoring();
  return <main className="min-h-screen bg-[#f2f7fb] text-[#40566a]"><header className="border-b border-[#cbdce8] bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4"><Link href="/admin" className="font-bold text-[#17375e]">Administração do CMS</Link><Link href="/" className="text-sm font-semibold text-[#315f7d]">Portal público</Link></div></header><section className="mx-auto max-w-7xl px-6 py-12"><p className="text-sm font-bold uppercase tracking-[.16em] text-[#28738c]">Área protegida</p><h1 className="mt-3 text-4xl font-bold text-[#17375e]">Acompanhamento das propostas</h1><p className="mt-4 max-w-3xl leading-7">Selecione uma proposta para atualizar as informações que serão exibidas publicamente.</p><div className="mt-8 overflow-x-auto rounded-2xl border border-[#d5e3ec] bg-white shadow-[0_8px_24px_rgba(31,88,114,.06)]"><table className="min-w-[760px] w-full text-left text-sm"><thead className="bg-[#e8f2f8] text-[#36566c]"><tr><th className="p-4">Proposta</th><th className="p-4">Situação</th><th className="p-4">Responsável</th><th className="p-4">Andamento</th><th className="p-4">Ação</th></tr></thead><tbody>{proposals.map((proposal) => { const slug = proposalSlug(proposal.axisOrdinal, proposal.proposalOrdinal); return <tr key={slug} className="border-t border-[#e2ebf1]"><td className="p-4"><span className="block text-xs font-bold text-[#60758a]">Eixo {proposal.axisOrdinal} · Proposta {proposal.proposalOrdinal}</span><strong className="mt-1 block text-[#234c68]">{proposal.title}</strong></td><td className="p-4">{labels[proposal.monitoringStatus]}</td><td className="p-4">{proposal.responsibleName ?? "Não informado"}</td><td className="p-4 font-bold text-[#234c68]">{proposal.progressPercent}%</td><td className="p-4"><Link href={`/admin/propostas/${slug}`} className="rounded-lg bg-[#315f7d] px-4 py-2 font-bold text-white hover:bg-[#234c68]">Editar</Link></td></tr>; })}</tbody></table></div></section></main>;
}
