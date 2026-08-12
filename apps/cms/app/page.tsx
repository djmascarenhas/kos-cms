import Image from "next/image";
import Link from "next/link";

const cards = [
  { title: "9ª Conferência Municipal de Saúde", description: "20 propostas aprovadas e análise de rastreabilidade.", href: "/conferencia" },
  { title: "PMS 2026–2029", description: "Plano Municipal de Saúde.", href: "/conferencia" },
  { title: "PAS 2026", description: "Programação Anual de Saúde.", href: "/conferencia" },
  { title: "Reuniões", description: "Pautas, atas e deliberações do Conselho.", href: "/conferencia" },
  { title: "Documentos", description: "Biblioteca institucional do CMS.", href: "/conferencia" },
  { title: "KOS", description: "Inteligência técnico-institucional.", href: process.env.NEXT_PUBLIC_KOS_URL ?? "https://kos.chapada.ia.br" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-emerald-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <Image src="/cms-logo.jpeg" alt="Logotipo do Conselho Municipal de Saúde de Chapada dos Guimarães" width={112} height={112} priority className="rounded-2xl bg-[#fffbed] p-2 shadow-lg" />
          <p className="mt-7 text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">Conselho Municipal de Saúde</p>
          <h1 className="mt-3 text-4xl font-bold md:text-5xl">Chapada dos Guimarães – MT</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-100">Participação social, transparência e acompanhamento das políticas públicas de saúde.</p>
          <a href={process.env.NEXT_PUBLIC_KOS_URL ?? "https://kos.chapada.ia.br"} className="mt-8 inline-flex rounded-lg bg-amber-400 px-6 py-3 font-semibold text-slate-950 hover:bg-amber-300">Consultar o KOS</a>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Link key={card.title} href={card.href} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <h2 className="text-xl font-semibold">{card.title}</h2>
              <p className="mt-3 text-slate-600">{card.description}</p>
              <span className="mt-6 inline-block text-sm font-semibold text-emerald-800">Acessar →</span>
            </Link>
          ))}
        </div>
      </section>
      <footer className="border-t bg-white"><div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-6 text-sm text-slate-500"><Image src="/cms-logo.jpeg" alt="Logotipo do Conselho Municipal de Saúde" width={64} height={64} className="rounded-lg" /><p>Conselho Municipal de Saúde de Chapada dos Guimarães – MT</p></div></footer>
    </main>
  );
}
