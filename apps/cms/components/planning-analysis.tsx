import Image from "next/image";
import Link from "next/link";
import type { PlanningAnalysis, PlanningKind, TraceabilityStatus } from "../lib/planning";

const statusLabel: Record<TraceabilityStatus, string> = {
  identified: "Identificada",
  partial: "Parcial",
  not_identified: "Não localizada",
};

const statusStyle: Record<TraceabilityStatus, string> = {
  identified: "bg-emerald-100 text-emerald-900",
  partial: "bg-amber-100 text-amber-950",
  not_identified: "bg-slate-200 text-slate-800",
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

  return <main className="min-h-screen bg-[#f7faf8] text-slate-900">
    <header className="border-b border-emerald-950/10 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4"><Link href="/" className="flex items-center gap-3"><Image src="/cms-logo.jpeg" alt="Logotipo do Conselho Municipal de Saúde" width={48} height={48} className="rounded-xl" /><span><strong className="block text-sm text-emerald-950">Conselho Municipal de Saúde</strong><span className="text-xs text-slate-600">Chapada dos Guimarães – MT</span></span></Link><Link href="/" className="rounded-full border border-emerald-800 px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50">Portal CMS</Link></div></header>
    <section className="bg-emerald-950 text-white"><div className="mx-auto max-w-7xl px-6 py-14 md:py-20"><p className="text-sm font-bold uppercase tracking-[.18em] text-amber-300">{page.eyebrow}</p><h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight md:text-5xl">{page.title}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-emerald-100">{page.description}</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/conferencia" className="rounded-xl border border-emerald-500 px-5 py-3 font-bold hover:bg-emerald-900">Ver propostas da Conferência</Link><a href="https://kos.chapada.ia.br/consulta" className="rounded-xl bg-amber-400 px-5 py-3 font-bold text-emerald-950 hover:bg-amber-300">Consultar no KOS</a></div></div></section>
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="grid gap-4 sm:grid-cols-4"><Metric value={String(analyses.length)} label="propostas analisadas" /><Metric value={String(counts.identified)} label="identificada" /><Metric value={String(counts.partial)} label="parcial" /><Metric value={String(counts.not_identified)} label="não localizada" /></div>
      <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-sm leading-6 text-emerald-950"><strong>Critério documental:</strong> “Identificada” indica previsão específica; “Parcial” indica relação temática sem atender integralmente à proposta; “Não localizada” indica que não foi encontrada previsão específica no documento analisado.</div>
      {unavailable ? <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900">A análise está temporariamente indisponível. Tente novamente em alguns instantes.</div> : null}
      <div className="mt-10 space-y-12">{axes.map((axisOrdinal) => {
        const items = analyses.filter((analysis) => analysis.axisOrdinal === axisOrdinal);
        return <section key={axisOrdinal}><p className="text-sm font-bold uppercase tracking-[.14em] text-emerald-700">Eixo {axisOrdinal}</p><h2 className="mt-2 text-2xl font-bold text-emerald-950">{items[0]?.axisTitle}</h2><div className="mt-5 grid gap-5">{items.map((analysis) => <article key={`${analysis.axisOrdinal}-${analysis.proposalOrdinal}`} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-slate-500">Proposta {analysis.axisOrdinal}.{analysis.proposalOrdinal}</p><h3 className="mt-2 text-xl font-bold text-slate-900">{analysis.proposalTitle}</h3></div><span className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-bold ${statusStyle[analysis.status]}`}>{statusLabel[analysis.status]}</span></div><p className="mt-4 leading-7 text-slate-600">{analysis.rationale}</p>{analysis.sourceReference ? <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700"><strong>Referência:</strong> {analysis.sourceReference}</p> : null}</article>)}</div></section>;
      })}</div>
    </section>
    <footer className="bg-emerald-950 text-emerald-50"><div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-3"><div className="flex gap-4"><Image src="/cms-logo.jpeg" alt="Logotipo do Conselho Municipal de Saúde" width={64} height={64} className="rounded-xl bg-[#fffbed] p-1" /><p className="text-sm leading-6 text-emerald-200"><strong className="text-white">Conselho Municipal de Saúde</strong><br />Chapada dos Guimarães – MT</p></div><div className="grid content-start gap-2 text-sm text-emerald-200"><strong className="text-white">Planejamento</strong><Link href="/pms-2026-2029" className="hover:text-white">PMS 2026–2029</Link><Link href="/pas-2026" className="hover:text-white">PAS 2026</Link></div><div className="grid content-start gap-2 text-sm text-emerald-200"><strong className="text-white">Contato institucional</strong><a href="tel:+5565992326757" className="hover:text-white">(65) 99232-6757</a><a href="mailto:secsaude@chapadadosguimaraes.mt.gov.br" className="hover:text-white">secsaude@chapadadosguimaraes.mt.gov.br</a></div></div></footer>
  </main>;
}

function Metric({ value, label }: { value: string; label: string }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><strong className="text-3xl text-emerald-950">{value}</strong><p className="mt-1 text-sm text-slate-600">{label}</p></div>; }
