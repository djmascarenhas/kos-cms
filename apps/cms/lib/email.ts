type PasswordResetEmail = {
  to: string;
  fullName: string;
  resetUrl: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character] ?? character);
}

export async function sendPasswordResetEmail({ to, fullName, resetUrl }: PasswordResetEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new Error("email_not_configured");

  const safeName = escapeHtml(fullName);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "User-Agent": "kos-cms/1.0" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Redefinição de senha — Conselho Municipal de Saúde",
      text: `Olá, ${fullName}.\n\nUse este link para cadastrar uma nova senha: ${resetUrl}\n\nO link expira em 2 minutos e só pode ser usado uma vez. Se você não solicitou esta alteração, ignore esta mensagem.`,
      html: `<main style="font-family:Arial,sans-serif;color:#17375e;line-height:1.6"><h1 style="font-size:22px">Redefinição de senha</h1><p>Olá, ${safeName}.</p><p>Use o botão abaixo para cadastrar uma nova senha no Portal do Conselho Municipal de Saúde.</p><p><a href="${resetUrl}" style="display:inline-block;background:#087f5b;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold">Redefinir minha senha</a></p><p>Este link expira em <strong>2 minutos</strong> e só pode ser usado uma vez.</p><p>Se você não solicitou esta alteração, ignore esta mensagem.</p></main>`,
    }),
  });
  if (!response.ok) throw new Error("email_delivery_failed");
}
