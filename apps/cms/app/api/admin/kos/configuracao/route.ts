import { isIP } from "node:net";
import { NextResponse } from "next/server";
import { KosAnalysisError, updateKosConfiguration, type KosQuota } from "../../../../../lib/kos-analysis";
import { requireAdmin } from "../../../../../lib/session";
import { userRoles } from "../../../../../lib/users";

function integer(form: FormData, name: string) {
  const value = Number(form.get(name));
  return Number.isInteger(value) && value >= 0 ? value : -1;
}

export async function POST(request: Request) {
  const session = await requireAdmin("master");
  const origin = process.env.CMS_URL ?? "https://cms.chapada.ia.br";
  const form = await request.formData();
  const quotas: KosQuota[] = userRoles.map((role) => ({
    role,
    enabled: form.get(`${role}_enabled`) === "on",
    dailyRequestLimit: integer(form, `${role}_daily`),
    monthlyTokenLimit: integer(form, `${role}_monthly`),
    maxInputTokensPerRequest: integer(form, `${role}_input`),
    maxOutputTokensPerRequest: integer(form, `${role}_output`),
  }));
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  try {
    await updateKosConfiguration({
      enabled: form.get("enabled") === "on",
      monthlyCostLimitUsd: Number(form.get("monthlyCostLimitUsd")),
      quotas,
    }, session, {
      ip: forwarded && isIP(forwarded) ? forwarded : null,
      userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
    });
    return NextResponse.redirect(new URL("/admin/kos?configurada=1", origin), 303);
  } catch (error) {
    const code = error instanceof KosAnalysisError ? error.code : "configuration_error";
    return NextResponse.redirect(new URL(`/admin/kos?error=${encodeURIComponent(code)}`, origin), 303);
  }
}
