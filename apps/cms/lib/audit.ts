import { Pool } from "pg";

export type AuditEntry = {
  id: string;
  entityType: "document" | "conference_proposal" | string;
  entityId: string;
  entityLabel: string;
  action: string;
  details: Record<string, unknown>;
  actorName: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  createdAt: string;
};

let pool: Pool | undefined;

function database() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 2, idleTimeoutMillis: 10_000 });
  return pool;
}

export async function listAuditEntries(entityType: string | null, page: number, pageSize = 30, includeReceivedProtocols = false) {
  const selectedType = ["document", "received_protocol", "conference_proposal", "user", "kos_analysis"].includes(entityType ?? "") ? entityType : null;
  const values: Array<string | number> = [];
  const conditions: string[] = [];
  if (selectedType) conditions.push(`log.entity_type = $${values.push(selectedType)}`);
  if (!includeReceivedProtocols) conditions.push("log.entity_type NOT IN ('received_protocol', 'kos_analysis')");
  const condition = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const offset = (page - 1) * pageSize;
  values.push(pageSize, offset);
  const limitParameter = `$${values.length - 1}`;
  const offsetParameter = `$${values.length}`;
  const entries = await database().query<AuditEntry>(
    `SELECT log.id, log.entity_type AS "entityType", log.entity_id AS "entityId",
       COALESCE(document.title,
         CASE WHEN received.id IS NOT NULL THEN received.protocol_number || ' · ' || received.subject END,
         CASE WHEN proposal.id IS NOT NULL THEN CONCAT('Eixo ', axis.ordinal, ' · Proposta ', proposal.ordinal) END,
         CASE WHEN account.id IS NOT NULL THEN account.full_name END,
         CASE WHEN kos_analysis.id IS NOT NULL THEN protocol.protocol_number || ' · Análise KOS' END,
         'Registro institucional') AS "entityLabel",
       log.action, log.details, log.actor_name AS "actorName", log.actor_email AS "actorEmail",
       log.actor_role::text AS "actorRole", log.created_at::text AS "createdAt"
     FROM audit_logs log
     LEFT JOIN documents document ON log.entity_type = 'document' AND document.id = log.entity_id
     LEFT JOIN received_protocols received ON log.entity_type = 'received_protocol' AND received.id = log.entity_id
     LEFT JOIN conference_proposals proposal ON log.entity_type = 'conference_proposal' AND proposal.id = log.entity_id
     LEFT JOIN conference_axes axis ON axis.id = proposal.axis_id
     LEFT JOIN cms_users account ON log.entity_type = 'user' AND account.id = log.entity_id
     LEFT JOIN kos_document_analyses kos_analysis ON log.entity_type = 'kos_analysis' AND kos_analysis.id = log.entity_id
     LEFT JOIN received_protocols protocol ON protocol.id = kos_analysis.protocol_id
     ${condition}
     ORDER BY log.created_at DESC
     LIMIT ${limitParameter} OFFSET ${offsetParameter}`,
    values,
  );
  const countValues = selectedType ? [selectedType] : [];
  const count = await database().query<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM audit_logs log ${condition}`,
    countValues,
  );
  return { entries: entries.rows, total: Number(count.rows[0]?.total ?? 0), pageSize };
}
