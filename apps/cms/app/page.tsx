import Link from "next/link";
import { PublicFooter, PublicHeader } from "../components/institutional-shell";

const cards = [
  { title: "Documentos", description: "Planos, atas, resoluções e relatórios para consulta pública.", href: "/documentos", icon: "00" },
  { title: "9ª Conferência", description: "20 propostas aprovadas e rastreabilidade com PMS e PAS.", href: "/conferencia", icon: "01" },
  { title: "PMS 2026–2029", description: "Planejamento municipal para os próximos quatro anos.", href: "/pms-2026-2029", icon: "02" },
  { title: "PAS 2026", description: "Ações e metas anuais em acompanhamento.", href: "/pas-2026", icon: "03" },
  { title: "Área administrativa", description: "Acesso protegido para gestão de conteúdos do portal.", href: "/admin", icon: "04" },
];

export default function Home() {
  return (
    <main id="conteudo-principal" className="min-h-screen bg-[#f2f7fb] text-[#40566a]">
      <PublicHeader />

      <section className="health-grid overflow-hidden bg-emerald-950 text-white"><div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1.25fr_.75fr] lg:items-center lg:py-24"><div><p className="inline-flex rounded-full bg-emerald-900 px-4 py-2 text-xs font-bold uppercase tracking-[.18em] text-emerald-200">Portal institucional</p><h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">Saúde pública com escuta, transparência e participação.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-emerald-100">Acompanhe prioridades, documentos e decisões do Conselho Municipal de Saúde de Chapada dos Guimarães.</p><div className="mt-9 flex flex-wrap gap-3"><Link href="/conferencia" className="rounded-xl bg-amber-400 px-6 py-3 font-bold text-emerald-950 transition hover:bg-amber-300">Ver a 9ª Conferência</Link><a href={process.env.NEXT_PUBLIC_KOS_URL ?? "https://kos.chapada.ia.br"} className="rounded-xl border border-emerald-500 px-6 py-3 font-bold text-white transition hover:bg-emerald-900">Consultar o KOS</a></div></div><div className="rounded-3xl bg-white p-7 text-slate-900 shadow-2xl"><p className="text-sm font-bold uppercase tracking-[.16em] text-emerald-800">Em destaque</p><p className="mt-4 text-4xl font-bold text-emerald-950">20</p><p className="mt-1 text-lg font-semibold">propostas da 9ª Conferência</p><p className="mt-4 leading-7 text-slate-600">Compare cada proposta aprovada com o Plano Municipal de Saúde e a Programação Anual de Saúde.</p><Link href="/conferencia" className="mt-6 inline-flex font-bold text-emerald-800 hover:text-emerald-600">Acessar análise →</Link></div></div></section>

      <section className="mx-auto max-w-7xl px-6 py-16"><div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[.16em] text-emerald-800">Acesso rápido</p><h2 className="mt-3 text-3xl font-bold tracking-tight">Informação organizada para o controle social.</h2></div><div className="mt-9 grid gap-5 md:grid-cols-3">{cards.map((card) => <Link key={card.title} href={card.href} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"><span className="text-sm font-bold text-amber-700">{card.icon}</span><h3 className="mt-8 text-xl font-bold">{card.title}</h3><p className="mt-3 leading-7 text-slate-600">{card.description}</p><span className="mt-6 inline-flex font-bold text-emerald-800 group-hover:text-emerald-600">Acessar →</span></Link>)}</div></section>

      <section className="bg-emerald-50"><div className="mx-auto grid max-w-7xl gap-8 px-6 py-14 md:grid-cols-3"><div><p className="text-3xl font-bold text-emerald-950">20</p><p className="mt-1 text-slate-700">propostas documentadas</p></div><div><p className="text-3xl font-bold text-emerald-950">40</p><p className="mt-1 text-slate-700">análises de rastreabilidade</p></div><div><p className="text-3xl font-bold text-emerald-950">1</p><p className="mt-1 text-slate-700">portal público de acompanhamento</p></div></div></section>
      <PublicFooter />
    </main>
  );
}
