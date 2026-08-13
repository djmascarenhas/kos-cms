import Link from "next/link";
import { notFound } from "next/navigation";
import { getKosAnalysis } from "../../../../lib/kos-analysis";
import { requireAdmin } from "../../../../lib/session";
import { hasRole } from "../../../../lib/users";

export const dynamic = "force-dynamic";
export const metadata = { title: "Resultado da análise KOS | CMS", robots: { index: false, follow: false } };

const statusLabel = {
  processing: "Processando", pending_review: "Aguardando validação humana", approved: "Aprovada",
  corrected: "Corrigida com ressalvas", rejected: "Rejeitada", failed: "Falha no processamento", quota_blocked: "Bloqueada por limite",
};

function ListSection({ title, items, empty }: { title: string; items: React.ReactNode[]; empty: string }) {
  return <section className="rounded-2xl border border-[#d5e3ec] bg-white p-6"><h2 className="text-xl font-bold text-[#17375e]">{title}</h2><div className="mt-4 grid gap-3">{items.length ? items : <p>{empty}</p>}</div></section>;
}

export default async function KosAnalysisPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ criada?: string; existente?: string; revisada?: string; error?: string }> }) {
  const [session, { id }, state] = await Promise.all([requireAdmin(), params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const analysis = await getKosAnalysis(id, session);
  if (!analysis) notFound();
  const result = analysis.result;
  const mayReview = hasRole(session, "gestao") && analysis.status === "pending_review";
  const source = (page: number) => `/api/admin/protocolos/${analysis.protocolId}/arquivo#page=${Math.max(1, page)}`;
  return <main className="min-h-screen bg-[#f2f7fb] text-[#40566a]">
    <header className="border-b border-[#cbdce8] bg-white"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4"><Link href="/admin/kos" className="font-bold text-[#17375e]">← Análises KOS</Link><Link href={`/admin/protocolos/${analysis.protocolId}`} className="font-bold text-[#087f5b]">Ver protocolo</Link></div></header>
    <section className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-sm font-bold uppercase tracking-[.16em] text-[#28738c]">{analysis.protocolNumber}</p><h1 className="mt-3 text-4xl font-bold text-[#17375e]">Análise técnica documental</h1>
      <div className="mt-5 flex flex-wrap gap-3"><span className="rounded-full bg-sky-100 px-4 py-2 text-sm font-bold text-sky-900">{statusLabel[analysis.status]}</span><span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-950">Não é decisão do CMS</span><span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-900">Entrada anonimizada</span></div>
      {state.criada ? <p role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-900">Análise concluída e encaminhada para validação humana.</p> : null}{state.existente ? <p className="mt-6 rounded-xl border border-sky-200 bg-sky-50 p-4 font-bold text-sky-900">Já existia uma análise deste documento aguardando validação.</p> : null}{state.revisada ? <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-900">Decisão humana registrada no histórico.</p> : null}{state.error ? <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 font-bold text-red-900">Não foi possível registrar a revisão. Verifique a justificativa e a situação atual.</p> : null}

      <aside className="mt-8 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950"><strong>Controle institucional:</strong> esta análise identifica informações e sugere encaminhamentos. Ela não substitui parecer jurídico, decisão da Diretoria, deliberação do Plenário ou conferência do documento original.</aside>

      {analysis.status === "processing" ? <p className="mt-8 rounded-2xl border border-sky-200 bg-white p-8 text-center font-bold">A análise está sendo processada.</p> : null}
      {analysis.status === "failed" || analysis.status === "quota_blocked" ? <p className="mt-8 rounded-2xl border border-red-200 bg-white p-8 text-center font-bold text-red-900">A análise não foi produzida. Código: {analysis.errorCode ?? "não informado"}.</p> : null}
      {result ? <div className="mt-8 grid gap-6">
        <section className="rounded-2xl border border-[#bcd5e4] bg-white p-7"><p className="text-sm font-bold uppercase tracking-[.14em] text-[#28738c]">Síntese executiva</p><h2 className="mt-3 text-2xl font-bold text-[#17375e]">{result.documentType}</h2><p className="mt-4 whitespace-pre-line leading-7">{result.executiveSummary}</p><p className="mt-4 rounded-xl bg-[#eef6fa] p-4"><strong>Assunto e origem:</strong> {result.subjectAndOrigin}</p></section>
        <div className="grid gap-6 lg:grid-cols-2">
          <ListSection title="Prazos identificados" empty="Nenhum prazo explícito localizado." items={result.deadlines.map((item, index) => <article key={index} className="rounded-xl bg-[#f2f7fb] p-4"><strong className="text-[#234c68]">{item.description}</strong><p className="mt-2 text-sm">Data: {item.date || "não determinada"} · confiança: {item.confidence}</p><a href={source(item.page)} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-bold text-[#087f5b]">Conferir página {item.page} →</a></article>)} />
          <ListSection title="Obrigações e responsáveis" empty="Nenhuma obrigação explícita localizada." items={result.obligations.map((item, index) => <article key={index} className="rounded-xl bg-[#f2f7fb] p-4"><strong className="text-[#234c68]">{item.responsible || "Responsável não determinado"}</strong><p className="mt-2 text-sm">{item.obligation}</p><a href={source(item.page)} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-bold text-[#087f5b]">Conferir página {item.page} →</a></article>)} />
          <ListSection title="Normas mencionadas no documento" empty="Nenhuma norma foi mencionada expressamente." items={result.norms.map((item, index) => <article key={index} className="rounded-xl bg-[#f2f7fb] p-4"><strong className="text-[#234c68]">{item.title}</strong><p className="mt-2 text-sm">{item.reference} · confiança: {item.confidence}</p><a href={source(item.page)} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-bold text-[#087f5b]">Abrir documento na página {item.page} →</a></article>)} />
          <ListSection title="Riscos e atenção" empty="Nenhum risco específico foi sinalizado." items={result.riskFlags.map((item, index) => <article key={index} className="rounded-xl border border-amber-200 bg-amber-50 p-4"><strong className="text-amber-950">{item.severity}</strong><p className="mt-2 text-sm">{item.description}</p><a href={source(item.page)} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-bold text-[#087f5b]">Conferir página {item.page} →</a></article>)} />
        </div>
        <section className="grid gap-5 rounded-2xl border border-[#d5e3ec] bg-white p-6 md:grid-cols-2"><div><h2 className="text-xl font-bold text-[#17375e]">Encaminhamento sugerido</h2><p className="mt-3 leading-7">{result.routingSuggestion}</p></div><div><h2 className="text-xl font-bold text-[#17375e]">Classificação sugerida</h2><dl className="mt-3 grid gap-2 text-sm"><div><dt className="font-bold">Tipo</dt><dd>{result.classificationSuggestion.documentType}</dd></div><div><dt className="font-bold">Pasta</dt><dd>{result.classificationSuggestion.folder}</dd></div><div><dt className="font-bold">Nome de arquivo</dt><dd className="break-all">{result.classificationSuggestion.filename}</dd></div><div><dt className="font-bold">Justificativa</dt><dd>{result.classificationSuggestion.rationale}</dd></div></dl></div></section>
        <ListSection title="Referências ao documento analisado" empty="Nenhuma referência foi retornada; a análise não deve ser aprovada sem conferência." items={result.references.map((item, index) => <article key={index} className="rounded-xl border border-[#d5e3ec] bg-[#f8fbfd] p-4"><p className="font-bold text-[#234c68]">{item.supports}</p><blockquote className="mt-2 border-l-4 border-[#76a9bd] pl-4 text-sm italic">“{item.excerpt}”</blockquote><a href={source(item.page)} target="_blank" rel="noreferrer" className="mt-3 inline-flex font-bold text-[#087f5b]">Abrir página {item.page} no documento →</a></article>)} />
        <ListSection title="Limitações declaradas" empty="Nenhuma limitação declarada." items={result.limitations.map((item, index) => <p key={index} className="rounded-xl bg-[#f2f7fb] p-4">{item}</p>)} />
      </div> : null}

      {mayReview ? <form method="post" action={`/api/admin/kos/${analysis.id}/revisao`} className="mt-10 grid gap-5 rounded-2xl border-2 border-[#76a9bd] bg-white p-6"><div><p className="text-sm font-bold uppercase tracking-[.14em] text-[#28738c]">Ação humana obrigatória</p><h2 className="mt-2 text-2xl font-bold text-[#17375e]">Validar esta análise</h2></div><label className="grid gap-2 font-bold text-[#315f7d]"><span>Decisão</span><select name="decision" className="input" required><option value="">Selecione</option><option value="approved">Aprovar a análise</option><option value="corrected">Registrar correções ou ressalvas</option><option value="rejected">Rejeitar a análise</option></select></label><label className="grid gap-2 font-bold text-[#315f7d]"><span>Registro da conferência, correções ou justificativa</span><textarea name="notes" rows={5} maxLength={5000} className="input" placeholder="Informe o que foi conferido no documento original. Para corrigir ou rejeitar, descreva a razão." /></label><button className="w-fit rounded-xl bg-[#315f7d] px-6 py-3 font-bold text-white">Registrar decisão humana</button></form> : null}
      {analysis.reviewDecision ? <section className="mt-10 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-950"><h2 className="text-xl font-bold">Validação humana registrada</h2><p className="mt-3"><strong>Decisão:</strong> {analysis.reviewDecision === "approved" ? "Aprovada" : analysis.reviewDecision === "corrected" ? "Corrigida com ressalvas" : "Rejeitada"}</p><p className="mt-2"><strong>Responsável:</strong> {analysis.reviewedByName}</p><p className="mt-2 whitespace-pre-line"><strong>Registro:</strong> {analysis.reviewNotes || "Sem observação adicional."}</p></section> : null}
      <footer className="mt-10 text-sm text-[#60758a]">Modelo: {analysis.model} · Prompt: {analysis.promptVersion} · Tokens: {(analysis.actualTotalTokens ?? analysis.estimatedInputTokens + analysis.reservedOutputTokens).toLocaleString("pt-BR")}.</footer>
    </section>
  </main>;
}
