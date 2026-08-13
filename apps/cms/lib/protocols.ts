import { randomBytes } from "node:crypto";
import { Pool } from "pg";
import { hasRole, type UserSession } from "./users";

export const protocolStatuses = [
  "protocolado",
  "triagem",
  "analise_kos",
  "validacao_humana",
  "encaminhado",
  "respondido_deliberado",
  "arquivado",
] as const;

export type ProtocolStatus = (typeof protocolStatuses)[number];
export type ProtocolPriority = "baixa" | "normal" | "alta" | "urgente";
export type ProtocolVisibility = "public" | "internal" | "restricted";
export type ProtocolOriginChannel = "presencial" | "email" | "correios" | "sistema" | "outro";
export type ProtocolLinkRelation = "resposta" | "parecer" | "oficio" | "deliberacao" | "outro";

export const protocolStatusLabels: Record<ProtocolStatus, string> = {
  protocolado: "Protocolado",
  triagem: "Em triagem",
  analise_kos: "Análise do KOS",
  validacao_humana: "Validação humana",
  encaminhado: "Encaminhado",
  respondido_deliberado: "Respondido ou deliberado",
  arquivado: "Arquivado",
};

export type ReceivedProtocol = {
  id: string;
  documentId: string;
  protocolNumber: string;
  protocolYear: number;
  protocolSequence: number;
  receiptCode: string;
  receivedAt: string;
  senderName: string;
  senderOrganization: string | null;
  senderEmail: string | null;
  senderPhone: string | null;
  originChannel: ProtocolOriginChannel;
  subject: string;
  summary: string | null;
  priority: ProtocolPriority;
  responseDueDate: string | null;
  status: ProtocolStatus;
  visibility: ProtocolVisibility;
  assignedArea: string | null;
  responsibleUserId: string | null;
  responsibleName: string | null;
  createdByUserId: string;
  createdByName: string;
  originalFilename: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  storagePath: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProtocolEvent = {
  id: string;
  previousStatus: ProtocolStatus | null;
  newStatus: ProtocolStatus;
  notes: string | null;
  assignedArea: string | null;
  responsibleName: string | null;
  actorName: string;
  actorRole: string;
  createdAt: string;
};

export type ProtocolDocumentLink = {
  id: string;
  documentId: string;
  documentTitle: string;
  relation: ProtocolLinkRelation;
  notes: string | null;
  createdAt: string;
};

export type ProtocolUser = { id: string; fullName: string; role: string };
export type LinkableDocument = { id: string; title: string; documentNumber: string | null };
export type RequestAudit = { ip: string | null; userAgent: string | null };

let readerPool: Pool | undefined;
let editorPool: Pool | undefined;

function reader() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  readerPool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 2, idleTimeoutMillis: 10_000 });
  return readerPool;
}

function editor() {
  const connectionString = process.env.ADMIN_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error("ADMIN_DATABASE_URL is not configured");
  editorPool ??= new Pool({ connectionString, max: 2, idleTimeoutMillis: 10_000 });
  return editorPool;
}

const protocolSelect = `SELECT protocol.id, protocol.document_id AS "documentId",
  protocol.protocol_number AS "protocolNumber", protocol.protocol_year::int AS "protocolYear",
  protocol.protocol_sequence::int AS "protocolSequence", protocol.receipt_code AS "receiptCode",
  protocol.received_at::text AS "receivedAt", protocol.sender_name AS "senderName",
  protocol.sender_organization AS "senderOrganization", protocol.sender_email AS "senderEmail",
  protocol.sender_phone AS "senderPhone", protocol.origin_channel::text AS "originChannel",
  protocol.subject, protocol.summary, protocol.priority::text AS priority,
  protocol.response_due_date::text AS "responseDueDate", protocol.status::text AS status,
  protocol.visibility::text AS visibility, protocol.assigned_area AS "assignedArea",
  protocol.responsible_user_id AS "responsibleUserId", responsible.full_name AS "responsibleName",
  protocol.created_by_user_id AS "createdByUserId", creator.full_name AS "createdByName",
  document.original_filename AS "originalFilename", document.mime_type AS "mimeType",
  document.file_size_bytes::float8 AS "fileSizeBytes", document.storage_path AS "storagePath",
  protocol.created_at::text AS "createdAt", protocol.updated_at::text AS "updatedAt"
  FROM received_protocols protocol
  JOIN documents document ON document.id = protocol.document_id
  JOIN cms_users creator ON creator.id = protocol.created_by_user_id
  LEFT JOIN cms_users responsible ON responsible.id = protocol.responsible_user_id`;

