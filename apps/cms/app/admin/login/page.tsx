import Image from "next/image";
import Link from "next/link";

export const metadata = { title: "Acesso administrativo | Conselho Municipal de Saúde", robots: { index: false, follow: false } };

const errorMessages: Record<string, string> = {
  credenciais: "E-mail ou senha incorretos.",
  pendente: "Seu cadastro ainda aguarda aprovação do Presidente do CMS.",
  suspenso: "Este acesso está suspenso. Procure a Diretoria do CMS.",
  sem_acesso: "Seu cadastro não possui permissão para acessar a área administrativa.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string; cadastro?: string; senha?: string; saiu?: string }> }) {
  const state = await searchParams;
  return <main className="grid min-h-screen place-items-center bg-[#f2f7fb] p-6 text-slate-900">
    <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 shadow-xl sm:p-9">
      <Link href="/" className="flex items-center gap-3"><Image src="/cms-logo.jpeg" alt="Logotipo do Conselho Municipal de Saúde" width={56} height={56} className="rounded-xl" /><span><strong className="block text-sm text-emerald-950">Conselho Municipal de Saúde</strong><span className="text-xs text-slate-600">Área administrativa e gestão documental</span></span></Link>
      <h1 className="mt-8 text-3xl font-bold tracking-tight text-emerald-950">Acesso restrito</h1>
      <p className="mt-3 leading-6 text-slate-600">A gestão documental é exclusiva para membros autorizados do Conselho.</p>
      {state.erro ? <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">{errorMessages[state.erro] ?? errorMessages.credenciais}</p> : null}
      {state.cadastro === "pendente" ? <p className="mt-5 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm font-bold text-teal-800">Cadastro enviado. Aguarde a conferência dos dados e a aprovação do Presidente do CMS antes do primeiro acesso.</p> : null}
      {state.senha === "email_enviado" ? <p className="mt-5 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm font-bold text-sky-800">Enviamos o link de recuperação para seu e-mail. Ele expira em 2 minutos e pode ser usado uma única vez.</p> : null}{state.senha === "alterada" ? <p className="mt-5 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm font-bold text-teal-800">Senha alterada com sucesso. Você já pode entrar.</p> : null}
      {state.saiu ? <p className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700">Sessão encerrada com segurança.</p> : null}
      <form method="post" action="/api/admin/login" className="mt-7 grid gap-4">
        <label className="grid gap-2 text-sm font-bold text-slate-700">E-mail<input name="email" type="email" autoComplete="email" required className="input" /></label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">Senha<input name="password" type="password" autoComplete="current-password" required className="input" /></label>
        <button className="mt-2 rounded-xl bg-emerald-800 px-5 py-3 font-bold text-white hover:bg-emerald-700">Entrar na área administrativa</button>
      </form>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link href="/admin/cadastro" className="rounded-xl border border-emerald-800 px-4 py-3 text-center text-sm font-bold text-emerald-800 hover:bg-emerald-50">Não sou cadastrado</Link>
        <Link href="/admin/esqueci-senha" className="rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-bold text-slate-700 hover:bg-slate-50">Esqueci minha senha</Link>
      </div>
      <p className="mt-5 text-xs leading-5 text-slate-500">Novos cadastros permanecem bloqueados até a aprovação do Presidente do Conselho Municipal de Saúde.</p>
      <Link href="/" className="mt-6 inline-flex text-sm font-semibold text-emerald-800 hover:text-emerald-600">← Voltar ao portal</Link>
    </section>
  </main>;
}
