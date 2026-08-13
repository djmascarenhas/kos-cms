import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "./site-utilities";

const navigation = [
  { href: "/documentos", label: "Documentos" },
  { href: "/conferencia", label: "9ª Conferência" },
  { href: "/pms-2026-2029", label: "PMS 2026–2029" },
  { href: "/pas-2026", label: "PAS 2026" },
  { href: "/admin/login", label: "Área administrativa" },
];

const whatsappUrl = "https://wa.me/5565992326757";

export function PublicHeader() {
  return <header className="border-b border-[#cbdce8] bg-white text-[#40566a] shadow-[0_2px_12px_rgba(31,88,114,.04)]">
    <a href="#conteudo-principal" className="sr-only z-50 rounded-lg bg-white px-4 py-2 font-bold text-[#17375e] focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Ir para o conteúdo</a>
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 sm:px-6">
      <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Página inicial do Conselho Municipal de Saúde">
        <Image src="/cms-logo.jpeg" alt="" width={52} height={52} priority className="h-13 w-13 shrink-0 rounded-xl bg-[#fffbed] object-cover p-0.5" />
        <span className="min-w-0"><strong className="block text-sm text-[#17375e] sm:text-base">Conselho Municipal de Saúde</strong><span className="block truncate text-xs text-[#60758a] sm:text-sm">Chapada dos Guimarães – MT</span></span>
        <span className="hidden h-12 w-px shrink-0 bg-[#cbdce8] sm:block" aria-hidden="true" />
        <span className="hidden h-12 w-[180px] overflow-hidden rounded-lg sm:block xl:w-[220px]"><Image src="/secretaria-saude-colorida.png" alt="Secretaria Municipal de Saúde de Chapada dos Guimarães" width={220} height={79} priority className="h-full w-full scale-[1.18] object-cover" /></span>
      </Link>
      <div className="hidden items-center gap-2 xl:flex"><nav aria-label="Navegação principal" className="flex items-center gap-1">{navigation.map((item) => <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm font-semibold text-[#315f7d] hover:bg-[#eaf3f8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315f7d]">{item.label}</Link>)}<a href={whatsappUrl} target="_blank" rel="noreferrer" className="ml-2 rounded-full bg-[#087f5b] px-4 py-2 text-sm font-bold text-white hover:bg-[#066b4d]">WhatsApp</a></nav><ThemeToggle compact /></div>
      <div className="flex items-center gap-2 xl:hidden"><ThemeToggle compact /><details className="relative"><summary className="cursor-pointer list-none rounded-xl border border-[#9db9ca] px-3 py-2 text-sm font-bold text-[#315f7d]">Menu</summary><nav aria-label="Navegação para celular" className="absolute right-0 z-40 mt-3 grid w-64 gap-1 rounded-2xl border border-[#d5e3ec] bg-white p-3 shadow-xl">{navigation.map((item) => <Link key={item.href} href={item.href} className="rounded-lg px-3 py-3 font-semibold hover:bg-[#eaf3f8]">{item.label}</Link>)}<a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-1 rounded-lg bg-[#087f5b] px-3 py-3 text-center font-bold text-white">Falar pelo WhatsApp</a></nav></details></div>
    </div>
  </header>;
}

export function PublicFooter() {
  return <footer className="bg-[#17375e] text-[#eaf3f8]">
    <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-[1.25fr_1fr_1fr]">
      <div className="flex items-start gap-4"><div className="grid shrink-0 gap-2"><Image src="/cms-logo.jpeg" alt="Logotipo do Conselho Municipal de Saúde" width={72} height={72} className="rounded-xl bg-[#fffbed] p-1" /><span className="block h-12 w-[170px] overflow-hidden rounded-lg bg-white"><Image src="/secretaria-saude-colorida.png" alt="Secretaria Municipal de Saúde de Chapada dos Guimarães" width={170} height={61} className="h-full w-full scale-[1.18] object-cover" /></span></div><div><p className="font-bold text-white">Conselho Municipal de Saúde</p><p className="mt-2 text-sm leading-6 text-[#cbdce8]">Chapada dos Guimarães – MT<br />Participação social, transparência e defesa do SUS.</p></div></div>
      <div><p className="font-bold text-white">Acesso rápido</p><nav aria-label="Links do rodapé" className="mt-3 grid gap-2 text-sm text-[#cbdce8]">{navigation.map((item) => <Link key={item.href} href={item.href} className={item.href.startsWith("/admin") ? "mt-1 w-fit rounded-lg border border-[#8bb5cb] px-3 py-2 font-bold text-white hover:bg-white/10" : "w-fit hover:text-white hover:underline"}>{item.label}</Link>)}<a href="https://kos.chapada.ia.br" className="w-fit hover:text-white hover:underline">Consultar o KOS</a></nav></div>
      <div><p className="font-bold text-white">Contato institucional</p><div className="mt-3 grid gap-2 text-sm text-[#cbdce8]"><a href={whatsappUrl} target="_blank" rel="noreferrer" className="w-fit rounded-lg bg-[#087f5b] px-4 py-2 font-bold text-white hover:bg-[#066b4d]">WhatsApp: (65) 99232-6757</a><a href="mailto:secsaude@chapadadosguimaraes.mt.gov.br" className="break-all hover:text-white hover:underline">secsaude@chapadadosguimaraes.mt.gov.br</a><p>Rua E, s/nº – Santa Cruz</p></div></div>
    </div>
    <div className="border-t border-[#315f7d] px-6 py-4 text-center text-xs text-[#b9cfdd]">© {new Date().getFullYear()} Conselho Municipal de Saúde de Chapada dos Guimarães.</div>
  </footer>;
}
