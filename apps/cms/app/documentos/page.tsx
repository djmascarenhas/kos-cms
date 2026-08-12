import { PublicFooter, PublicHeader } from "../../components/institutional-shell";
import { listPublicDocuments } from "../../lib/documents";

export const dynamic = "force-dynamic";
export const metadata = { title: "Documentos institucionais | Conselho Municipal de Saúde" };

export default async function DocumentsPage() {
  const documents = await listPublicDocuments();
  const groups = [...new Set(documents.map((document) => document.typeName || "Outros"))];
  return <main id="conteudo-principal" className="min-h-screen bg-[#f2f7fb] text-[#40566a]">
    <PublicHeader />
    <section className="border-b border-[#c9ddea] bg-gradient-to-br from-[#e9f3f9] via-[#f4f9fc] to-[#e5f1f7]"><div className="mx-auto max-w-7xl px-6 py-14 md:py-20"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#28738c]">Transparência e acesso público</p><h1 className="mt-4 text-4xl font-bold text-[#17375e] md:text-5xl">Documentos institucionais</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-[#405f73]">Consulte planos, programações, atas, resoluções, relatórios e outros documentos oficiais relacionados ao Conselho e à política municipal de saúde.</p></div></section>
    <section className="mx-auto max-w-7xl px-6 py-12">{documents.length === 0 ? <p className="rounded-2xl border border-[#d5e3ec] bg-white p-6">Nenhum documento público disponível.</p> : <div className="space-y-12">{groups.map((group) => <section key={group}><h2 className="text-2xl font-bold text-[#1f5872]">{group}</h2><div className="mt-5 grid gap-5 md:grid-cols-2">{documents.filter((document) => (document.typeName || "Outros") === group).map((document) => <article key={document.id} className="rounded-2xl border border-[#d5e3ec] bg-white p-6 shadow-[0_8px_24px_rgba(31,88,114,.06)]"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.12em] text-[#60758a]">{document.referenceYear ?? "Documento institucional"}</p><h3 className="mt-2 text-xl font-bold text-[#17375e]">{document.title}</h3></div><span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-800">PDF</span></div>{document.description ? <p className="mt-4 leading-7">{document.description}</p> : null}<div className="mt-4 text-sm text-[#60758a]">{document.documentNumber ? <p><strong className="text-[#234c68]">Número:</strong> {document.documentNumber}</p> : null}{document.documentDate ? <p><strong className="text-[#234c68]">Data:</strong> {new Date(`${document.documentDate}T12:00:00`).toLocaleDateString("pt-BR")}</p> : null}</div>{document.storagePath ? <a href={`/api/documentos/${document.id}`} target="_blank" rel="noreferrer" className="mt-5 inline-flex rounded-xl bg-[#315f7d] px-5 py-3 font-bold text-white hover:bg-[#234c68]">Abrir documento</a> : <span className="mt-5 inline-flex text-sm font-semibold text-[#60758a]">Arquivo digital não disponível</span>}</article>)}</div></section>)}</div>}</section>
    <PublicFooter />
  </main>;
}
