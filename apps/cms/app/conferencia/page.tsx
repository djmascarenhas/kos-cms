import Image from "next/image";
import Link from "next/link";

type Status = "Identificada" | "Parcial" | "Não localizada";

const proposals: { axis: string; title: string; pms: Status; pas: Status }[] = [
  { axis: "Eixo I", title: "Concurso para ACS e ACE", pms: "Parcial", pas: "Parcial" },
  { axis: "Eixo I", title: "Centro de Especialidades Odontológicas", pms: "Parcial", pas: "Parcial" },
  { axis: "Eixo I", title: "Pontos de Atendimento à Saúde", pms: "Parcial", pas: "Não localizada" },
  { axis: "Eixo I", title: "Novo prédio para a UBS Olho D’Água", pms: "Parcial", pas: "Não localizada" },
  { axis: "Eixo I", title: "Reuniões comunitárias periódicas", pms: "Parcial", pas: "Parcial" },
  { axis: "Eixo II", title: "Transporte coletivo municipal", pms: "Não localizada", pas: "Não localizada" },
  { axis: "Eixo II", title: "Estrutura laboratorial 24 horas", pms: "Parcial", pas: "Parcial" },
  { axis: "Eixo II", title: "Dispensação de medicamentos 24 horas", pms: "Parcial", pas: "Parcial" },
  { axis: "Eixo II", title: "Credenciamento da UBS Aldeia Velha", pms: "Não localizada", pas: "Não localizada" },
  { axis: "Eixo II", title: "Transparência de serviços e exames", pms: "Parcial", pas: "Parcial" },
  { axis: "Eixo III", title: "Legislação para notificações de ACE", pms: "Parcial", pas: "Parcial" },
  { axis: "Eixo III", title: "Centro de Zoonoses", pms: "Parcial", pas: "Parcial" },
  { axis: "Eixo III", title: "Estação de Tratamento de Água e saneamento", pms: "Não localizada", pas: "Parcial" },
  { axis: "Eixo III", title: "Resíduos sólidos e coleta seletiva", pms: "Não localizada", pas: "Não localizada" },
  { axis: "Eixo III", title: "Programa Saúde na Escola", pms: "Parcial", pas: "Parcial" },
  { axis: "Eixo IV", title: "CAPS para saúde do trabalhador público", pms: "Parcial", pas: "Parcial" },
  { axis: "Eixo IV", title: "Instituição de Longa Permanência para Idosos", pms: "Parcial", pas: "Não localizada" },
  { axis: "Eixo IV", title: "Educação Permanente em Saúde", pms: "Parcial", pas: "Parcial" },
  { axis: "Eixo IV", title: "Atendimento interdisciplinar na rede", pms: "Parcial", pas: "Parcial" },
  { axis: "Eixo IV", title: "Programa Melhor em Casa", pms: "Identificada", pas: "Identificada" },
];

const badgeStyle: Record<Status, string> = {
  Identificada: "border border-teal-200 bg-teal-50 text-teal-800",
  Parcial: "border border-sky-200 bg-sky-50 text-sky-800",
  "Não localizada": "border border-slate-200 bg-slate-100 text-slate-700",
};

