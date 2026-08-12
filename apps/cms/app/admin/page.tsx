import Image from "next/image";
import Link from "next/link";
import { logout, requireAdmin } from "./actions";

export const metadata = { title: "Administracao | Conselho Municipal de Saude", robots: { index: false, follow: false } };

const areas = [
  ["Documentos", "Cadastrar PMS, PAS, atas, resoluções e anexos.", null],
  ["Propostas", "Atualizar responsáveis, prazos e andamento das propostas.", "/admin/propostas"],
  ["Publicação", "Revisar o que aparece no portal público.", null],
];

export default async function AdminPage() {
  const session = await requireAdmin();
  return <main className="min-h-screen bg-[#f7faf8] text-slate-900"><header className="border-b border-emerald-950/10 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4"><div className="flex items-center gap-3"><Image src="/cms-logo.jpeg" alt="Logotipo do Conselho Municipal de Saude" width={48} height={48} className="rounded-xl" /><div><p className="text-sm font-bold text-emerald-950">Administracao do CMS</p><p className="text-xs text-slate-600">{session.email}</p></div></div><form action={logout}><button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Sair</button></form></div></header><section className="mx-auto max-w-7xl px-6 py-14"><p className="text-sm font-bold uppercase tracking-[.16em] text-emerald-800">Area protegida</p><h1 className="mt-3 text-4xl font-bold tracking-tight text-emerald-950">Painel administrativo</h1><p className="mt-4 max-w-2xl leading-7 text-slate-600">Acesso autorizado. Este painel concentra as proximas ferramentas de cadastro e acompanhamento institucional.</p><div className="mt-10 grid gap-5 md:grid-cols-3">{areas.map(([title, description, href], index) => <section key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><span className="text-sm font-bold text-amber-700">0{index + 1}</span><h2 className="mt-7 text-xl font-bold text-emerald-950">{title}</h2><p className="mt-3 leading-7 text-slate-600">{description}</p>{href ? <Link href={href} className="mt-6 inline-flex text-sm font-bold text-emerald-800">Gerenciar propostas →</Link> : <span className="mt-6 inline-flex text-sm font-bold text-emerald-800">Em preparação</span>}</section>)}</div><Link href="/" className="mt-10 inline-flex font-bold text-emerald-800 hover:text-emerald-600">Ver portal publico -&gt;</Link></section></main>;
}
