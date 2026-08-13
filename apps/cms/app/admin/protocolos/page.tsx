import Link from "next/link";
import { listReceivedProtocols, protocolStatusLabels } from "../../../lib/protocols";
import { requireAdmin } from "../../../lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Protocolos recebidos | CMS", robots: { index: false, follow: false } };

const priorityLabel = { baixa: "Baixa", normal: "Normal", alta: "Alta", urgente: "Urgente" };

export default async function ProtocolsPage() {
  const session = await requireAdmin();
  const protocols = await listReceivedProtocols(session);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Cuiaba" }).format(new Date());
  const limit = new Date(`${today}T12:00:00`);
  limit.setDate(limit.getDate() + 7);
  const sevenDays = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Cuiaba" }).format(limit);
  const open = protocols.filter((item) => item.status !== "arquivado");
  const overdue = open.filter((item) => item.responseDueDate && item.responseDueDate < today).length;
  const dueSoon = open.filter((item) => item.responseDueDate && item.responseDueDate >= today && item.responseDueDate <= sevenDays).length;
  const triage = protocols.filter((item) => ["protocolado", "triagem"].includes(item.status)).length;

  return <main className="min-h-screen bg-[#f2f7fb] text-[#40566a]">
    <header className="border-b border-[#cbdce8] bg-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4"><Link href="/admin" className="font-bold text-[#17375e]">← Painel administrativo</Link><Link href="/admin/protocolos/novo" className="rounded-xl bg-[#087f5b] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#056a4b]">Novo protocolo</Link></div></header>
    <section className="mx-auto max-w-7xl px-6 py-12">
      <p className="text-sm font-bold uppercase tracking-[.16em] text-[#28738c]">Caixa de entrada institucional</p>
      <h1 className="mt-3 text-4xl font-bold text-[#17375e]">Documentos recebidos</h1>
      <p className="mt-4 max-w-3xl leading-7">Protocole documentos, acompanhe prazos e consulte toda a tramitação. {session.role === "membro_conselho" ? "Você visualiza os protocolos criados por você." : "A Gestão e a Diretoria visualizam a caixa institucional completa."}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[["Protocolos visíveis", protocols.length], ["Aguardando triagem", triage], ["Vencem em até 7 dias", dueSoon], ["Prazos vencidos", overdue]].map(([label, value]) => <article key={label} className="rounded-2xl border border-[#d5e3ec] bg-white p-5 shadow-[0_8px_24px_rgba(31,88,114,.06)]"><p className="text-sm font-bold text-[#60758a]">{label}</p><p className={`mt-2 text-3xl font-bold ${label === "Prazos vencidos" && Number(value) > 0 ? "text-red-700" : "text-[#1f5872]"}`}>{value}</p></article>)}
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-[#d5e3ec] bg-white">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="bg-[#e8f2f8] text-[#36566c]"><tr><th className="p-4">Protocolo</th><th className="p-4">Assunto e remetente</th><th className="p-4">Situação</th><th className="p-4">Responsável</th><th className="p-4">Prazo</th><th className="p-4">Ação</th></tr></thead>
          <tbody>{protocols.length ? protocols.map((item) => {
            const isOverdue = item.responseDueDate && item.responseDueDate < today && item.status !== "arquivado";
            return <tr key={item.id} className="border-t border-[#e2ebf1] align-top">
              <td className="p-4"><strong className="text-[#234c68]">{item.protocolNumber}</strong><span className="mt-1 block text-xs">Recebido em {new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Cuiaba" }).format(new Date(`${item.receivedAt}T12:00:00`))}</span><span className="mt-1 block text-xs font-semibold">Prioridade: {priorityLabel[item.priority]}</span></td>
              <td className="p-4"><strong className="block max-w-md text-[#234c68]">{item.subject}</strong><span className="mt-1 block">{item.senderName}</span><span className="block text-xs">{item.senderOrganization ?? "Sem organização informada"}</span></td>
              <td className="p-4"><span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-900">{protocolStatusLabels[item.status]}</span><span className="mt-2 block text-xs">{item.visibility === "public" ? "Público" : item.visibility === "restricted" ? "Restrito" : "Interno"}</span></td>
              <td className="p-4">{item.responsibleName ?? "A definir"}<span className="block text-xs">{item.assignedArea ?? "Área não definida"}</span></td>
              <td className={`p-4 font-semibold ${isOverdue ? "text-red-700" : ""}`}>{item.responseDueDate ? new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Cuiaba" }).format(new Date(`${item.responseDueDate}T12:00:00`)) : "Sem prazo"}{isOverdue ? <span className="block text-xs font-bold">Prazo vencido</span> : null}</td>
              <td className="p-4"><Link href={`/admin/protocolos/${item.id}`} className="font-bold text-[#087f5b] hover:underline">Acompanhar →</Link></td>
            </tr>;
          }) : <tr><td colSpan={6} className="p-10 text-center font-semibold">Nenhum documento recebido foi protocolado ainda.</td></tr>}</tbody>
        </table>
      </div>
    </section>
  </main>;
}
