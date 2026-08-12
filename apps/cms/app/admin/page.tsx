import Image from "next/image";
import Link from "next/link";
import { logout, requireAdmin } from "./actions";

export const metadata = { title: "Administração | Conselho Municipal de Saúde", robots: { index: false, follow: false } };

const areas = [
  { number: "01", title: "Documentos", description: "Cadastrar, revisar e publicar PMS, PAS, atas, resoluções e anexos.", href: "/admin/documentos", action: "Gerenciar documentos" },
  { number: "02", title: "Propostas", description: "Atualizar responsáveis, prazos e andamento das propostas.", href: "/admin/propostas", action: "Gerenciar propostas" },
  { number: "03", title: "Auditoria", description: "Consultar o histórico de cadastros e alterações realizadas no CMS.", href: "/admin/auditoria", action: "Ver histórico" },
];

export default async function AdminPage() {
  const session = await requireAdmin();
  return <main className="min-h-screen bg-[#f7faf8] text-slate-900">
    <header className="border-b border-emerald-950/10 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4"><div className="flex items-center gap-3"><Image src="/cms-logo.jpeg" alt="Logotipo do Conselho Municipal de Saúde" width={48} height={48} className="rounded-xl" /><div><p className="text-sm font-bold text-emerald-950">Administração do CMS</p><p className="text-xs text-slate-600">{session.email}</p></div></div><form action={logout}><button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Sair</button></form></div></header>
    <section className="mx-auto max-w-7xl px-6 py-14"><p className="text-sm font-bold uppercase tracking-[.16em] text-emerald-800">Área protegida</p><h1 className="mt-3 text-4xl font-bold tracking-tight text-emerald-950">Painel administrativo</h1><p className="mt-4 max-w-2xl leading-7 text-slate-600">Gerencie documentos, acompanhe propostas e consulte o histórico das alterações institucionais.</p>
      <div className="mt-10 grid gap-5 md:grid-cols-3">{areas.map((area) => <section key={area.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><span className="text-sm font-bold text-amber-700">{area.number}</span><h2 className="mt-7 text-xl font-bold text-emerald-950">{area.title}</h2><p className="mt-3 leading-7 text-slate-600">{area.description}</p><Link href={area.href} className="mt-6 inline-flex text-sm font-bold text-emerald-800">{area.action} →</Link></section>)}</div>
      <Link href="/" className="mt-10 inline-flex font-bold text-emerald-800 hover:text-emerald-600">Ver portal público →</Link>
    </section>
  </main>;
}
