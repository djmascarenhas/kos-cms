import { Pool } from "pg";
import { hasRole, type UserSession } from "./users";

export type DocumentType = { id: string; name: string; description: string | null };
export type InstitutionalDocument = {
  id: string;
  typeId: string | null;
  typeName: string;
  title: string;
  documentNumber: string | null;
  referenceYear: number | null;
  description: string | null;
  issuingBody: string | null;
  documentDate: string | null;
  status: "draft" | "published" | "archived";
  visibility: "public" | "restricted" | "internal";
  storagePath: string | null;
  originalFilename: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  sourceType: "upload" | "google_drive" | "external_url" | "manual";
  sourceUrl: string | null;
  driveFileId: string | null;
  drivePath: string | null;
  driveCreatedAt: string | null;
  driveModifiedAt: string | null;
  driveOwnerName: string | null;
  driveOwnerEmail: string | null;
  historicalUploaderName: string | null;
  historicalUploaderEmail: string | null;
  sourceAccessLevel: string | null;
  integrityHashStatus: "pending" | "verified" | "unavailable";
  duplicateReviewStatus: "pending_hash" | "candidate_by_metadata" | "unique_hash" | "confirmed_duplicate" | "not_duplicate";
  createdByName: string | null;
  createdByEmail: string | null;
  uploadedByName: string | null;
  uploadedByEmail: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DocumentHistoryEntry = {
  id: string;
  action: string;
  details: Record<string, unknown>;
  actorName: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  sourceIp: string | null;
  createdAt: string;
};

export type DocumentVersion = {
  id: string;
  versionNumber: number;
  originalFilename: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  sha256: string;
  changeType: string;
  changeNotes: string | null;
  createdByName: string | null;
  createdByEmail: string | null;
  createdAt: string;
};

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

const selectDocuments = `SELECT document.id, document.document_type_id AS "typeId", type.name AS "typeName", document.title,
  document.document_number AS "documentNumber", document.reference_year::int AS "referenceYear",
  document.description, document.issuing_body AS "issuingBody", document.document_date::text AS "documentDate",
  document.status::text AS status, document.visibility::text AS visibility,
  document.storage_path AS "storagePath", document.original_filename AS "originalFilename",
  document.mime_type AS "mimeType", document.file_size_bytes::float8 AS "fileSizeBytes",
  document.source_type::text AS "sourceType", document.source_url AS "sourceUrl",
  document.drive_file_id AS "driveFileId", document.drive_path AS "drivePath",
  document.drive_created_at::text AS "driveCreatedAt", document.drive_modified_at::text AS "driveModifiedAt",
  document.drive_owner_name AS "driveOwnerName", document.drive_owner_email AS "driveOwnerEmail",
  document.historical_uploader_name AS "historicalUploaderName",
  document.historical_uploader_email AS "historicalUploaderEmail",
  document.source_access_level AS "sourceAccessLevel",
  document.integrity_hash_status AS "integrityHashStatus",
  document.duplicate_review_status AS "duplicateReviewStatus",
  creator.full_name AS "createdByName", creator.email AS "createdByEmail",
  uploader.full_name AS "uploadedByName", uploader.email AS "uploadedByEmail",
  document.created_at::text AS "createdAt", document.updated_at::text AS "updatedAt"
  FROM documents document LEFT JOIN document_types type ON type.id = document.document_type_id
  LEFT JOIN cms_users creator ON creator.id = document.created_by_user_id
  LEFT JOIN cms_users uploader ON uploader.id = document.uploaded_by_user_id`;

export async function listDocumentTypes() {
  return (await reader().query<DocumentType>("SELECT id, name, description FROM document_types ORDER BY name")).rows;
}

export async function listPublicDocuments() {
  return (await reader().query<InstitutionalDocument>(`${selectDocuments} WHERE document.status = 'published' AND document.visibility = 'public' ORDER BY document.reference_year DESC NULLS LAST, document.document_date DESC NULLS LAST, document.title`)).rows;
}

export async function listAdminDocuments() {
  return (await reader().query<InstitutionalDocument>(`${selectDocuments} ORDER BY document.created_at DESC`)).rows;
}

export type DriveInventoryRow = {
  documentId: string | null;
  driveFileId: string;
  originalFilename: string;
  drivePath: string;
  sourceUrl: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
  driveOwnerName: string | null;
  driveOwnerEmail: string | null;
  driveCreatedAt: string | null;
  driveModifiedAt: string | null;
  integrityHashStatus: "pending" | "verified" | "unavailable";
  duplicateReviewStatus: "pending_hash" | "candidate_by_metadata" | "unique_hash" | "confirmed_duplicate" | "not_duplicate";
  comparisonStatus: "linked" | "drive_only" | "portal_only";
};

export type DocumentClassificationBatch = {
  id: string;
  status: "pending_directorate" | "approved" | "revision_requested" | "rejected";
  policyTitle: string;
  policyEditionYear: number | null;
  documentCount: number;
  misplacedCount: number;
  restrictedCount: number;
  requiresPolicyAmendmentCount: number;
  duplicateFileCount: number;
  movementAuthorized: boolean;
  notes: string | null;
  preparedAt: string;
  approvedAt: string | null;
  approvedByName: string | null;
  decisionNotes: string | null;
};

export type DocumentClassificationProposal = {
  id: string;
  documentId: string;
  driveFileId: string;
  currentPath: string;
  originalFilename: string;
  classificationType: string;
  folderCode: string;
  recommendedFolder: string;
  recommendedPath: string;
  proposedFilename: string;
  subject: string;
  origin: string;
  recommendedVisibility: "public" | "restricted" | "internal";
  classificationRationale: string;
  retentionRule: string;
  finalDestination: string;
  requiresPolicyAmendment: boolean;
  duplicateGroup: string | null;
  duplicateDisposition: "not_applicable" | "official_exemplar" | "secondary_copy";
  status: "pending_directorate" | "approved" | "revision_requested" | "rejected";
  movementStatus: "not_authorized" | "authorized" | "moved" | "kept_in_place";
  sourceUrl: string | null;
};

export async function getDocumentClassificationPlan() {
  const batch = (await reader().query<DocumentClassificationBatch>(
    `SELECT batch.id, batch.status, batch.policy_title AS "policyTitle",
     batch.policy_edition_year::int AS "policyEditionYear",
     batch.document_count::int AS "documentCount", batch.misplaced_count::int AS "misplacedCount",
     batch.restricted_count::int AS "restrictedCount",
     batch.requires_policy_amendment_count::int AS "requiresPolicyAmendmentCount",
     batch.duplicate_file_count::int AS "duplicateFileCount",
     batch.movement_authorized AS "movementAuthorized", batch.notes,
     batch.prepared_at::text AS "preparedAt", batch.approved_at::text AS "approvedAt",
     approver.full_name AS "approvedByName", batch.decision_notes AS "decisionNotes"
     FROM document_classification_batches batch
     LEFT JOIN cms_users approver ON approver.id = batch.approved_by
     ORDER BY batch.prepared_at DESC LIMIT 1`,
  )).rows[0] ?? null;

  if (!batch) return { batch: null, proposals: [] as DocumentClassificationProposal[] };

  const proposals = (await reader().query<DocumentClassificationProposal>(
    `SELECT proposal.id, proposal.document_id AS "documentId", proposal.drive_file_id AS "driveFileId",
     proposal.current_path AS "currentPath", proposal.original_filename AS "originalFilename",
     proposal.classification_type AS "classificationType", proposal.folder_code AS "folderCode",
     proposal.recommended_folder AS "recommendedFolder", proposal.recommended_path AS "recommendedPath",
     proposal.proposed_filename AS "proposedFilename", proposal.subject, proposal.origin,
     proposal.recommended_visibility::text AS "recommendedVisibility",
     proposal.classification_rationale AS "classificationRationale",
     proposal.retention_rule AS "retentionRule", proposal.final_destination AS "finalDestination",
     proposal.requires_policy_amendment AS "requiresPolicyAmendment",
     proposal.duplicate_group AS "duplicateGroup", proposal.duplicate_disposition AS "duplicateDisposition",
     proposal.status, proposal.movement_status AS "movementStatus", document.source_url AS "sourceUrl"
     FROM document_classification_proposals proposal
     JOIN documents document ON document.id = proposal.document_id
     WHERE proposal.batch_id = $1
     ORDER BY proposal.folder_code, proposal.recommended_path, proposal.original_filename`,
    [batch.id],
  )).rows;

  return { batch, proposals };
}

export async function approveDocumentClassificationPlan(
  actor: UserSession,
  decisionNotes: string,
  requestAudit: RequestAudit,
) {
  if (!hasRole(actor, "diretoria_cms")) throw new Error("Insufficient role");
  const connection = await editor().connect();
  try {
    await connection.query("BEGIN");
    const result = await connection.query<DocumentClassificationBatch>(
      `SELECT id, status, document_count::int AS "documentCount"
       FROM document_classification_batches ORDER BY prepared_at DESC LIMIT 1 FOR UPDATE`,
    );
    const batch = result.rows[0];
    if (!batch) throw new Error("Classification plan not found");
    if (batch.status === "approved") {
      await connection.query("COMMIT");
      return { batchId: batch.id, alreadyApproved: true };
    }
    if (batch.status !== "pending_directorate") throw new Error("Classification plan is not pending");

    const count = await connection.query<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM document_classification_proposals WHERE batch_id = $1`,
      [batch.id],
    );
    if ((count.rows[0]?.count ?? 0) !== batch.documentCount) throw new Error("Classification plan is incomplete");

    await connection.query(
      `UPDATE documents AS document SET
       document_type_id = type.id, subject = proposal.subject,
       issuing_body = proposal.origin, visibility = proposal.recommended_visibility,
       updated_at = NOW()
       FROM document_classification_proposals proposal
       JOIN document_types type ON type.name = proposal.classification_type
       WHERE proposal.batch_id = $1 AND document.id = proposal.document_id`,
      [batch.id],
    );
    await connection.query(
      `UPDATE document_classification_proposals
       SET status = 'approved', movement_status = 'not_authorized', updated_at = NOW()
       WHERE batch_id = $1`,
      [batch.id],
    );
    await connection.query(
      `UPDATE document_classification_batches SET status = 'approved', approved_by = $2,
       approved_at = NOW(), decision_notes = $3, movement_authorized = false, updated_at = NOW()
       WHERE id = $1`,
      [batch.id, actor.id, decisionNotes || null],
    );
    await connection.query(
      `INSERT INTO audit_logs
       (entity_type, entity_id, action, details, actor_user_id, actor_name, actor_email, actor_role, source_ip, user_agent)
       SELECT 'document', proposal.document_id, 'document_classification_approved',
       jsonb_build_object('batchId', proposal.batch_id, 'classificationType', proposal.classification_type,
         'recommendedFolder', proposal.recommended_folder, 'proposedFilename', proposal.proposed_filename,
         'visibility', proposal.recommended_visibility, 'movementAuthorized', false,
         'requiresPolicyAmendment', proposal.requires_policy_amendment),
       $2, $3, $4, $5, $6::inet, $7
       FROM document_classification_proposals proposal WHERE proposal.batch_id = $1`,
      [batch.id, actor.id, actor.fullName, actor.email, actor.role, requestAudit.ip, requestAudit.userAgent],
    );
    await connection.query(
      `INSERT INTO audit_logs
       (entity_type, entity_id, action, details, actor_user_id, actor_name, actor_email, actor_role, source_ip, user_agent)
       VALUES ('classification_plan', $1, 'classification_plan_approved',
       jsonb_build_object('documents', $2::int, 'movementAuthorized', false, 'decisionNotes', $3::text),
       $4, $5, $6, $7, $8::inet, $9)`,
      [batch.id, batch.documentCount, decisionNotes || null, actor.id, actor.fullName, actor.email, actor.role, requestAudit.ip, requestAudit.userAgent],
    );
    await connection.query("COMMIT");
    return { batchId: batch.id, alreadyApproved: false };
  } catch (error) {
    await connection.query("ROLLBACK");
    throw error;
  } finally { connection.release(); }
}

export async function getDriveInventoryComparison() {
  const scan = (await reader().query<{
    id: string; rootFolderName: string; rootFolderUrl: string; scannedAt: string;
    folderCount: number; fileCount: number; totalSizeBytes: number;
  }>(`SELECT id, root_folder_name AS "rootFolderName", root_folder_url AS "rootFolderUrl",
      scanned_at::text AS "scannedAt", folder_count::int AS "folderCount",
      file_count::int AS "fileCount", total_size_bytes::float8 AS "totalSizeBytes"
      FROM drive_inventory_scans ORDER BY scanned_at DESC LIMIT 1`)).rows[0] ?? null;

  if (!scan) return { scan: null, rows: [] as DriveInventoryRow[], portalNativeCount: 0 };

  const [rows, native] = await Promise.all([
    reader().query<DriveInventoryRow>(
      `SELECT document.id AS "documentId", inventory.drive_file_id AS "driveFileId",
       inventory.original_filename AS "originalFilename", inventory.drive_path AS "drivePath",
       inventory.source_url AS "sourceUrl", inventory.mime_type AS "mimeType",
       inventory.file_size_bytes::float8 AS "fileSizeBytes",
       inventory.drive_owner_name AS "driveOwnerName", inventory.drive_owner_email AS "driveOwnerEmail",
       inventory.drive_created_at::text AS "driveCreatedAt", inventory.drive_modified_at::text AS "driveModifiedAt",
       COALESCE(document.integrity_hash_status, inventory.integrity_hash_status)::text AS "integrityHashStatus",
       COALESCE(document.duplicate_review_status, inventory.duplicate_review_status)::text AS "duplicateReviewStatus",
       CASE WHEN document.id IS NULL THEN 'drive_only' ELSE 'linked' END AS "comparisonStatus"
       FROM drive_inventory_files inventory
       LEFT JOIN documents document ON document.drive_file_id = inventory.drive_file_id
       WHERE inventory.scan_id = $1
       UNION ALL
       SELECT document.id AS "documentId", document.drive_file_id AS "driveFileId",
       COALESCE(document.original_filename, document.title) AS "originalFilename",
       COALESCE(document.drive_path, 'Caminho não registrado') AS "drivePath",
       COALESCE(document.source_url, '') AS "sourceUrl", document.mime_type AS "mimeType",
       document.file_size_bytes::float8 AS "fileSizeBytes",
       document.drive_owner_name AS "driveOwnerName", document.drive_owner_email AS "driveOwnerEmail",
       document.drive_created_at::text AS "driveCreatedAt", document.drive_modified_at::text AS "driveModifiedAt",
       document.integrity_hash_status::text AS "integrityHashStatus",
       document.duplicate_review_status::text AS "duplicateReviewStatus", 'portal_only' AS "comparisonStatus"
       FROM documents document
       WHERE document.source_type = 'google_drive' AND document.drive_file_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM drive_inventory_files inventory
         WHERE inventory.scan_id = $1 AND inventory.drive_file_id = document.drive_file_id)
       ORDER BY "drivePath", "originalFilename"`,
      [scan.id],
    ),
    reader().query<{ count: number }>("SELECT COUNT(*)::int AS count FROM documents WHERE source_type <> 'google_drive'"),
  ]);

  return { scan, rows: rows.rows, portalNativeCount: native.rows[0]?.count ?? 0 };
}

export async function getAdminDocument(id: string) {
  return (await reader().query<InstitutionalDocument>(`${selectDocuments} WHERE document.id = $1`, [id])).rows[0] ?? null;
}

export async function getDocumentHistory(id: string) {
  const [events, versions] = await Promise.all([
    reader().query<DocumentHistoryEntry>(
      `SELECT id, action, details,
       COALESCE(actor_name, details->>'createdBy', details->>'updatedBy') AS "actorName",
       COALESCE(actor_email, details->>'createdBy', details->>'updatedBy') AS "actorEmail",
       actor_role::text AS "actorRole", source_ip::text AS "sourceIp", created_at::text AS "createdAt"
       FROM audit_logs WHERE entity_type = 'document' AND entity_id = $1 ORDER BY created_at DESC`,
      [id],
    ),
    reader().query<DocumentVersion>(
      `SELECT version.id, version.version_number::int AS "versionNumber", version.original_filename AS "originalFilename",
       version.mime_type AS "mimeType", version.file_size_bytes::float8 AS "fileSizeBytes", version.sha256,
       version.change_type AS "changeType", version.change_notes AS "changeNotes",
       account.full_name AS "createdByName", account.email AS "createdByEmail", version.created_at::text AS "createdAt"
       FROM document_versions version LEFT JOIN cms_users account ON account.id = version.created_by_user_id
       WHERE version.document_id = $1 ORDER BY version.version_number DESC`,
      [id],
    ),
  ]);
  return { events: events.rows, versions: versions.rows };
}

export async function getDownloadableDocument(id: string) {
  return (await reader().query<Pick<InstitutionalDocument, "title" | "storagePath" | "sourceType" | "sourceUrl">>(`SELECT title, storage_path AS "storagePath", source_type::text AS "sourceType", source_url AS "sourceUrl" FROM documents WHERE id = $1 AND status = 'published' AND visibility = 'public'`, [id])).rows[0] ?? null;
}

type RequestAudit = { ip: string | null; userAgent: string | null };

export type NewDocument = {
  typeId: string;
  title: string;
  documentNumber: string | null;
  referenceYear: number | null;
  description: string | null;
  issuingBody: string | null;
  documentDate: string | null;
  status: "draft" | "published";
  visibility: "public" | "restricted" | "internal";
  storagePath: string;
  sha256: string;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  actor: UserSession;
  requestAudit: RequestAudit;
};

export async function createDocument(input: NewDocument) {
  const connection = await editor().connect();
  try {
    await connection.query("BEGIN");
    const result = await connection.query<{ id: string }>(
      `INSERT INTO documents (document_type_id, title, document_number, reference_year, description,
       issuing_body, document_date, status, visibility, source_type, storage_path, sha256,
       created_by_user_id, uploaded_by_user_id, original_filename, mime_type, file_size_bytes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'upload', $10, $11, $12, $12, $13, $14, $15) RETURNING id`,
      [input.typeId, input.title, input.documentNumber, input.referenceYear, input.description, input.issuingBody, input.documentDate, input.status, input.visibility, input.storagePath, input.sha256, input.actor.id, input.originalFilename, input.mimeType, input.fileSizeBytes],
    );
    await connection.query(
      `INSERT INTO document_versions (document_id, version_number, storage_path, original_filename, mime_type,
       file_size_bytes, sha256, change_type, change_notes, created_by_user_id)
       VALUES ($1, 1, $2, $3, $4, $5, $6, 'upload_inicial', 'Arquivo protocolado no portal.', $7)`,
      [result.rows[0].id, input.storagePath, input.originalFilename, input.mimeType, input.fileSizeBytes, input.sha256, input.actor.id],
    );
    await connection.query(
      `INSERT INTO audit_logs (entity_type, entity_id, action, details, actor_user_id, actor_name, actor_email, actor_role, source_ip, user_agent)
       VALUES ('document', $1, 'document_created', $2::jsonb, $3, $4, $5, $6, $7::inet, $8)`,
      [result.rows[0].id, JSON.stringify({ title: input.title, status: input.status, visibility: input.visibility, originalFilename: input.originalFilename, fileSizeBytes: input.fileSizeBytes, sha256: input.sha256 }), input.actor.id, input.actor.fullName, input.actor.email, input.actor.role, input.requestAudit.ip, input.requestAudit.userAgent],
    );
    await connection.query("COMMIT");
    return result.rows[0].id;
  } catch (error) {
    await connection.query("ROLLBACK");
    throw error;
  } finally { connection.release(); }
}

export type DocumentUpdate = Omit<NewDocument, "status" | "storagePath" | "sha256" | "originalFilename" | "mimeType" | "fileSizeBytes"> & {
  status: "draft" | "published" | "archived";
  storagePath: string | null;
  sha256: string | null;
  originalFilename: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
};

export async function updateDocument(id: string, input: DocumentUpdate) {
  const connection = await editor().connect();
  try {
    await connection.query("BEGIN");
    const current = await connection.query<{ storagePath: string | null; title: string; status: string; visibility: string }>(
      `SELECT storage_path AS "storagePath", title, status::text, visibility::text FROM documents WHERE id = $1 FOR UPDATE`, [id],
    );
    if (!current.rows[0]) throw new Error("Document not found");
    await connection.query(
      `UPDATE documents SET document_type_id = $2, title = $3, document_number = $4,
       reference_year = $5, description = $6, issuing_body = $7, document_date = $8,
       status = $9, visibility = $10, source_type = CASE WHEN $11::text IS NULL THEN source_type ELSE 'upload' END,
       storage_path = COALESCE($11, storage_path), sha256 = COALESCE($12, sha256),
       uploaded_by_user_id = CASE WHEN $11::text IS NULL THEN uploaded_by_user_id ELSE $13 END,
       original_filename = COALESCE($14, original_filename), mime_type = COALESCE($15, mime_type),
       file_size_bytes = COALESCE($16, file_size_bytes), updated_at = NOW() WHERE id = $1`,
      [id, input.typeId, input.title, input.documentNumber, input.referenceYear, input.description, input.issuingBody, input.documentDate, input.status, input.visibility, input.storagePath, input.sha256, input.actor.id, input.originalFilename, input.mimeType, input.fileSizeBytes],
    );
    if (input.storagePath && input.sha256) {
      await connection.query(
        `INSERT INTO document_versions (document_id, version_number, storage_path, original_filename, mime_type,
         file_size_bytes, sha256, change_type, change_notes, created_by_user_id)
         SELECT $1, COALESCE(MAX(version_number), 0) + 1, $2, $3, $4, $5, $6, 'substituicao',
         'Arquivo substituído durante a revisão documental.', $7 FROM document_versions WHERE document_id = $1`,
        [id, input.storagePath, input.originalFilename, input.mimeType, input.fileSizeBytes, input.sha256, input.actor.id],
      );
    }
    await connection.query(
      `INSERT INTO audit_logs (entity_type, entity_id, action, details, actor_user_id, actor_name, actor_email, actor_role, source_ip, user_agent)
       VALUES ('document', $1, 'document_updated', $2::jsonb, $3, $4, $5, $6, $7::inet, $8)`,
      [id, JSON.stringify({ title: input.title, previousTitle: current.rows[0].title, status: input.status, previousStatus: current.rows[0].status, visibility: input.visibility, previousVisibility: current.rows[0].visibility, fileReplaced: Boolean(input.storagePath), originalFilename: input.originalFilename, sha256: input.sha256 }), input.actor.id, input.actor.fullName, input.actor.email, input.actor.role, input.requestAudit.ip, input.requestAudit.userAgent],
    );
    await connection.query("COMMIT");
    return current.rows[0].storagePath;
  } catch (error) {
    await connection.query("ROLLBACK");
    throw error;
  } finally { connection.release(); }
}
