import Link from "next/link";
import { getKosDashboard } from "../../../lib/kos-analysis";
import { requireAdmin } from "../../../lib/session";
import { roleLabel } from "../../../lib/users";

export const dynamic = "force-dynamic";
export const metadata = { title: "Análises KOS | CMS", robots: { index: false, follow: false } };

const statusLabel = {
  processing: "Processando", pending_review: "Aguardando validação", approved: "Aprovada",
  corrected: "Corrigida", rejected: "Rejeitada", failed: "Falhou", quota_blocked: "Bloqueada por limite",
};

function percent(used: number, limit: number) {
  return limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
}

export default async function KosDashboardPage({ searchParams }: { searchParams: Promise<{ configurada?: string; error?: string }> }) {
  const [session, state] = await Promise.all([requireAdmin(), searchParams]);
  const dashboard = await getKosDashboard(session);
  const quota = dashboard.quota;
  const settings = dashboard.settings;
  return <main className="min-h-screen bg-[#f2f7fb] text-[#40566a]">
    <header className="border-b border-[#cbdce8] bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4"><Link href="/admin" className="font-bold text-[#17375e]">← Painel administrativo</Link><span className="text-sm font-bold text-[#087f5b]">KOS · apoio técnico com validação humana</span></div></header>
    <section className="mx-auto max-w-7xl px-6 py-12">
      <p className="text-sm font-bold uppercase tracking-[.16em] text-[#28738c]">Etapa 5</p>
      <h1 className="mt-3 text-4xl font-bold text-[#17375e]">Análises documentais do KOS</h1>
      <p className="mt-4 max-w-4xl leading-7">Os documentos são lidos e anonimizados no servidor. O resultado é apenas apoio técnico: precisa ser aprovado, corrigido ou rejeitado por uma pessoa autorizada e nunca publica ou movimenta arquivos automaticamente.</p>
      {state.configurada ? <p role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-900">Limites e orçamento atualizados com registro na auditoria.</p> : null}
      {state.error ? <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 font-bold text-red-900">Não foi possível salvar a configuração. Verifique os limites informados.</p> : null}

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-[#d5e3ec] bg-white p-6"><p className="text-sm font-bold text-[#60758a]">Seu nível</p><strong className="mt-2 block text-xl text-[#17375e]">{roleLabel(session.role)}</strong><p className="mt-2 text-sm">{quota?.enabled ? "Análises habilitadas" : "Análises desabilitadas"}</p></article>
        <article className="rounded-2xl border border-[#d5e3ec] bg-white p-6"><p className="text-sm font-bold text-[#60758a]">Uso diário</p><strong className="mt-2 block text-xl text-[#17375e]">{dashboard.dailyUsed} de {quota?.dailyRequestLimit ?? 0}</strong><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><span className="block h-full bg-[#28738c]" style={{ width: `${percent(dashboard.dailyUsed, quota?.dailyRequestLimit ?? 0)}%` }} /></div></article>
        <article className="rounded-2xl border border-[#d5e3ec] bg-white p-6"><p className="text-sm font-bold text-[#60758a]">Tokens do mês</p><strong className="mt-2 block text-xl text-[#17375e]">{dashboard.monthlyTokensUsed.toLocaleString("pt-BR")}</strong><p className="mt-2 text-sm">Limite: {(quota?.monthlyTokenLimit ?? 0).toLocaleString("pt-BR")}</p></article>
        <article className="rounded-2xl border border-[#d5e3ec] bg-white p-6"><p className="text-sm font-bold text-[#60758a]">Orçamento global</p><strong className="mt-2 block text-xl text-[#17375e]">US$ {(dashboard.globalCostMicrousd / 1_000_000).toFixed(4)}</strong><p className="mt-2 text-sm">Teto: US$ {((settings?.monthlyCostLimitMicrousd ?? 0) / 1_000_000).toFixed(2)}</p></article>
      </div>

      <section className="mt-10"><h2 className="text-2xl font-bold text-[#17375e]">Histórico de análises</h2><div className="mt-5 overflow-x-auto rounded-2xl border border-[#d5e3ec] bg-white"><table className="w-full min-w-[880px] text-left text-sm"><thead className="bg-[#e8f2f8]"><tr><th className="p-4">Protocolo</th><th className="p-4">Solicitante</th><th className="p-4">Situação</th><th className="p-4">Consumo</th><th className="p-4">Data</th><th className="p-4">Ação</th></tr></thead><tbody>{dashboard.analyses.length ? dashboard.analyses.map((analysis) => <tr key={analysis.id} className="border-t border-[#e2ebf1]"><td className="p-4"><strong className="block text-[#234c68]">{analysis.protocolNumber}</strong><span className="block max-w-md text-xs">{analysis.documentTitle}</span></td><td className="p-4">{analysis.requestedByName}<span className="block text-xs">{roleLabel(analysis.requestedByRole)}</span></td><td className="p-4 font-bold">{statusLabel[analysis.status]}</td><td className="p-4">{(analysis.actualTotalTokens ?? analysis.estimatedInputTokens + analysis.reservedOutputTokens).toLocaleString("pt-BR")} tokens</td><td className="p-4">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Cuiaba" }).format(new Date(analysis.createdAt))}</td><td className="p-4"><Link href={`/admin/kos/${analysis.id}`} className="font-bold text-[#087f5b]">Consultar →</Link></td></tr>) : <tr><td colSpan={6} className="p-8 text-center">Nenhuma análise foi solicitada.</td></tr>}</tbody></table></div></section>

      {session.role === "master" && settings ? <form method="post" action="/api/admin/kos/configuracao" className="mt-12 grid gap-6 rounded-2xl border border-[#d5e3ec] bg-white p-6"><div><p className="text-sm font-bold uppercase tracking-[.14em] text-[#28738c]">Controle Master</p><h2 className="mt-2 text-2xl font-bold text-[#17375e]">Limites e interrupção de emergência</h2></div><div className="grid gap-5 md:grid-cols-2"><label className="flex items-center gap-3 rounded-xl bg-[#f2f7fb] p-4 font-bold text-[#315f7d]"><input type="checkbox" name="enabled" defaultChecked={settings.enabled} className="h-5 w-5" /> Serviço de análises habilitado</label><label className="grid gap-2 font-bold text-[#315f7d]"><span>Orçamento máximo mensal (US$)</span><input name="monthlyCostLimitUsd" type="number" min="1" max="10000" step="0.01" defaultValue={(settings.monthlyCostLimitMicrousd / 1_000_000).toFixed(2)} className="input" /></label></div><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-[#e8f2f8]"><tr><th className="p-3">Nível</th><th className="p-3">Ativo</th><th className="p-3">Por dia</th><th className="p-3">Tokens/mês</th><th className="p-3">Entrada/análise</th><th className="p-3">Saída/análise</th></tr></thead><tbody>{dashboard.allQuotas.map((item) => <tr key={item.role} className="border-t border-[#e2ebf1]"><td className="p-3 font-bold">{roleLabel(item.role)}</td><td className="p-3"><input type="checkbox" name={`${item.role}_enabled`} defaultChecked={item.enabled} className="h-5 w-5" /></td><td className="p-3"><input className="input min-w-24" type="number" min="0" name={`${item.role}_daily`} defaultValue={item.dailyRequestLimit} /></td><td className="p-3"><input className="input min-w-36" type="number" min="0" name={`${item.role}_monthly`} defaultValue={item.monthlyTokenLimit} /></td><td className="p-3"><input className="input min-w-32" type="number" min="0" name={`${item.role}_input`} defaultValue={item.maxInputTokensPerRequest} /></td><td className="p-3"><input className="input min-w-32" type="number" min="0" name={`${item.role}_output`} defaultValue={item.maxOutputTokensPerRequest} /></td></tr>)}</tbody></table></div><button className="w-fit rounded-xl bg-[#315f7d] px-6 py-3 font-bold text-white">Salvar configuração</button></form> : null}
    </section>
  </main>;
}