function accessCondition(actor: UserSession, startIndex = 1) {
  return hasRole(actor, "gestao") ? { sql: "", values: [] as string[] } : {
    sql: `protocol.created_by_user_id = $${startIndex}`,
    values: [actor.id],
  };
}

export async function listReceivedProtocols(actor: UserSession) {
  const access = accessCondition(actor);
  return (await reader().query<ReceivedProtocol>(
    `${protocolSelect} ${access.sql ? `WHERE ${access.sql}` : ""}
     ORDER BY CASE WHEN protocol.status = 'arquivado' THEN 1 ELSE 0 END,
       protocol.response_due_date ASC NULLS LAST, protocol.created_at DESC`,
    access.values,
  )).rows;
}

export async function getReceivedProtocol(id: string, actor: UserSession) {
  const access = accessCondition(actor, 2);
  const protocol = (await reader().query<ReceivedProtocol>(
    `${protocolSelect} WHERE protocol.id = $1 ${access.sql ? `AND ${access.sql}` : ""}`,
    [id, ...access.values],
  )).rows[0] ?? null;
  if (!protocol) return null;

  const [events, links] = await Promise.all([
    reader().query<ProtocolEvent>(
      `SELECT event.id, event.previous_status::text AS "previousStatus",
       event.new_status::text AS "newStatus", event.notes, event.assigned_area AS "assignedArea",
       responsible.full_name AS "responsibleName", actor.full_name AS "actorName",
       actor.role::text AS "actorRole", event.created_at::text AS "createdAt"
       FROM received_protocol_events event
       JOIN cms_users actor ON actor.id = event.created_by_user_id
       LEFT JOIN cms_users responsible ON responsible.id = event.responsible_user_id
       WHERE event.protocol_id = $1 ORDER BY event.created_at DESC`,
      [id],
    ),
    reader().query<ProtocolDocumentLink>(
      `SELECT link.id, link.linked_document_id AS "documentId", document.title AS "documentTitle",
       link.relation::text AS relation, link.notes, link.created_at::text AS "createdAt"
       FROM received_protocol_document_links link
       JOIN documents document ON document.id = link.linked_document_id
       WHERE link.protocol_id = $1 ORDER BY link.created_at DESC`,
      [id],
    ),
  ]);
  return { protocol, events: events.rows, links: links.rows };
}

export async function listProtocolUsers() {
  return (await reader().query<ProtocolUser>(
    `SELECT id, full_name AS "fullName", role::text AS role FROM cms_users
     WHERE status = 'ativo' AND role <> 'publico' ORDER BY full_name`,
  )).rows;
}

export async function listLinkableDocuments(excludeDocumentId: string) {
  return (await reader().query<LinkableDocument>(
    `SELECT id, title, document_number AS "documentNumber" FROM documents
     WHERE id <> $1 ORDER BY created_at DESC LIMIT 250`,
    [excludeDocumentId],
  )).rows;
}

export type NewReceivedProtocol = {
  receivedAt: string;
  senderName: string;
  senderOrganization: string | null;
  senderEmail: string | null;
  senderPhone: string | null;
  originChannel: ProtocolOriginChannel;
  subject: string;
  summary: string | null;
  priority: ProtocolPriority;
  responseDueDate: string | null;
  visibility: ProtocolVisibility;
  storagePath: string;
  sha256: string;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  actor: UserSession;
  requestAudit: RequestAudit;
};

