import Image from "next/image";
import Link from "next/link";

export const metadata = { title: "Definir nova senha | CMS", robots: { index: false, follow: false } };

const messages: Record<string, string> = {
  validacao: "A senha deve ter ao menos 10 caracteres, incluindo letra maiúscula, minúscula e número; os dois campos devem ser iguais.",
  expirado: "Este link expirou ou já foi utilizado. Solicite um novo link de recuperação.",
  indisponivel: "Não foi possível alterar a senha neste momento. Solicite um novo link.",
};

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; erro?: string }> }) {
  const { token = "", erro } = await searchParams;
  const validToken = /^[A-Za-z0-9_-]{43}$/.test(token);
  return <main className="grid min-h-screen place-items-center bg-[#f2f7fb] p-6 text-slate-900"><section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 shadow-xl sm:p-9">
    <Link href="/" className="flex items-center gap-3"><Image src="/cms-logo.jpeg" alt="Logotipo do CMS" width={52} height={52} className="rounded-xl" /><strong className="text-emerald-950">Conselho Municipal de Saúde</strong></Link>
    <h1 className="mt-8 text-3xl font-bold text-emerald-950">Definir nova senha</h1><p className="mt-3 leading-7 text-slate-600">Escolha uma nova senha. Este link pode ser usado uma única vez.</p>
    {!validToken || erro ? <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">{!validToken ? messages.expirado : messages[erro ?? ""] ?? messages.expirado}</p> : null}
    {validToken && erro !== "expirado" ? <form method="post" action="/api/admin/redefinir-senha" className="mt-7 grid gap-5"><input type="hidden" name="token" value={token} /><label className="grid gap-2 text-sm font-bold text-slate-700">Nova senha<input name="password" type="password" required minLength={10} maxLength={128} autoComplete="new-password" className="input" /></label><label className="grid gap-2 text-sm font-bold text-slate-700">Confirmar nova senha<input name="passwordConfirmation" type="password" required minLength={10} maxLength={128} autoComplete="new-password" className="input" /></label><p className="text-xs text-slate-500">Use ao menos 10 caracteres, incluindo letra maiúscula, minúscula e número.</p><button className="rounded-xl bg-emerald-800 px-5 py-3 font-bold text-white hover:bg-emerald-700">Salvar nova senha</button></form> : null}
    <Link href="/admin/esqueci-senha" className="mt-6 inline-flex text-sm font-bold text-emerald-800">Solicitar novo link</Link>
  </section></main>;
}
