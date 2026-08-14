import Image from "next/image";
import Link from "next/link";

export const metadata = { title: "Solicitar cadastro | CMS", robots: { index: false, follow: false } };

export default async function RegistrationPage({ searchParams }: { searchParams: Promise<{ erro?: string; email?: string; origem?: string }> }) {
  const { erro, email = "", origem } = await searchParams;
  return <main className="grid min-h-screen place-items-center bg-[#f2f7fb] p-6 text-slate-900"><section className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-7 shadow-xl sm:p-9">
    <Link href="/" className="flex items-center gap-3"><Image src="/cms-logo.jpeg" alt="Logotipo do CMS" width={52} height={52} className="rounded-xl" /><strong className="text-emerald-950">Conselho Municipal de Saúde</strong></Link>
    <p className="mt-8 text-sm font-bold uppercase tracking-[.15em] text-emerald-700">Solicitação de acesso</p><h1 className="mt-2 text-3xl font-bold text-emerald-950">Cadastro de membro do Conselho</h1>
    <p className="mt-3 leading-7 text-slate-600">Preencha os dados institucionais. O acesso só será liberado após a confirmação e aprovação do Presidente do CMS.</p>
    {origem === "recuperacao" ? <p className="mt-5 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm font-bold text-sky-800">Não localizamos um cadastro ativo para este e-mail. Preencha a solicitação abaixo para que o Presidente do CMS possa avaliar seu acesso.</p> : null}{erro ? <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">{erro === "existente" ? "Este e-mail já possui cadastro ou solicitação. Use a recuperação de senha ou aguarde a aprovação." : "Não foi possível enviar. Confira os campos e tente novamente."}</p> : null}
    <form method="post" action="/api/admin/cadastro" className="mt-7 grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">Nome completo<input name="fullName" required minLength={3} maxLength={160} autoComplete="name" className="input" /></label>
      <label className="grid gap-2 text-sm font-bold text-slate-700">E-mail<input name="email" type="email" required maxLength={254} autoComplete="email" defaultValue={email} className="input" /></label>
      <label className="grid gap-2 text-sm font-bold text-slate-700">Função no Conselho<input name="councilPosition" required maxLength={160} placeholder="Ex.: Conselheiro titular" className="input" /></label>
      <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">Segmento representado<input name="councilSegment" maxLength={160} placeholder="Ex.: Usuários do SUS, trabalhadores ou gestão" className="input" /></label>
      <label className="grid gap-2 text-sm font-bold text-slate-700">Senha<input name="password" type="password" required minLength={10} maxLength={128} autoComplete="new-password" className="input" /></label>
      <label className="grid gap-2 text-sm font-bold text-slate-700">Confirmar senha<input name="passwordConfirmation" type="password" required minLength={10} maxLength={128} autoComplete="new-password" className="input" /></label></div>
      <p className="text-xs leading-5 text-slate-500">Use pelo menos 10 caracteres, com letra maiúscula, letra minúscula e número.</p>
      <button className="w-fit rounded-xl bg-emerald-800 px-6 py-3 font-bold text-white hover:bg-emerald-700">Enviar para aprovação</button>
    </form><Link href="/admin/login" className="mt-6 inline-flex text-sm font-bold text-emerald-800">← Voltar ao acesso</Link>
  </section></main>;
}
