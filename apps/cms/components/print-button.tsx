"use client";

export function PrintButton() {
  return <button type="button" onClick={() => window.print()} className="print:hidden rounded-xl bg-[#315f7d] px-5 py-2.5 font-bold text-white hover:bg-[#234c68]">Imprimir recibo</button>;
}