export async function createReceivedProtocol(input: NewReceivedProtocol) {
  if (!hasRole(input.actor, "membro_conselho")) throw new Error("Insufficient role");
  const connection = await editor().connect();
  try {
    await connection.query("BEGIN");
    const year = Number(input.receivedAt.slice(0, 4));
    const counter = await connection.query<{ number: number }>(
      `INSERT INTO received_protocol_counters (protocol_year, last_number) VALUES ($1, 1)
       ON CONFLICT (protocol_year) DO UPDATE SET last_number = received_protocol_counters.last_number + 1,
       updated_at = NOW() RETURNING last_number::int AS number`,
      [year],
    );
    const sequence = counter.rows[0].number;
    const protocolNumber = `CMS-REC-${year}-${String(sequence).padStart(6, "0")}`;
    const type = await connection.query<{ id: string }>(
      `SELECT id FROM document_types WHERE name = 'Documento Recebido' LIMIT 1`,
    );
    if (!type.rows[0]) throw new Error("Document type not found");
    const document = await connection.query<{ id: string }>(
      `INSERT INTO documents (document_type_id, title, document_number, reference_year, subject,
       description, issuing_body, document_date, status, visibility, source_type, storage_path,
       sha256, created_by_user_id, uploaded_by_user_id, original_filename, mime_type, file_size_bytes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft', $9, 'upload', $10, $11, $12, $12, $13, $14, $15)
       RETURNING id`,
      [type.rows[0].id, `${protocolNumber} — ${input.subject}`, protocolNumber, year, input.subject,
        input.summary, input.senderOrganization ?? input.senderName, input.receivedAt, input.visibility,
        input.storagePath, input.sha256, input.actor.id, input.originalFilename, input.mimeType, input.fileSizeBytes],
    );
    await connection.query(
      `INSERT INTO document_versions (document_id, version_number, storage_path, original_filename,
       mime_type, file_size_bytes, sha256, change_type, change_notes, created_by_user_id)
       VALUES ($1, 1, $2, $3, $4, $5, $6, 'upload_inicial', 'Arquivo recebido e protocolado no CMS.', $7)`,
      [document.rows[0].id, input.storagePath, input.originalFilename, input.mimeType,
        input.fileSizeBytes, input.sha256, input.actor.id],
    );
    const receiptCode = randomBytes(12).toString("hex").toUpperCase();
    const protocol = await connection.query<{ id: string }>(
      `INSERT INTO received_protocols (document_id, protocol_number, protocol_year, protocol_sequence,
       receipt_code, received_at, sender_name, sender_organization, sender_email, sender_phone,
       origin_channel, subject, summary, priority, response_due_date, visibility, created_by_user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING id`,
      [document.rows[0].id, protocolNumber, year, sequence, receiptCode, input.receivedAt,
        input.senderName, input.senderOrganization, input.senderEmail, input.senderPhone,
        input.originChannel, input.subject, input.summary, input.priority, input.responseDueDate,
        input.visibility, input.actor.id],
    );
    await connection.query(
      `INSERT INTO received_protocol_events
       (protocol_id, previous_status, new_status, notes, created_by_user_id)
       VALUES ($1, NULL, 'protocolado', 'Documento recebido e protocolo gerado automaticamente.', $2)`,
      [protocol.rows[0].id, input.actor.id],
    );
    const details = JSON.stringify({ protocolNumber, subject: input.subject, senderName: input.senderName,
      priority: input.priority, responseDueDate: input.responseDueDate, visibility: input.visibility });
    await connection.query(
      `INSERT INTO audit_logs
       (entity_type, entity_id, action, details, actor_user_id, actor_name, actor_email, actor_role, source_ip, user_agent)
       VALUES ('received_protocol', $1, 'received_protocol_created', $2::jsonb, $3, $4, $5, $6, $7::inet, $8)`,
      [protocol.rows[0].id, details, input.actor.id, input.actor.fullName, input.actor.email,
        input.actor.role, input.requestAudit.ip, input.requestAudit.userAgent],
    );
    await connection.query(
      `INSERT INTO audit_logs
       (entity_type, entity_id, action, details, actor_user_id, actor_name, actor_email, actor_role, source_ip, user_agent)
       VALUES ('document', $1, 'document_received_and_protocolled', $2::jsonb, $3, $4, $5, $6, $7::inet, $8)`,
      [document.rows[0].id, details, input.actor.id, input.actor.fullName, input.actor.email,
        input.actor.role, input.requestAudit.ip, input.requestAudit.userAgent],
    );
    await connection.query("COMMIT");
    return { id: protocol.rows[0].id, protocolNumber };
  } catch (error) {
    await connection.query("ROLLBACK");
    throw error;
  } finally { connection.release(); }
}

const allowedTransitions: Record<ProtocolStatus, ProtocolStatus[]> = {
  protocolado: ["triagem"],
  triagem: ["analise_kos", "encaminhado"],
  analise_kos: ["validacao_humana"],
  validacao_humana: ["triagem", "encaminhado"],
  encaminhado: ["triagem", "respondido_deliberado"],
  respondido_deliberado: ["encaminhado", "arquivado"],
  arquivado: [],
};

export function nextProtocolStatuses(current: ProtocolStatus, actor: UserSession) {
  return allowedTransitions[current].filter((status) =>
    !["respondido_deliberado", "arquivado"].includes(status) || hasRole(actor, "diretoria_cms"));
}

export type ProtocolUpdate = {
  status: ProtocolStatus;
  priority: ProtocolPriority;
  responseDueDate: string | null;
  visibility: ProtocolVisibility;
  assignedArea: string | null;
  responsibleUserId: string | null;
  notes: string | null;
  linkedDocumentId: string | null;
  linkRelation: ProtocolLinkRelation | null;
  linkNotes: string | null;
  actor: UserSession;
  requestAudit: RequestAudit;
};

