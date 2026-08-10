const cards = [
  { title: "9ª Conferência Municipal de Saúde", description: "Propostas, deliberações e acompanhamento." },
  { title: "PMS 2026–2029", description: "Plano Municipal de Saúde." },
  { title: "PAS 2026", description: "Programação Anual de Saúde." },
  { title: "Reuniões", description: "Pautas, atas e deliberações do Conselho." },
  { title: "Documentos", description: "Biblioteca institucional do CMS." },
  { title: "KOS", description: "Inteligência técnico-institucional." },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-emerald-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">Conselho Municipal de Saúde</p>
          <h1 className="mt-3 text-4xl font-bold md:text-5xl">Chapada dos Guimarães – MT</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-100">Participação social, transparência e acompanhamento das políticas públicas de saúde.</p>
          <a href="http://localhost:3001" className="mt-8 inline-flex rounded-lg bg-amber-400 px-6 py-3 font-semibold text-slate-950 hover:bg-amber-300">Consultar o KOS</a>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <article key={card.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <h2 className="text-xl font-semibold">{card.title}</h2>
              <p className="mt-3 text-slate-600">{card.description}</p>
              <span className="mt-6 inline-block text-sm font-semibold text-emerald-800">Acessar →</span>
            </article>
          ))}
        </div>
      </section>
      <footer className="border-t bg-white"><div className="mx-auto max-w-7xl px-6 py-8 text-sm text-slate-500">Conselho Municipal de Saúde de Chapada dos Guimarães – MT</div></footer>
    </main>
  );
}
