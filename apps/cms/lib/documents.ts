import { Pool } from "pg";

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
  if (!process.env.ADMIN_DATABASE_URL) throw new Error("ADMIN_DATABASE_URL is not configured");
  editorPool ??= new Pool({ connectionString: process.env.ADMIN_DATABASE_URL, max: 2, idleTimeoutMillis: 10_000 });
  return editorPool;
}

const selectDocuments = `SELECT document.id, document.document_type_id AS "typeId", type.name AS "typeName", document.title,
  document.document_number AS "documentNumber", document.reference_year::int AS "referenceYear",
  document.description, document.issuing_body AS "issuingBody", document.document_date::text AS "documentDate",
  document.status::text AS status, document.visibility::text AS visibility,
  document.storage_path AS "storagePath", document.created_at::text AS "createdAt"
  FROM documents document LEFT JOIN document_types type ON type.id = document.document_type_id`;

export async function listDocumentTypes() {
  return (await reader().query<DocumentType>("SELECT id, name, description FROM document_types ORDER BY name")).rows;
}

export async function listPublicDocuments() {
  return (await reader().query<InstitutionalDocument>(`${selectDocuments} WHERE document.status = 'published' AND document.visibility = 'public' ORDER BY document.reference_year DESC NULLS LAST, document.document_date DESC NULLS LAST, document.title`)).rows;
}

export async function listAdminDocuments() {
  return (await reader().query<InstitutionalDocument>(`${selectDocuments} ORDER BY document.created_at DESC`)).rows;
}

export async function getAdminDocument(id: string) {
  return (await reader().query<InstitutionalDocument>(`${selectDocuments} WHERE document.id = $1`, [id])).rows[0] ?? null;
}

export async function getDownloadableDocument(id: string) {
  return (await reader().query<Pick<InstitutionalDocument, "title" | "storagePath">>(`SELECT title, storage_path AS "storagePath" FROM documents WHERE id = $1 AND status = 'published' AND visibility = 'public'`, [id])).rows[0] ?? null;
}

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
  createdBy: string;
};

export async function createDocument(input: NewDocument) {
  const connection = await editor().connect();
  try {
    await connection.query("BEGIN");
    const result = await connection.query<{ id: string }>(
      `INSERT INTO documents (document_type_id, title, document_number, reference_year, description,
       issuing_body, document_date, status, visibility, source_type, storage_path, sha256)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'upload', $10, $11) RETURNING id`,
      [input.typeId, input.title, input.documentNumber, input.referenceYear, input.description, input.issuingBody, input.documentDate, input.status, input.visibility, input.storagePath, input.sha256],
    );
    await connection.query(`INSERT INTO audit_logs (entity_type, entity_id, action, details) VALUES ('document', $1, 'document_created', $2::jsonb)`, [result.rows[0].id, JSON.stringify({ title: input.title, status: input.status, visibility: input.visibility, createdBy: input.createdBy })]);
    await connection.query("COMMIT");
    return result.rows[0].id;
  } catch (error) {
    await connection.query("ROLLBACK");
    throw error;
  } finally {
    connection.release();
  }
}

export type DocumentUpdate = Omit<NewDocument, "storagePath" | "sha256" | "createdBy" | "status"> & {
  status: "draft" | "published" | "archived";
  storagePath: string | null;
  sha256: string | null;
  updatedBy: string;
};

export async function updateDocument(id: string, input: DocumentUpdate) {
  const connection = await editor().connect();
  try {
    await connection.query("BEGIN");
    const current = await connection.query<{ storagePath: string | null }>(
      `SELECT storage_path AS "storagePath" FROM documents WHERE id = $1 FOR UPDATE`,
      [id],
    );
    if (!current.rows[0]) throw new Error("Document not found");
    await connection.query(
      `UPDATE documents SET document_type_id = $2, title = $3, document_number = $4,
       reference_year = $5, description = $6, issuing_body = $7, document_date = $8,
       status = $9, visibility = $10,
       source_type = CASE WHEN $11::text IS NULL THEN source_type ELSE 'upload' END,
       storage_path = COALESCE($11, storage_path), sha256 = COALESCE($12, sha256),
       updated_at = NOW() WHERE id = $1`,
      [id, input.typeId, input.title, input.documentNumber, input.referenceYear, input.description, input.issuingBody, input.documentDate, input.status, input.visibility, input.storagePath, input.sha256],
    );
    await connection.query(
      `INSERT INTO audit_logs (entity_type, entity_id, action, details)
       VALUES ('document', $1, 'document_updated', $2::jsonb)`,
      [id, JSON.stringify({ title: input.title, status: input.status, visibility: input.visibility, fileReplaced: Boolean(input.storagePath), updatedBy: input.updatedBy })],
    );
    await connection.query("COMMIT");
    return current.rows[0].storagePath;
  } catch (error) {
    await connection.query("ROLLBACK");
    throw error;
  } finally {
    connection.release();
  }
}