function Badge({ status }: { status: Status }) { return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeStyle[status]}`}>{status}</span>; }

const axisOrdinals: Record<string, number> = { "Eixo I": 1, "Eixo II": 2, "Eixo III": 3, "Eixo IV": 4 };

function proposalHref(proposal: { axis: string; title: string }) {
  const axisOrdinal = axisOrdinals[proposal.axis];
  const proposalOrdinal = proposals.filter((item) => item.axis === proposal.axis).findIndex((item) => item.title === proposal.title) + 1;
  return `/propostas/eixo-${axisOrdinal}-proposta-${proposalOrdinal}`;
}

// Legacy layout retained temporarily as a reference during the visual transition.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LegacyConferencePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-emerald-950 text-white"><div className="mx-auto max-w-6xl px-6 py-10"><Link href="/" className="text-sm font-semibold text-emerald-300 hover:text-white">← Portal do CMS</Link><p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">9ª Conferência Municipal de Saúde</p><h1 className="mt-3 text-4xl font-bold">Propostas e rastreabilidade</h1><p className="mt-4 max-w-3xl text-emerald-100">As 20 propostas aprovadas foram comparadas com o PMS 2026–2029 e a PAS 2026. A classificação é documental: “não localizada” indica ausência de previsão específica identificada nos instrumentos analisados.</p></div></header>
      <section className="mx-auto max-w-6xl px-6 py-10"><div className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl bg-white p-5 shadow-sm"><strong className="text-3xl">20</strong><p className="mt-1 text-slate-600">propostas aprovadas</p></div><div className="rounded-2xl bg-white p-5 shadow-sm"><strong className="text-3xl">2</strong><p className="mt-1 text-slate-600">vínculos identificados</p></div><div className="rounded-2xl bg-white p-5 shadow-sm"><strong className="text-3xl">40</strong><p className="mt-1 text-slate-600">análises PMS × PAS</p></div></div>
        <div className="mt-10 space-y-8">{["Eixo I", "Eixo II", "Eixo III", "Eixo IV"].map((axis) => <section key={axis}><h2 className="mb-3 text-xl font-bold text-emerald-950">{axis}</h2><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-100 text-slate-600"><tr><th className="p-4">Proposta aprovada</th><th className="p-4">PMS</th><th className="p-4">PAS</th></tr></thead><tbody>{proposals.filter((proposal) => proposal.axis === axis).map((proposal) => <tr key={proposal.title} className="border-t border-slate-100"><td className="p-4 font-medium">{proposal.title}</td><td className="p-4"><Badge status={proposal.pms} /></td><td className="p-4"><Badge status={proposal.pas} /></td></tr>)}</tbody></table></div></section>)}</div>
        <p className="mt-10 text-sm leading-6 text-slate-600">A análise completa, incluindo justificativa e referência de página para cada vínculo, está preservada na base institucional do KOS. O Conselho pode utilizá-la para solicitar manifestação técnica, responsável, prazo e fonte de financiamento para cada proposta.</p>
      </section>
    </main>
  );
}

export default function ConferencePage() {
  return (
    <main className="min-h-screen bg-[#f2f7fb] text-[#40566a]">
      <header className="border-b border-[#cbdce8] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/cms-logo.jpeg" alt="Logotipo do Conselho Municipal de Saude" width={48} height={48} className="rounded-xl" />
            <span><strong className="block text-sm text-[#17375e]">Conselho Municipal de Saude</strong><span className="text-xs text-[#60758a]">Chapada dos Guimaraes - MT</span></span>
          </Link>
          <Link href="/" className="rounded-full border border-[#315f7d] px-4 py-2 text-sm font-semibold text-[#234c68] hover:bg-[#eaf3f8]">Portal CMS</Link>
        </div>
      </header>
      <section className="border-b border-[#c9ddea] bg-gradient-to-br from-[#e9f3f9] via-[#f4f9fc] to-[#e5f1f7]">
        <div className="mx-auto max-w-7xl px-6 py-14 md:py-20">
          <p className="text-sm font-bold uppercase tracking-[.18em] text-[#28738c]">Painel de evidencias</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight text-[#17375e] md:text-5xl">9a Conferencia: propostas com acompanhamento transparente.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#405f73]">As 20 propostas aprovadas foram comparadas com o PMS 2026-2029 e a PAS 2026. A classificacao e documental e torna a consulta simples para conselheiros e comunidade.</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-4 sm:grid-cols-3"><Metric value="20" label="propostas aprovadas" /><Metric value="2" label="vinculos identificados" /><Metric value="40" label="analises PMS e PAS" /></div>
        <div className="mt-8 rounded-2xl border border-[#c9ddea] bg-[#e8f2f8] p-5 text-sm leading-6 text-[#40566a]"><strong className="text-[#234c68]">Como ler:</strong> cada status mostra o nivel de previsao encontrado nos documentos. A cor apoia a leitura, mas o rotulo textual e sempre exibido.</div>
        <div className="mt-10 space-y-9">{["Eixo I", "Eixo II", "Eixo III", "Eixo IV"].map((axis) => <section key={axis}><div className="mb-3 flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#dcecf5] text-sm font-bold text-[#1f5872]">{axis.slice(-1)}</span><h2 className="text-xl font-bold text-[#1f5872]">{axis}</h2></div><div className="overflow-x-auto rounded-2xl border border-[#d5e3ec] bg-white shadow-[0_8px_24px_rgba(31,88,114,.06)]"><table className="min-w-[620px] w-full text-left text-sm"><thead className="bg-[#e8f2f8] text-[#36566c]"><tr><th className="p-4">Proposta aprovada</th><th className="p-4">PMS</th><th className="p-4">PAS</th></tr></thead><tbody>{proposals.filter((proposal) => proposal.axis === axis).map((proposal) => <tr key={proposal.title} className="border-t border-[#e2ebf1]"><td className="p-4 font-semibold text-[#29465b]"><Link href={proposalHref(proposal)} className="hover:text-[#28738c] hover:underline">{proposal.title}</Link></td><td className="p-4"><Badge status={proposal.pms} /></td><td className="p-4"><Badge status={proposal.pas} /></td></tr>)}</tbody></table></div></section>)}</div>
        <div className="mt-10 rounded-2xl border border-[#d5e3ec] bg-white p-6 shadow-[0_8px_24px_rgba(31,88,114,.06)]"><p className="font-bold text-[#17375e]">Base para acompanhamento</p><p className="mt-2 max-w-4xl text-sm leading-6 text-[#40566a]">A analise completa, com justificativa e referencia de pagina para cada vinculo, esta preservada na base institucional do KOS. O Conselho pode solicitar manifestacao tecnica, responsavel, prazo e fonte de financiamento para cada proposta.</p><a href="https://kos.chapada.ia.br" className="mt-4 inline-flex font-bold text-[#28738c] hover:text-[#1f5872]">Abrir o KOS para consulta -&gt;</a></div>
      </section>
      <Footer />
    </main>
  );
}

function Metric({ value, label }: { value: string; label: string }) { return <div className="rounded-2xl border border-[#d5e3ec] bg-white p-6 shadow-[0_8px_24px_rgba(31,88,114,.06)]"><strong className="text-3xl text-[#17375e]">{value}</strong><p className="mt-1 text-[#60758a]">{label}</p></div>; }

function Footer() { return <footer className="bg-[#17375e] text-[#eaf3f8]"><div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-[1.3fr_1fr_1fr]"><div className="flex gap-4"><Image src="/cms-logo.jpeg" alt="Logotipo do Conselho Municipal de Saude" width={72} height={72} className="rounded-xl bg-[#fffbed] p-1" /><div><p className="font-bold text-white">Conselho Municipal de Saude</p><p className="mt-2 text-sm leading-6 text-[#cbdce8]">Chapada dos Guimaraes - MT<br />Participacao social e defesa do SUS.</p></div></div><div><p className="font-bold text-white">Acesso rapido</p><div className="mt-3 grid gap-2 text-sm text-[#cbdce8]"><Link href="/" className="hover:text-white">Portal institucional</Link><Link href="/pms-2026-2029" className="hover:text-white">PMS 2026-2029</Link><Link href="/pas-2026" className="hover:text-white">PAS 2026</Link><a href="https://kos.chapada.ia.br" className="hover:text-white">Consultar o KOS</a></div></div><div><p className="font-bold text-white">Contato institucional</p><div className="mt-3 grid gap-2 text-sm text-[#cbdce8]"><a className="hover:text-white" href="tel:+5565992326757">(65) 99232-6757</a><a className="hover:text-white" href="mailto:secsaude@chapadadosguimaraes.mt.gov.br">secsaude@chapadadosguimaraes.mt.gov.br</a><p>Rua E, s/n - Santa Cruz</p></div></div></div><div className="border-t border-[#315f7d] px-6 py-4 text-center text-xs text-[#b9cfdd]">Conselho Municipal de Saude de Chapada dos Guimaraes.</div></footer>; }
