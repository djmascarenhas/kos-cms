import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../lib/session";
import { getAdminDocument, listDocumentTypes } from "../../../../lib/documents";
import { canPublish } from "../../../../lib/users";

export const dynamic = "force-dynamic";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 font-semibold text-[#315f7d]"><span>{label}</span>{children}</label>;
}

export default async function DocumentReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const session = await requireAdmin("gestao");
  const mayPublish = canPublish(session);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [document, types, state] = await Promise.all([getAdminDocument(id), listDocumentTypes(), searchParams]);
  if (!document) notFound();

  return <main className="min-h-screen bg-[#f2f7fb] text-[#40566a]">
    <header className="border-b border-[#cbdce8] bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4"><Link href="/admin/documentos" className="font-bold text-[#17375e]">← Documentos</Link><Link href={`/admin/documentos/${document.id}/historico`} className="text-sm font-semibold text-[#315f7d]">Ver histórico completo</Link></div></header>
    <section className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-sm font-bold uppercase tracking-[.16em] text-[#28738c]">Revisão documental</p>
      <h1 className="mt-3 text-4xl font-bold text-[#17375e]">Editar documento</h1>
      <p className="mt-4 leading-7">Corrija os dados, controle a publicação ou substitua o PDF. O arquivo anterior é preservado para recuperação.</p>
      {state.saved ? <p className="mt-6 rounded-xl border border-teal-200 bg-teal-50 p-4 font-semibold text-teal-800">Alterações salvas com sucesso.</p> : null}
      {state.error ? <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 font-semibold text-red-800">Não foi possível salvar. Verifique os campos e o PDF.</p> : null}
      <form method="post" action={`/api/admin/documentos/${document.id}`} encType="multipart/form-data" className="mt-8 grid gap-6 rounded-2xl border border-[#d5e3ec] bg-white p-6 shadow-[0_8px_24px_rgba(31,88,114,.06)]">
        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Título"><input name="title" required maxLength={300} className="input" defaultValue={document.title} /></Field>
          <Field label="Tipo"><select name="typeId" required className="input" defaultValue={document.typeId ?? ""}><option value="">Selecione</option>{types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select></Field>
          <Field label="Número do documento"><input name="documentNumber" maxLength={100} className="input" defaultValue={document.documentNumber ?? ""} /></Field>
          <Field label="Ano de referência"><input name="referenceYear" type="number" min="1900" max="2200" className="input" defaultValue={document.referenceYear ?? ""} /></Field>
          <Field label="Órgão emissor"><input name="issuingBody" maxLength={300} className="input" defaultValue={document.issuingBody ?? ""} /></Field>
          <Field label="Data do documento"><input name="documentDate" type="date" className="input" defaultValue={document.documentDate ?? ""} /></Field>
          {mayPublish ? <><Field label="Situação"><select name="status" className="input" defaultValue={document.status}><option value="published">Publicado</option><option value="draft">Rascunho</option><option value="archived">Arquivado</option></select></Field><Field label="Visibilidade"><select name="visibility" className="input" defaultValue={document.visibility}><option value="public">Público</option><option value="restricted">Restrito</option><option value="internal">Interno</option></select></Field></> : <><Field label="Situação"><input className="input" value="Rascunho — publicação reservada à Diretoria" readOnly /><input type="hidden" name="status" value="draft" /></Field><Field label="Visibilidade"><select name="visibility" className="input" defaultValue={document.visibility === "restricted" ? "restricted" : "internal"}><option value="internal">Interno</option><option value="restricted">Restrito</option></select></Field></>}
        </div>
        <Field label="Descrição"><textarea name="description" maxLength={3000} rows={5} className="input" defaultValue={document.description ?? ""} /></Field>
        <Field label="Substituir PDF (opcional, máximo 20 MB)"><input name="file" type="file" accept="application/pdf,.pdf" className="rounded-xl border border-dashed border-[#9db9ca] bg-[#f4f8fb] p-4" /><span className="text-sm font-normal text-[#60798c]">Deixe vazio para manter o arquivo atual.</span></Field>
        <div className="flex flex-wrap gap-3"><button className="rounded-xl bg-[#315f7d] px-6 py-3 font-bold text-white hover:bg-[#234c68]">Salvar alterações</button><Link href="/admin/documentos" className="rounded-xl border border-[#9db9ca] px-6 py-3 font-bold text-[#315f7d]">Cancelar</Link></div>
      </form>
    </section>
  </main>;
}
