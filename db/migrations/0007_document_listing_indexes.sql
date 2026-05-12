CREATE INDEX IF NOT EXISTS idx_documents_updated_at_desc ON documents(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_index_jobs_document_created_desc ON index_jobs(document_id, created_at DESC);
