import { PlanningAnalysisPage } from "../../components/planning-analysis";
import { getPlanningAnalysis, type PlanningAnalysis } from "../../lib/planning";

export const dynamic = "force-dynamic";
export const metadata = { title: "PMS 2026–2029 | Conselho Municipal de Saúde" };

export default async function PmsPage() {
  let analyses: PlanningAnalysis[] = [];
  let unavailable = false;
  try {
    analyses = await getPlanningAnalysis("pms");
  } catch {
    unavailable = true;
  }
  return <PlanningAnalysisPage kind="pms" analyses={analyses} unavailable={unavailable} />;
}
