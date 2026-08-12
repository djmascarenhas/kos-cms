import Link from "next/link";
import { DocumentReference } from "../../components/document-reference";
import { searchInstitutionalBase, type ConsultationResult } from "../../lib/consultation";

export const dynamic = "force-dynamic";

const label: Record<string, string> = { identified: "Identificada", partial: "Parcial", not_identified: "Não localizada" };

function Evidence({ title, status, reference, documentId }: { title: string; status: string | null; reference: string | null; documentId: string | null }) {
  return <div className="rounded-xl border border-[#dbe7ef] bg-[#f4f8fb] p-3"><strong className="block text-[#234c68]">{title}: {status ? label[status] : "Sem registro"}</strong>{reference ? <p className="mt-2 text-[#60758a]"><span className="font-semibold">Referência:</span> <DocumentReference reference={reference} documentId={documentId} /></p> : null}</div>;
}

export default async function ConsultationPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  let results: ConsultationResult[] = [];
  let unavailable = false;
  if (q.trim()) {
    try { results = await searchInstitutionalBase(q); } catch { unavailable = true; }
  }
  return <main className="min-h-screen bg-[#f2f7fb] text-[#40566a]">
    <header className="border-b border-[#cbdce8] bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"><Link href="/" className="font-bold tracking-[.14em] text-[#17375e]">KOS</Link><a href="https://cms.chapada.ia.br" className="text-sm font-semibold text-[#315f7d] hover:text-[#17375e]">Portal CMS</a></div></header>
    <section className="mx-auto max-w-4xl px-6 py-14"><p className="text-sm font-bold uppercase tracking-[.25em] text-[#28738c]">Consulta institucional</p><h1 className="mt-4 text-4xl font-bold text-[#17375e]">Pergunte ao KOS</h1><p className="mt-4 max-w-2xl leading-7 text-[#405f73]">Consulte as propostas da 9ª Conferência e suas referências no PMS 2026–2029 e na PAS 2026.</p>
      <form className="mt-8 flex flex-col gap-3 sm:flex-row"><label className="sr-only" htmlFor="q">Termo de consulta</label><input id="q" name="q" defaultValue={q} placeholder="Ex.: laboratório, UBS, medicamentos ou Melhor em Casa" className="min-w-0 flex-1 rounded-xl border border-[#b9cfdd] bg-white px-5 py-3 text-[#29465b] outline-none placeholder:text-[#7b8e9d] focus:border-[#315f7d] focus:ring-2 focus:ring-[#dcecf5]" /><button className="rounded-xl bg-[#315f7d] px-6 py-3 font-bold text-white hover:bg-[#234c68]">Consultar</button></form>
      {q ? <section className="mt-10"><p className="text-sm font-bold text-[#315f7d]">Resultados para “{q}”</p>{unavailable ? <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">A base está temporariamente indisponível. Tente novamente em instantes.</p> : null}{!unavailable && results.length === 0 ? <p className="mt-4 rounded-xl border border-[#d5e3ec] bg-white p-5 text-[#50697c]">Nenhuma proposta correspondente foi encontrada. Tente termos mais curtos ou consulte a página da Conferência.</p> : null}<div className="mt-4 grid gap-4">{results.map((item) => <article key={`${item.axisOrdinal}-${item.proposalOrdinal}`} className="rounded-2xl border border-[#d5e3ec] bg-white p-6 shadow-[0_8px_24px_rgba(31,88,114,.06)]"><a href={`https://cms.chapada.ia.br/propostas/eixo-${item.axisOrdinal}-proposta-${item.proposalOrdinal}`} className="text-xl font-bold text-[#1f5872] hover:text-[#28738c] hover:underline">{item.title}</a><p className="mt-3 leading-7 text-[#40566a]">{item.proposalText}</p><div className="mt-5 grid gap-3 text-sm sm:grid-cols-2"><Evidence title="PMS" status={item.pmsStatus} reference={item.pmsReference} documentId={item.pmsDocumentId} /><Evidence title="PAS" status={item.pasStatus} reference={item.pasReference} documentId={item.pasDocumentId} /></div></article>)}</div></section> : null}
      <p className="mt-10 text-sm leading-6 text-[#60758a]">Os resultados apoiam a consulta documental; não substituem deliberação do Conselho ou parecer técnico.</p>
    </section>
  </main>;
}
