import Image from "next/image";
import Link from "next/link";
import type { PlanningAnalysis, PlanningKind, TraceabilityStatus } from "../lib/planning";

const statusLabel: Record<TraceabilityStatus, string> = {
  identified: "Identificada",
  partial: "Parcial",
  not_identified: "Não localizada",
};

const statusStyle: Record<TraceabilityStatus, string> = {
  identified: "border border-teal-200 bg-teal-50 text-teal-800",
  partial: "border border-sky-200 bg-sky-50 text-sky-800",
  not_identified: "border border-slate-200 bg-slate-100 text-slate-700",
};

const content = {
  pms: {
    eyebrow: "Planejamento plurianual",
    title: "Plano Municipal de Saúde 2026–2029",
    description: "Análise das propostas da 9ª Conferência em relação às diretrizes, objetivos e metas do planejamento municipal para quatro anos.",
    document: "PMS 2026–2029",
  },
  pas: {
    eyebrow: "Programação anual",
    title: "Programação Anual de Saúde 2026",
    description: "Análise das propostas da 9ª Conferência em relação às ações e metas programadas para o exercício de 2026.",
    document: "PAS 2026",
  },
} satisfies Record<PlanningKind, { eyebrow: string; title: string; description: string; document: string }>;

export function PlanningAnalysisPage({ kind, analyses, unavailable = false }: { kind: PlanningKind; analyses: PlanningAnalysis[]; unavailable?: boolean }) {
  const page = content[kind];
  const counts = analyses.reduce<Record<TraceabilityStatus, number>>((result, analysis) => {
    result[analysis.status] += 1;
    return result;
  }, { identified: 0, partial: 0, not_identified: 0 });
  const axes = [...new Set(analyses.map((analysis) => analysis.axisOrdinal))];

  return <main className="min-h-screen bg-[#f2f7fb] text-[#40566a]">
    <header className="border-b border-[#cbdce8] bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4"><Link href="/" className="flex items-center gap-3"><Image src="/cms-logo.jpeg" alt="Logotipo do Conselho Municipal de Saúde" width={48} height={48} className="rounded-xl" /><span><strong className="block text-sm text-[#17375e]">Conselho Municipal de Saúde</strong><span className="text-xs text-[#60758a]">Chapada dos Guimarães – MT</span></span></Link><Link href="/" className="rounded-full border border-[#315f7d] px-4 py-2 text-sm font-semibold text-[#234c68] hover:bg-[#eaf3f8]">Portal CMS</Link></div></header>
    <section className="border-b border-[#c9ddea] bg-gradient-to-br from-[#e9f3f9] via-[#f4f9fc] to-[#e5f1f7]"><div className="mx-auto max-w-7xl px-6 py-14 md:py-20"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#28738c]">{page.eyebrow}</p><h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight text-[#17375e] md:text-5xl">{page.title}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-[#405f73]">{page.description}</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/conferencia" className="rounded-xl border border-[#315f7d] bg-white/80 px-5 py-3 font-bold text-[#234c68] hover:bg-white">Ver propostas da Conferência</Link><a href="https://kos.chapada.ia.br/consulta" className="rounded-xl bg-[#315f7d] px-5 py-3 font-bold text-white hover:bg-[#234c68]">Consultar no KOS</a></div></div></section>
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="grid gap-4 sm:grid-cols-4"><Metric value={String(analyses.length)} label="propostas analisadas" /><Metric value={String(counts.identified)} label="identificada" /><Metric value={String(counts.partial)} label="parcial" /><Metric value={String(counts.not_identified)} label="não localizada" /></div>
      <div className="mt-8 rounded-2xl border border-[#c9ddea] bg-[#e8f2f8] p-5 text-sm leading-6 text-[#40566a]"><strong className="text-[#234c68]">Critério documental:</strong> “Identificada” indica previsão específica; “Parcial” indica relação temática sem atender integralmente à proposta; “Não localizada” indica que não foi encontrada previsão específica no documento analisado.</div>
      {unavailable ? <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900">A análise está temporariamente indisponível. Tente novamente em alguns instantes.</div> : null}
      <div className="mt-10 space-y-12">{axes.map((axisOrdinal) => {
        const items = analyses.filter((analysis) => analysis.axisOrdinal === axisOrdinal);
        return <section key={axisOrdinal}><p className="text-sm font-bold uppercase tracking-[.14em] text-[#28738c]">Eixo {axisOrdinal}</p><h2 className="mt-2 text-2xl font-bold text-[#1f5872]">{items[0]?.axisTitle}</h2><div className="mt-5 grid gap-5">{items.map((analysis) => <article key={`${analysis.axisOrdinal}-${analysis.proposalOrdinal}`} className="rounded-2xl border border-[#d5e3ec] bg-white p-6 shadow-[0_8px_24px_rgba(31,88,114,.06)]"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#60758a]">Proposta {analysis.axisOrdinal}.{analysis.proposalOrdinal}</p><h3 className="mt-2 text-xl font-bold text-[#17375e]">{analysis.proposalTitle}</h3></div><span className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-bold ${statusStyle[analysis.status]}`}>{statusLabel[analysis.status]}</span></div><p className="mt-4 leading-7 text-[#40566a]">{analysis.rationale}</p>{analysis.sourceReference ? <p className="mt-4 rounded-xl border border-[#dbe7ef] bg-[#f4f8fb] px-4 py-3 text-sm text-[#50697c]"><strong className="text-[#234c68]">Referência:</strong> {analysis.sourceReference}</p> : null}</article>)}</div></section>;
      })}</div>
    </section>
    <footer className="bg-[#17375e] text-[#eaf3f8]"><div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-3"><div className="flex gap-4"><Image src="/cms-logo.jpeg" alt="Logotipo do Conselho Municipal de Saúde" width={64} height={64} className="rounded-xl bg-[#fffbed] p-1" /><p className="text-sm leading-6 text-[#cbdce8]"><strong className="text-white">Conselho Municipal de Saúde</strong><br />Chapada dos Guimarães – MT</p></div><div className="grid content-start gap-2 text-sm text-[#cbdce8]"><strong className="text-white">Planejamento</strong><Link href="/pms-2026-2029" className="hover:text-white">PMS 2026–2029</Link><Link href="/pas-2026" className="hover:text-white">PAS 2026</Link></div><div className="grid content-start gap-2 text-sm text-[#cbdce8]"><strong className="text-white">Contato institucional</strong><a href="tel:+5565992326757" className="hover:text-white">(65) 99232-6757</a><a href="mailto:secsaude@chapadadosguimaraes.mt.gov.br" className="hover:text-white">secsaude@chapadadosguimaraes.mt.gov.br</a></div></div></footer>
  </main>;
}

function Metric({ value, label }: { value: string; label: string }) { return <div className="rounded-2xl border border-[#d5e3ec] bg-white p-5 shadow-[0_8px_24px_rgba(31,88,114,.06)]"><strong className="text-3xl text-[#17375e]">{value}</strong><p className="mt-1 text-sm text-[#60758a]">{label}</p></div>; }
