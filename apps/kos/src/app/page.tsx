const actions = ["Consultar documentos", "Comparar documentos", "Conferência × PMS × PAS", "Analisar pauta", "Consultar legislação", "Criar minuta"];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-400">KOS</p>
        <h1 className="mt-4 max-w-4xl text-5xl font-bold leading-tight md:text-6xl">Sabedoria antiga,<span className="text-amber-400"> gestão moderna.</span></h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">Inteligência técnico-institucional do Conselho Municipal de Saúde de Chapada dos Guimarães.</p>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{actions.map((action) => <button key={action} className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 text-left font-medium transition hover:border-amber-400">{action}</button>)}</div>
        <section className="mt-12 rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <label htmlFor="question" className="text-sm font-medium text-slate-300">Pergunte ao KOS</label>
          <textarea id="question" placeholder="Ex.: Quais propostas da 9ª Conferência não estão claramente previstas na PAS 2026?" className="mt-4 min-h-36 w-full resize-none rounded-2xl border border-slate-700 bg-slate-950 p-5 text-white outline-none focus:border-amber-400" />
          <button className="mt-4 rounded-lg bg-amber-400 px-6 py-3 font-semibold text-slate-950 hover:bg-amber-300">Analisar</button>
        </section>
        <p className="mt-8 text-sm leading-6 text-slate-500">O KOS é uma ferramenta de apoio técnico-institucional. Suas análises não substituem as deliberações do Conselho Municipal de Saúde.</p>
      </section>
    </main>
  );
}