export async function updateReceivedProtocol(id: string, input: ProtocolUpdate) {
  if (!hasRole(input.actor, "gestao")) throw new Error("Insufficient role");
  const connection = await editor().connect();
  try {
    await connection.query("BEGIN");
    const current = await connection.query<{ status: ProtocolStatus; documentId: string; protocolNumber: string }>(
      `SELECT status::text AS status, document_id AS "documentId", protocol_number AS "protocolNumber"
       FROM received_protocols WHERE id = $1 FOR UPDATE`, [id],
    );
    if (!current.rows[0]) throw new Error("Protocol not found");
    const before = current.rows[0].status;
    if (input.status !== before && !allowedTransitions[before].includes(input.status)) throw new Error("Invalid transition");
    if (["respondido_deliberado", "arquivado"].includes(input.status) && !hasRole(input.actor, "diretoria_cms")) {
      throw new Error("Directorate approval required");
    }
    if (input.responsibleUserId) {
      const responsible = await connection.query(`SELECT 1 FROM cms_users WHERE id = $1 AND status = 'ativo' AND role <> 'publico'`, [input.responsibleUserId]);
      if (!responsible.rowCount) throw new Error("Invalid responsible user");
    }
    await connection.query(
      `UPDATE received_protocols SET status = $2, priority = $3, response_due_date = $4,
       visibility = $5, assigned_area = $6, responsible_user_id = $7,
       triaged_by_user_id = CASE WHEN $2 <> 'protocolado' AND triaged_by_user_id IS NULL THEN $8 ELSE triaged_by_user_id END,
       triaged_at = CASE WHEN $2 <> 'protocolado' AND triaged_at IS NULL THEN NOW() ELSE triaged_at END,
       closed_by_user_id = CASE WHEN $2 = 'arquivado' THEN $8 ELSE NULL END,
       closed_at = CASE WHEN $2 = 'arquivado' THEN NOW() ELSE NULL END, updated_at = NOW()
       WHERE id = $1`,
      [id, input.status, input.priority, input.responseDueDate, input.visibility,
        input.assignedArea, input.responsibleUserId, input.actor.id],
    );
    await connection.query(`UPDATE documents SET visibility = $2, updated_at = NOW() WHERE id = $1`,
      [current.rows[0].documentId, input.visibility]);
    await connection.query(
      `INSERT INTO received_protocol_events
       (protocol_id, previous_status, new_status, notes, assigned_area, responsible_user_id, created_by_user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, before, input.status, input.notes, input.assignedArea, input.responsibleUserId, input.actor.id],
    );
    if (input.linkedDocumentId && input.linkRelation) {
      if (input.linkedDocumentId === current.rows[0].documentId) throw new Error("Cannot self-link document");
      const linked = await connection.query(`SELECT 1 FROM documents WHERE id = $1`, [input.linkedDocumentId]);
      if (!linked.rowCount) throw new Error("Linked document not found");
      await connection.query(
        `INSERT INTO received_protocol_document_links
         (protocol_id, linked_document_id, relation, notes, created_by_user_id)
         VALUES ($1, $2, $3, $4, $5) ON CONFLICT (protocol_id, linked_document_id, relation)
         DO UPDATE SET notes = EXCLUDED.notes`,
        [id, input.linkedDocumentId, input.linkRelation, input.linkNotes, input.actor.id],
      );
    }
    await connection.query(
      `INSERT INTO audit_logs
       (entity_type, entity_id, action, details, actor_user_id, actor_name, actor_email, actor_role, source_ip, user_agent)
       VALUES ('received_protocol', $1, 'received_protocol_updated', $2::jsonb, $3, $4, $5, $6, $7::inet, $8)`,
      [id, JSON.stringify({ protocolNumber: current.rows[0].protocolNumber, previousStatus: before,
        status: input.status, priority: input.priority, responseDueDate: input.responseDueDate,
        visibility: input.visibility, assignedArea: input.assignedArea,
        responsibleUserId: input.responsibleUserId, linkedDocumentId: input.linkedDocumentId }),
        input.actor.id, input.actor.fullName, input.actor.email, input.actor.role,
        input.requestAudit.ip, input.requestAudit.userAgent],
    );
    await connection.query("COMMIT");
  } catch (error) {
    await connection.query("ROLLBACK");
    throw error;
  } finally { connection.release(); }
}

export async function getProtocolFile(id: string, actor: UserSession) {
  const result = await getReceivedProtocol(id, actor);
  if (!result?.protocol.storagePath) return null;
  return {
    storagePath: result.protocol.storagePath,
    originalFilename: result.protocol.originalFilename ?? `${result.protocol.protocolNumber}.pdf`,
    mimeType: result.protocol.mimeType ?? "application/octet-stream",
  };
}
