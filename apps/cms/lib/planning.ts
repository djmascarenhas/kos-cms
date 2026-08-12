import { Pool } from "pg";

export type PlanningKind = "pms" | "pas";
export type TraceabilityStatus = "identified" | "partial" | "not_identified";

export type PlanningAnalysis = {
  axisOrdinal: number;
  axisTitle: string;
  proposalOrdinal: number;
  proposalTitle: string;
  proposalText: string;
  status: TraceabilityStatus;
  rationale: string;
  sourceReference: string | null;
  documentId: string | null;
};

let pool: Pool | undefined;

function database() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 2, idleTimeoutMillis: 10_000 });
  return pool;
}

export async function getPlanningAnalysis(kind: PlanningKind): Promise<PlanningAnalysis[]> {
  const scope = kind === "pms" ? "link.health_plan_id IS NOT NULL" : "link.annual_program_id IS NOT NULL";
  const result = await database().query<PlanningAnalysis>(
    `SELECT axis.ordinal::int AS "axisOrdinal", axis.title AS "axisTitle",
      proposal.ordinal::int AS "proposalOrdinal", proposal.title AS "proposalTitle",
      proposal.proposal_text AS "proposalText", link.status::text AS status,
      link.rationale, link.source_reference AS "sourceReference",
      COALESCE(plan.document_id, program.document_id)::text AS "documentId"
     FROM conference_proposals proposal
     JOIN conference_axes axis ON axis.id = proposal.axis_id
     JOIN conferences conference ON conference.id = proposal.conference_id
     JOIN traceability_links link ON link.conference_proposal_id = proposal.id
     LEFT JOIN health_plans plan ON plan.id = link.health_plan_id
     LEFT JOIN annual_programs program ON program.id = link.annual_program_id
     WHERE conference.edition = 9 AND ${scope}
     ORDER BY axis.ordinal, proposal.ordinal`,
  );
  return result.rows;
}
