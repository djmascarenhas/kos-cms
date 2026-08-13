import Link from "next/link";
import { requireAdmin } from "../../../lib/session";
import { listAdminDocuments, listDocumentTypes } from "../../../lib/documents";
import { canPublish, hasRole } from "../../../lib/users";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gestão de documentos | CMS", robots: { index: false, follow: false } };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 font-semibold text-[#315f7d]"><span>{label}</span>{children}</label>;
}

export default async function AdminDocumentsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const session = await requireAdmin();
  const mayPublish = canPublish(session);
  const mayEdit = hasRole(session, "gestao");
  const [types, documents, state] = await Promise.all([listDocumentTypes(), listAdminDocuments(), searchParams]);
  return <main className="min-h-screen bg-[#f2f7fb] text-[#40566a]">
    <header className="border-b border-[#cbdce8] bg-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4"><Link href="/admin" className="font-bold text-[#17375e]">← Painel administrativo</Link><div className="flex flex-wrap gap-4"><Link href="/admin/documentos/classificacao" className="text-sm font-bold text-[#087f5b]">Classificação documental</Link><Link href="/admin/documentos/drive" className="text-sm font-bold text-[#087f5b]">Portal versus Drive</Link><Link href="/documentos" className="text-sm font-semibold text-[#315f7d]">Ver biblioteca pública</Link></div></div></header>
    <section className="mx-auto max-w-7xl px-6 py-12">
      <p className="text-sm font-bold uppercase tracking-[.16em] text-[#28738c]">Área protegida</p>
      <h1 className="mt-3 text-4xl font-bold text-[#17375e]">Documentos institucionais</h1>
      <p className="mt-4 max-w-3xl leading-7">Protocole PDFs e acompanhe autoria, arquivo original, versões e todas as alterações. Documentos enviados por membros entram como internos e rascunhos até a revisão.</p>
      {state.saved ? <p className="mt-6 rounded-xl border border-teal-200 bg-teal-50 p-4 font-semibold text-teal-800">Documento cadastrado com sucesso.</p> : null}
      {state.error ? <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 font-semibold text-red-800">Não foi possível cadastrar o documento. Verifique o PDF e os campos.</p> : null}
      <form method="post" action="/api/admin/documentos" encType="multipart/form-data" className="mt-8 grid gap-6 rounded-2xl border border-[#d5e3ec] bg-white p-6 shadow-[0_8px_24px_rgba(31,88,114,.06)]">
        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Título"><input name="title" required maxLength={300} className="input" /></Field>
          <Field label="Tipo"><select name="typeId" required className="input"><option value="">Selecione</option>{types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select></Field>
          <Field label="Número do documento"><input name="documentNumber" maxLength={100} className="input" placeholder="Ex.: Resolução nº 12/2026" /></Field>
          <Field label="Ano de referência"><input name="referenceYear" type="number" min="1900" max="2200" className="input" defaultValue={new Date().getFullYear()} /></Field>
          <Field label="Órgão emissor"><input name="issuingBody" maxLength={300} className="input" defaultValue="Conselho Municipal de Saúde de Chapada dos Guimarães" /></Field>
          <Field label="Data do documento"><input name="documentDate" type="date" className="input" /></Field>
          {mayPublish ? <><Field label="Situação"><select name="status" className="input"><option value="published">Publicado</option><option value="draft">Rascunho</option></select></Field><Field label="Visibilidade"><select name="visibility" className="input"><option value="public">Público</option><option value="restricted">Restrito</option><option value="internal">Interno</option></select></Field></> : <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm font-semibold text-sky-800 md:col-span-2"><input type="hidden" name="status" value="draft" /><input type="hidden" name="visibility" value="internal" />O protocolo será salvo como <strong>rascunho interno</strong>. A Diretoria do CMS é responsável pela publicação.</div>}
        </div>
        <Field label="Descrição"><textarea name="description" maxLength={3000} rows={4} className="input" /></Field>
        <Field label="Arquivo PDF (máximo 20 MB)"><input name="file" type="file" accept="application/pdf,.pdf" required className="rounded-xl border border-dashed border-[#9db9ca] bg-[#f4f8fb] p-4" /></Field>
        <button className="w-fit rounded-xl bg-[#315f7d] px-6 py-3 font-bold text-white hover:bg-[#234c68]">Cadastrar documento</button>
      </form>

      <h2 className="mt-12 text-2xl font-bold text-[#1f5872]">Documentos cadastrados</h2>
      <div className="mt-5 overflow-x-auto rounded-2xl border border-[#d5e3ec] bg-white"><table className="w-full min-w-[860px] text-left text-sm">
        <thead className="bg-[#e8f2f8]"><tr><th className="p-4">Documento</th><th className="p-4">Tipo</th><th className="p-4">Criado/protocolado por</th><th className="p-4">Data</th><th className="p-4">Situação</th><th className="p-4">Ações</th></tr></thead>
        <tbody>{documents.map((document) => <tr key={document.id} className="border-t border-[#e2ebf1]"><td className="p-4"><strong className="block text-[#234c68]">{document.title}</strong><span className="mt-1 block text-xs">{document.originalFilename ?? "Arquivo anterior à implantação do histórico"}</span></td><td className="p-4">{document.typeName ?? "Sem tipo"}</td><td className="p-4">{document.createdByName ?? document.uploadedByName ?? "Registro histórico não identificado"}<span className="block text-xs">{document.createdByEmail ?? document.uploadedByEmail ?? "—"}</span></td><td className="p-4">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Cuiaba" }).format(new Date(document.createdAt))}</td><td className="p-4">{document.status === "published" ? "Publicado" : document.status === "draft" ? "Rascunho" : "Arquivado"}<span className="block text-xs">{document.visibility === "public" ? "Público" : document.visibility === "restricted" ? "Restrito" : "Interno"}</span></td><td className="p-4"><div className="grid gap-2">{mayEdit ? <Link href={`/admin/documentos/${document.id}`} className="font-bold text-[#087f5b] hover:underline">Revisar</Link> : null}<Link href={`/admin/documentos/${document.id}/historico`} className="font-bold text-[#315f7d] hover:underline">Histórico completo</Link></div></td></tr>)}</tbody>
      </table></div>
    </section>
  </main>;
}
