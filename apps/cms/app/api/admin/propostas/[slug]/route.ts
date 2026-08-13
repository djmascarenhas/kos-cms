import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../../lib/session";
import { updateProposalMonitoring, type ProposalDetail } from "../../../../../lib/proposal";
import { hasRole } from "../../../../../lib/users";

const allowedStatuses: ProposalDetail["monitoringStatus"][] = ["awaiting_information", "under_analysis", "in_progress", "completed", "suspended"];

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getAdminSession();
  const origin = process.env.CMS_URL ?? "https://cms.chapada.ia.br";
  if (!session) return NextResponse.redirect(new URL("/admin/login", origin), 303);
  if (!hasRole(session, "gestao")) return NextResponse.redirect(new URL("/admin?acesso=negado", origin), 303);
  const { slug } = await params;
  const formData = await request.formData();
  const status = String(formData.get("status") ?? "") as ProposalDetail["monitoringStatus"];
  const progressPercent = Number(formData.get("progressPercent"));
  const responsibleName = String(formData.get("responsibleName") ?? "").trim();
  const expectedCompletion = String(formData.get("expectedCompletion") ?? "").trim();
  const publicNotes = String(formData.get("publicNotes") ?? "").trim();
  if (!allowedStatuses.includes(status) || !Number.isInteger(progressPercent) || progressPercent < 0 || progressPercent > 100 || responsibleName.length > 200 || publicNotes.length > 2000 || (expectedCompletion && !/^\d{4}-\d{2}-\d{2}$/.test(expectedCompletion))) return NextResponse.redirect(new URL(`/admin/propostas/${slug}?error=1`, origin), 303);
  try {
    await updateProposalMonitoring(slug, { status, responsibleName: responsibleName || null, expectedCompletion: expectedCompletion || null, progressPercent, publicNotes: publicNotes || null, updatedBy: session.email });
    return NextResponse.redirect(new URL(`/admin/propostas/${slug}?saved=1`, origin), 303);
  } catch {
    return NextResponse.redirect(new URL(`/admin/propostas/${slug}?error=1`, origin), 303);
  }
}
