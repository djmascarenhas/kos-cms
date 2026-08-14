import Image from "next/image";
import Link from "next/link";
import { logout } from "./actions";
import { requireAdmin } from "../../lib/session";
import { canApproveUsers, hasRole, roleLabel } from "../../lib/users";

export const metadata = { title: "Administração | Conselho Municipal de Saúde", robots: { index: false, follow: false } };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ acesso?: string }> }) {
  const [session, state] = await Promise.all([requireAdmin(), searchParams]);
  const areas = [
    { number: "01", title: "Gestão documental", description: "Protocolar documentos e consultar autoria, versões, arquivos e histórico completo.", href: "/admin/documentos", action: "Gerenciar documentos", visible: true },
    { number: "02", title: "Documentos recebidos", description: "Protocolar entradas, emitir recibos e acompanhar triagem, responsáveis e prazos.", href: "/admin/protocolos", action: "Abrir caixa de entrada", visible: true },
    { number: "03", title: "Propostas", description: "Atualizar responsáveis, prazos e andamento das propostas aprovadas.", href: "/admin/propostas", action: "Gerenciar propostas", visible: hasRole(session, "gestao") },
    { number: "04", title: "Auditoria", description: "Consultar o histórico institucional de cadastros, acessos e alterações.", href: "/admin/auditoria", action: "Ver histórico", visible: true },
    { number: "05", title: "Usuários e aprovações", description: "Aprovar novos membros, validar recuperações e administrar níveis de acesso.", href: "/admin/usuarios", action: "Gerenciar usuários", visible: canApproveUsers(session) },
    { number: "06", title: "Análises KOS", description: "Solicitar análises documentais, acompanhar consumo e registrar a validação humana.", href: "/admin/kos", action: "Abrir análises", visible: true },
  ].filter((area) => area.visible);
  return <main className="min-h-screen bg-[#f7faf8] text-slate-900">
    <header className="border-b border-emerald-950/10 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4"><div className="flex items-center gap-3"><Image src="/cms-logo.jpeg" alt="Logotipo do Conselho Municipal de Saúde" width={48} height={48} className="rounded-xl" /><div><p className="text-sm font-bold text-emerald-950">Administração do CMS</p><p className="text-xs text-slate-600">{session.fullName} · {roleLabel(session.role)}{session.isCmsPresident ? " · Presidente" : ""}</p></div></div><form action={logout}><button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Sair</button></form></div></header>
    <section className="mx-auto max-w-7xl px-6 py-14">{state.acesso ? <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 font-bold text-red-800">Seu nível de acesso não permite realizar essa operação.</p> : null}<p className="text-sm font-bold uppercase tracking-[.16em] text-emerald-800">Área protegida</p><h1 className="mt-3 text-4xl font-bold tracking-tight text-emerald-950">Painel administrativo</h1><p className="mt-4 max-w-2xl leading-7 text-slate-600">Gerencie documentos conforme seu nível de autorização e acompanhe todas as ações com rastreabilidade.</p>
      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{areas.map((area) => <section key={area.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><span className="text-sm font-bold text-amber-700">{area.number}</span><h2 className="mt-7 text-xl font-bold text-emerald-950">{area.title}</h2><p className="mt-3 leading-7 text-slate-600">{area.description}</p><Link href={area.href} className="mt-6 inline-flex text-sm font-bold text-emerald-800">{area.action} →</Link></section>)}</div>
      <Link href="/" className="mt-10 inline-flex font-bold text-emerald-800 hover:text-emerald-600">Ver portal público →</Link>
    </section>
  </main>;
}
