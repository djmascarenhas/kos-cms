import { PlanningAnalysisPage } from "../../components/planning-analysis";
import { getPlanningAnalysis, type PlanningAnalysis } from "../../lib/planning";

export const dynamic = "force-dynamic";
export const metadata = { title: "PAS 2026 | Conselho Municipal de Saúde" };

export default async function PasPage() {
  let analyses: PlanningAnalysis[] = [];
  let unavailable = false;
  try {
    analyses = await getPlanningAnalysis("pas");
  } catch {
    unavailable = true;
  }
  return <PlanningAnalysisPage kind="pas" analyses={analyses} unavailable={unavailable} />;
}
