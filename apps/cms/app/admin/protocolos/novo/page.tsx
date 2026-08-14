import Link from "next/link";
import { requireAdmin } from "../../../../lib/session";
import { hasRole } from "../../../../lib/users";

export const metadata = { title: "Novo protocolo | CMS", robots: { index: false, follow: false } };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 font-semibold text-[#315f7d]"><span>{label}</span>{children}</label>;
}

export default async function NewProtocolPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [session, state] = await Promise.all([requireAdmin(), searchParams]);
  const maySetPublic = hasRole(session, "diretoria_cms");
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Cuiaba" }).format(new Date());
  return <main className="min-h-screen bg-[#f2f7fb] text-[#40566a]">
    <header className="border-b border-[#cbdce8] bg-white"><div className="mx-auto max-w-5xl px-6 py-4"><Link href="/admin/protocolos" className="font-bold text-[#17375e]">← Documentos recebidos</Link></div></header>
    <section className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-sm font-bold uppercase tracking-[.16em] text-[#28738c]">Entrada oficial</p><h1 className="mt-3 text-4xl font-bold text-[#17375e]">Protocolar documento recebido</h1><p className="mt-4 max-w-3xl leading-7">Ao concluir, o sistema gera automaticamente o número do protocolo, o recibo e o primeiro registro do histórico.</p>
      {state.error ? <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 font-bold text-red-900">Não foi possível gerar o protocolo. Revise os campos e o arquivo enviado.</p> : null}
      <form method="post" action="/api/admin/protocolos" encType="multipart/form-data" className="mt-8 grid gap-6 rounded-2xl border border-[#d5e3ec] bg-white p-6 shadow-[0_8px_24px_rgba(31,88,114,.06)]">
        <fieldset className="grid gap-6 md:grid-cols-2"><legend className="mb-5 text-xl font-bold text-[#17375e]">Recebimento e remetente</legend>
          <Field label="Data de recebimento"><input name="receivedAt" type="date" required defaultValue={today} className="input" /></Field>
          <Field label="Canal de entrada"><select name="originChannel" required className="input"><option value="presencial">Presencial</option><option value="email">E-mail</option><option value="correios">Correios</option><option value="sistema">Sistema eletrônico</option><option value="outro">Outro</option></select></Field>
          <Field label="Nome do remetente"><input name="senderName" required minLength={2} maxLength={200} className="input" /></Field>
          <Field label="Órgão ou organização"><input name="senderOrganization" maxLength={250} className="input" /></Field>
          <Field label="E-mail do remetente"><input name="senderEmail" type="email" maxLength={254} className="input" /></Field>
          <Field label="Telefone do remetente"><input name="senderPhone" maxLength={40} className="input" /></Field>
        </fieldset>
        <fieldset className="grid gap-6 border-t border-[#d5e3ec] pt-6 md:grid-cols-2"><legend className="mb-5 text-xl font-bold text-[#17375e]">Classificação inicial</legend>
          <Field label="Assunto"><input name="subject" required minLength={3} maxLength={500} className="input" /></Field>
          <Field label="Prioridade"><select name="priority" className="input"><option value="normal">Normal</option><option value="baixa">Baixa</option><option value="alta">Alta</option><option value="urgente">Urgente</option></select></Field>
          <Field label="Prazo esperado para resposta"><input name="responseDueDate" type="date" className="input" /></Field>
          <Field label="Nível de acesso"><select name="visibility" defaultValue="internal" className="input">{maySetPublic ? <option value="public">Público</option> : null}<option value="internal">Interno</option><option value="restricted">Restrito — dados pessoais ou sensíveis</option></select></Field>
          <div className="md:col-span-2"><Field label="Resumo"><textarea name="summary" maxLength={4000} rows={4} className="input" /></Field></div>
        </fieldset>
        <Field label="Documento recebido — PDF, JPG ou PNG (máximo 20 MB)"><input name="file" type="file" accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png" required className="rounded-xl border border-dashed border-[#9db9ca] bg-[#f4f8fb] p-4" /></Field>
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm font-semibold text-sky-900">O documento entra como registro institucional protegido. Somente a Diretoria pode deliberar, publicar ou arquivar definitivamente.</div>
        <button className="w-fit rounded-xl bg-[#087f5b] px-6 py-3 font-bold text-white hover:bg-[#056a4b]">Gerar protocolo e recibo</button>
      </form>
    </section>
  </main>;
}
