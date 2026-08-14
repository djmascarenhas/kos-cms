import Image from "next/image";
import Link from "next/link";

export const metadata = { title: "Recuperar senha | CMS", robots: { index: false, follow: false } };

const messages: Record<string, string> = {
  validacao: "Informe um endereço de e-mail válido.",
  email: "Não foi possível enviar o e-mail neste momento. Tente novamente em alguns minutos ou procure a Secretaria Executiva.",
};

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return <main className="grid min-h-screen place-items-center bg-[#f2f7fb] p-6 text-slate-900"><section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 shadow-xl sm:p-9">
    <Link href="/" className="flex items-center gap-3"><Image src="/cms-logo.jpeg" alt="Logotipo do CMS" width={52} height={52} className="rounded-xl" /><strong className="text-emerald-950">Conselho Municipal de Saúde</strong></Link>
    <h1 className="mt-8 text-3xl font-bold text-emerald-950">Recuperar senha</h1><p className="mt-3 leading-7 text-slate-600">Informe seu e-mail cadastrado. Enviaremos um link seguro, válido por 2 minutos, para criar uma nova senha.</p>
    {erro ? <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">{messages[erro] ?? messages.validacao}</p> : null}
    <form method="post" action="/api/admin/esqueci-senha" className="mt-7 grid gap-5"><label className="grid gap-2 text-sm font-bold text-slate-700">E-mail cadastrado<input name="email" type="email" required maxLength={254} autoComplete="email" className="input" /></label><button className="rounded-xl bg-emerald-800 px-5 py-3 font-bold text-white hover:bg-emerald-700">Enviar link de recuperação</button></form>
    <p className="mt-5 text-xs leading-5 text-slate-500">Caso o e-mail não esteja cadastrado, você será direcionado para solicitar um novo cadastro.</p><Link href="/admin/login" className="mt-6 inline-flex text-sm font-bold text-emerald-800">← Voltar ao acesso</Link>
  </section></main>;
}
