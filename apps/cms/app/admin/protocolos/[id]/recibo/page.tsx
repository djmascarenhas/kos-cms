import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "../../../../../components/print-button";
import { getReceivedProtocol } from "../../../../../lib/protocols";
import { requireAdmin } from "../../../../../lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Recibo de protocolo | CMS", robots: { index: false, follow: false } };

export default async function ProtocolReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const result = await getReceivedProtocol(id, session);
  if (!result) notFound();
  const item = result.protocol;
  return <main className="min-h-screen bg-white px-6 py-10 text-slate-900"><section className="mx-auto max-w-3xl rounded-2xl border-2 border-[#315f7d] bg-white p-8 shadow-sm print:border print:shadow-none">
    <div className="flex flex-wrap items-center justify-between gap-5 border-b border-slate-300 pb-6"><div className="flex items-center gap-4"><Image src="/cms-logo.jpeg" alt="Conselho Municipal de Saúde" width={72} height={72} className="rounded-xl" /><div><p className="font-bold text-[#17375e]">Conselho Municipal de Saúde</p><p className="text-sm">Chapada dos Guimarães – MT</p></div></div><p className="text-sm font-bold uppercase tracking-wider text-[#315f7d]">Recibo de protocolo</p></div>
    <h1 className="mt-8 text-3xl font-bold text-[#17375e]">{item.protocolNumber}</h1><p className="mt-2 text-sm">Código de conferência: <strong>{item.receiptCode}</strong></p>
    <dl className="mt-8 grid gap-5 sm:grid-cols-2"><div><dt className="text-xs font-bold uppercase text-slate-500">Recebido em</dt><dd className="mt-1 font-semibold">{new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Cuiaba" }).format(new Date(`${item.receivedAt}T12:00:00`))}</dd></div><div><dt className="text-xs font-bold uppercase text-slate-500">Registrado em</dt><dd className="mt-1 font-semibold">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Cuiaba" }).format(new Date(item.createdAt))}</dd></div><div><dt className="text-xs font-bold uppercase text-slate-500">Remetente</dt><dd className="mt-1 font-semibold">{item.senderName}</dd></div><div><dt className="text-xs font-bold uppercase text-slate-500">Organização</dt><dd className="mt-1 font-semibold">{item.senderOrganization ?? "Não informada"}</dd></div><div className="sm:col-span-2"><dt className="text-xs font-bold uppercase text-slate-500">Assunto</dt><dd className="mt-1 font-semibold">{item.subject}</dd></div><div><dt className="text-xs font-bold uppercase text-slate-500">Arquivo recebido</dt><dd className="mt-1 font-semibold">{item.originalFilename ?? "Nome não registrado"}</dd></div><div><dt className="text-xs font-bold uppercase text-slate-500">Protocolado por</dt><dd className="mt-1 font-semibold">{item.createdByName}</dd></div></dl>
    <p className="mt-8 rounded-xl bg-[#e8f2f8] p-4 text-sm font-semibold text-[#234c68]">Este recibo comprova a entrada do documento no Conselho Municipal de Saúde. A situação e a tramitação devem ser acompanhadas na área administrativa do portal.</p>
    <div className="mt-8 flex flex-wrap justify-between gap-4 print:hidden"><Link href={`/admin/protocolos/${id}`} className="rounded-xl border border-[#9db9ca] px-5 py-2.5 font-bold text-[#315f7d]">Voltar ao protocolo</Link><PrintButton /></div>
  </section></main>;
}
