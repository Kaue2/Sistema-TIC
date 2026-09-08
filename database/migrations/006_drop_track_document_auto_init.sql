-- A criação dos track_documents ao inserir uma trilha passa a ser responsabilidade da
-- camada de aplicação (TrackService), não do banco. Mantém o schema e as demais guardas
-- de integridade de track_documents (ex.: validate_track_document_template_version).
DROP TRIGGER IF EXISTS tracks_initialize_documents ON tracks;
DROP FUNCTION IF EXISTS initialize_track_documents();
