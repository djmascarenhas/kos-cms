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
  Identificada: "bg-emerald-100 text-emerald-900",
  Parcial: "bg-amber-100 text-amber-900",
  "Não localizada": "bg-slate-200 text-slate-700",
};

function Badge({ status }: { status: Status }) { return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeStyle[status]}`}>{status}</span>; }

export default function ConferencePage() {
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
