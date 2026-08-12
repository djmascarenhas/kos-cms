import { Pool } from "pg";

export type ProposalDetail = {
  axisOrdinal: number;
  axisTitle: string;
  proposalOrdinal: number;
  title: string;
  proposalText: string;
  responsibleSphere: string | null;
  deadlineText: string | null;
  approvalNotes: string | null;
  sourcePage: number | null;
  monitoringStatus: "awaiting_information" | "under_analysis" | "in_progress" | "completed" | "suspended";
  responsibleName: string | null;
  expectedCompletion: string | null;
  progressPercent: number;
  publicNotes: string | null;
  updatedAt: string | null;
  pmsStatus: string | null;
  pmsRationale: string | null;
  pmsReference: string | null;
  pasStatus: string | null;
  pasRationale: string | null;
  pasReference: string | null;
};

let pool: Pool | undefined;

function database() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 2, idleTimeoutMillis: 10_000 });
  return pool;
}

export function proposalSlug(axisOrdinal: number, proposalOrdinal: number) {
  return `eixo-${axisOrdinal}-proposta-${proposalOrdinal}`;
}

export async function getProposalBySlug(slug: string): Promise<ProposalDetail | null> {
  const match = /^eixo-(\d+)-proposta-(\d+)$/.exec(slug);
  if (!match) return null;
  const result = await database().query<ProposalDetail>(
    `SELECT axis.ordinal::int AS "axisOrdinal", axis.title AS "axisTitle",
      proposal.ordinal::int AS "proposalOrdinal", proposal.title,
      proposal.proposal_text AS "proposalText", proposal.responsible_sphere AS "responsibleSphere",
      proposal.deadline_text AS "deadlineText", proposal.approval_notes AS "approvalNotes",
      proposal.source_page::int AS "sourcePage",
      COALESCE(monitoring.status::text, 'awaiting_information') AS "monitoringStatus",
      monitoring.responsible_name AS "responsibleName",
      monitoring.expected_completion::text AS "expectedCompletion",
      COALESCE(monitoring.progress_percent, 0)::int AS "progressPercent",
      monitoring.public_notes AS "publicNotes", monitoring.updated_at::text AS "updatedAt",
      MAX(link.status::text) FILTER (WHERE link.health_plan_id IS NOT NULL) AS "pmsStatus",
      MAX(link.rationale) FILTER (WHERE link.health_plan_id IS NOT NULL) AS "pmsRationale",
      MAX(link.source_reference) FILTER (WHERE link.health_plan_id IS NOT NULL) AS "pmsReference",
      MAX(link.status::text) FILTER (WHERE link.annual_program_id IS NOT NULL) AS "pasStatus",
      MAX(link.rationale) FILTER (WHERE link.annual_program_id IS NOT NULL) AS "pasRationale",
      MAX(link.source_reference) FILTER (WHERE link.annual_program_id IS NOT NULL) AS "pasReference"
     FROM conference_proposals proposal
     JOIN conference_axes axis ON axis.id = proposal.axis_id
     JOIN conferences conference ON conference.id = proposal.conference_id
     LEFT JOIN proposal_monitoring monitoring ON monitoring.proposal_id = proposal.id
     LEFT JOIN traceability_links link ON link.conference_proposal_id = proposal.id
     WHERE conference.edition = 9 AND axis.ordinal = $1 AND proposal.ordinal = $2
     GROUP BY axis.ordinal, axis.title, proposal.id, monitoring.proposal_id
     LIMIT 1`,
    [Number(match[1]), Number(match[2])],
  );
  return result.rows[0] ?? null;
}
