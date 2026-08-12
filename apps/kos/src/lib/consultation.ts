import { Pool } from "pg";

let pool: Pool | undefined;

function database() {
  if (!process.env.DATABASE_URL) return null;
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 2, idleTimeoutMillis: 10_000 });
  return pool;
}

export type ConsultationResult = { title: string; proposalText: string; pmsStatus: string | null; pmsReference: string | null; pasStatus: string | null; pasReference: string | null };

export async function searchInstitutionalBase(term: string): Promise<ConsultationResult[]> {
  const connection = database();
  if (!connection || !term.trim()) return [];
  const words = term.trim().split(/\s+/).slice(0, 8).join(" & ");
  const result = await connection.query<ConsultationResult>(
    `SELECT proposal.title, proposal.proposal_text AS "proposalText",
      MAX(link.status::text) FILTER (WHERE link.health_plan_id IS NOT NULL) AS "pmsStatus",
      MAX(link.source_reference) FILTER (WHERE link.health_plan_id IS NOT NULL) AS "pmsReference",
      MAX(link.status::text) FILTER (WHERE link.annual_program_id IS NOT NULL) AS "pasStatus",
      MAX(link.source_reference) FILTER (WHERE link.annual_program_id IS NOT NULL) AS "pasReference"
     FROM conference_proposals proposal
     LEFT JOIN traceability_links link ON link.conference_proposal_id = proposal.id
     WHERE to_tsvector('portuguese', proposal.title || ' ' || proposal.proposal_text) @@ to_tsquery('portuguese', $1)
     GROUP BY proposal.id, proposal.title, proposal.proposal_text
     ORDER BY ts_rank(to_tsvector('portuguese', proposal.title || ' ' || proposal.proposal_text), to_tsquery('portuguese', $1)) DESC
     LIMIT 6`,
    [words],
  );
  return result.rows;
}
