import Link from "next/link";
import { requireAdmin } from "../../../lib/session";
import { listAuditEntries, type AuditEntry } from "../../../lib/audit";
import { hasRole } from "../../../lib/users";

export const dynamic = "force-dynamic";
export const metadata = { title: "Auditoria | CMS", robots: { index: false, follow: false } };

const actionLabels: Record<string, string> = {
  document_created: "Documento cadastrado",
  document_updated: "Documento revisado",
  document_received_and_protocolled: "Documento recebido e protocolado",
  received_protocol_created: "Protocolo gerado",
  received_protocol_updated: "Tramitação do protocolo atualizada",
  monitoring_updated: "Monitoramento atualizado",
  user_approved: "Cadastro aprovado",
  user_rejected: "Cadastro rejeitado",
  user_access_updated: "Nível de acesso atualizado",
  password_change_approved: "Nova senha validada",
  password_change_rejected: "Solicitação de senha rejeitada",
  password_reset_completed: "Senha redefinida por link de e-mail",
  kos_analysis_requested: "Análise KOS solicitada",
  kos_analysis_completed: "Análise KOS concluída",
  kos_analysis_quota_blocked: "Análise bloqueada por limite",
  kos_analysis_approved: "Análise KOS aprovada",
  kos_analysis_corrected: "Análise KOS corrigida",
  kos_analysis_rejected: "Análise KOS rejeitada",
  kos_configuration_updated: "Configuração do KOS atualizada",
};

const detailLabels: Record<string, string> = {
  title: "Título",
  status: "Situação",
  visibility: "Visibilidade",
  protocolNumber: "Número do protocolo",
  previousStatus: "Situação anterior",
  priority: "Prioridade",
  responseDueDate: "Prazo de resposta",
  assignedArea: "Área ou comissão",
  responsibleName: "Responsável pela execução",
  expectedCompletion: "Prazo previsto",
  progressPercent: "Progresso",
  fileReplaced: "PDF substituído",
  createdBy: "Realizado por",
  updatedBy: "Realizado por",
};

function valueLabel(key: string, value: unknown) {
  if (value === null || value === "") return "Não informado";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (key === "progressPercent") return `${value}%`;
  const translations: Record<string, string> = { draft: "Rascunho", published: "Publicado", archived: "Arquivado", public: "Público", restricted: "Restrito", internal: "Interno", not_started: "Não iniciada", in_progress: "Em andamento", completed: "Concluída", delayed: "Atrasada" };
  return translations[String(value)] ?? String(value);
}

function Entry({ entry }: { entry: AuditEntry }) {
  const details = Object.entries(entry.details ?? {}).filter(([key]) => detailLabels[key]);
  const time = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Cuiaba" }).format(new Date(entry.createdAt));
  return <article className="rounded-2xl border border-[#d5e3ec] bg-white p-6 shadow-[0_8px_24px_rgba(31,88,114,.05)]">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-bold uppercase tracking-[.12em] text-[#28738c]">{entry.entityType === "document" ? "Documento" : entry.entityType === "received_protocol" ? "Protocolo recebido" : entry.entityType === "conference_proposal" ? "Proposta" : entry.entityType === "kos_analysis" ? "Análise KOS" : "Registro"}</p><h2 className="mt-2 text-xl font-bold text-[#17375e]">{entry.entityLabel}</h2></div><time className="rounded-full bg-[#e8f2f8] px-3 py-1 text-sm font-semibold text-[#315f7d]">{time}</time></div>
    <p className="mt-4 font-bold text-[#087f5b]">{actionLabels[entry.action] ?? entry.action}</p><p className="mt-1 text-sm">Responsável: <strong>{entry.actorName ?? entry.actorEmail ?? String(entry.details?.createdBy ?? entry.details?.updatedBy ?? "Registro anterior sem identificação")}</strong></p>
    {details.length ? <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{details.map(([key, value]) => <div key={key} className="rounded-xl bg-[#f2f7fb] p-3"><dt className="text-xs font-bold uppercase tracking-wide text-[#60798c]">{detailLabels[key]}</dt><dd className="mt-1 break-words font-semibold text-[#40566a]">{valueLabel(key, value)}</dd></div>)}</dl> : null}
  </article>;
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ tipo?: string; pagina?: string }> }) {
  const session = await requireAdmin();
  const query = await searchParams;
  const maySeeProtocols = hasRole(session, "gestao");
  const allowedTypes = maySeeProtocols ? ["document", "received_protocol", "conference_proposal", "user", "kos_analysis"] : ["document", "conference_proposal", "user"];
  const type = allowedTypes.includes(query.tipo ?? "") ? query.tipo! : null;
  const requestedPage = Number(query.pagina ?? "1");
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const result = await listAuditEntries(type, page, 30, maySeeProtocols);
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const filterHref = (selected: string | null) => selected ? `/admin/auditoria?tipo=${selected}` : "/admin/auditoria";
  const pageHref = (target: number) => `/admin/auditoria?${type ? `tipo=${type}&` : ""}pagina=${target}`;
  return <main className="min-h-screen bg-[#f2f7fb] text-[#40566a]">
    <header className="border-b border-[#cbdce8] bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"><Link href="/admin" className="font-bold text-[#17375e]">← Painel administrativo</Link><span className="text-sm font-semibold text-[#60798c]">Acesso protegido</span></div></header>
    <section className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-sm font-bold uppercase tracking-[.16em] text-[#28738c]">Transparência administrativa</p><h1 className="mt-3 text-4xl font-bold text-[#17375e]">Histórico de auditoria</h1><p className="mt-4 max-w-3xl leading-7">Consulte os registros de cadastro, revisão e acompanhamento realizados no CMS.</p>
      <nav aria-label="Filtrar histórico" className="mt-8 flex flex-wrap gap-3">{[[null, "Todos"], ["document", "Documentos"], ...(maySeeProtocols ? [["received_protocol", "Protocolos"], ["kos_analysis", "Análises KOS"]] : []), ["conference_proposal", "Propostas"], ["user", "Usuários"]].map(([value, label]) => <Link key={label} href={filterHref(value)} className={`rounded-full px-4 py-2 text-sm font-bold ${type === value ? "bg-[#315f7d] text-white" : "border border-[#9db9ca] bg-white text-[#315f7d]"}`}>{label}</Link>)}</nav>
      <p className="mt-7 text-sm font-semibold text-[#60798c]">{result.total} {result.total === 1 ? "registro encontrado" : "registros encontrados"}</p>
      <div className="mt-4 grid gap-5">{result.entries.length ? result.entries.map((entry) => <Entry key={entry.id} entry={entry} />) : <p className="rounded-2xl border border-[#d5e3ec] bg-white p-8 text-center">Nenhum registro disponível neste filtro.</p>}</div>
      {totalPages > 1 ? <nav aria-label="Paginação" className="mt-8 flex items-center justify-between"><span className="text-sm font-semibold">Página {Math.min(page, totalPages)} de {totalPages}</span><div className="flex gap-3">{page > 1 ? <Link href={pageHref(page - 1)} className="rounded-xl border border-[#9db9ca] bg-white px-4 py-2 font-bold text-[#315f7d]">Anterior</Link> : null}{page < totalPages ? <Link href={pageHref(page + 1)} className="rounded-xl bg-[#315f7d] px-4 py-2 font-bold text-white">Próxima</Link> : null}</div></nav> : null}
    </section>
  </main>;
}
