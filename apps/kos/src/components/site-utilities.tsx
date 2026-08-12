"use client";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  localStorage.setItem("kos-theme", theme);
}

export function ThemeToggle() {
  const toggle = () => applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  return <button type="button" onClick={toggle} aria-label="Alternar entre tema claro e escuro" className="theme-toggle shrink-0 rounded-full border border-[#9db9ca] bg-white px-3 py-2 text-sm font-bold text-[#315f7d]"><span aria-hidden="true">◐</span><span className="ml-2 hidden sm:inline">Claro/escuro</span></button>;
}
