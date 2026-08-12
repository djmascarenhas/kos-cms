export function referencePage(reference: string | null) {
  const match = reference?.match(/\bpp?\.\s*(\d+)/i);
  return match ? Number(match[1]) : null;
}

export function DocumentReference({ reference, documentId }: { reference: string; documentId: string | null }) {
  const page = referencePage(reference);
  if (!documentId) return <span>{reference}</span>;
  const href = `/api/documentos/${documentId}${page ? `#page=${page}` : ""}`;
  return <a href={href} target="_blank" rel="noreferrer" className="font-semibold text-[#28738c] underline decoration-[#9db9ca] underline-offset-2 hover:text-[#17375e]" aria-label={`${reference}. Abrir documento${page ? ` na página ${page}` : ""}`}>{reference} <span aria-hidden="true">↗</span></a>;
}
