"use client";

import Image from "next/image";
import Link from "next/link";
type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  localStorage.setItem("kos-theme", theme);
}

export function SiteUtilities() {
  const toggle = () => applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  return <div className="institutional-rail border-b border-[#cbdce8] bg-white text-[#17375e]"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6"><Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3" aria-label="Página inicial do CMS"><Image src="/cms-logo.jpeg" alt="Logotipo do Conselho Municipal de Saúde" width={44} height={44} priority className="h-11 w-11 shrink-0 rounded-lg bg-[#fffbed] object-cover p-0.5" /><span className="h-11 w-px shrink-0 bg-[#cbdce8]" aria-hidden="true" /><span className="block h-11 w-[150px] overflow-hidden rounded-lg sm:w-[250px]"><Image src="/secretaria-saude-colorida.png" alt="Secretaria Municipal de Saúde de Chapada dos Guimarães" width={250} height={90} priority className="h-full w-full scale-[1.18] object-cover" /></span></Link><button type="button" onClick={toggle} aria-label="Alternar entre tema claro e escuro" className="theme-toggle shrink-0 rounded-full border border-[#9db9ca] bg-white px-3 py-2 text-sm font-bold text-[#315f7d] hover:bg-[#eaf3f8]"><span aria-hidden="true">◐</span><span className="ml-2 hidden sm:inline">Claro/escuro</span></button></div></div>;
}
