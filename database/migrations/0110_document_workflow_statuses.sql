-- Fluxo de revisão dos documentos da trilha (devolver, concluir, reabrir, arquivar e restaurar):
--   * 'archived' passa a ser um status válido de track_documents (o front já tem "Arquivado");
--   * review_comments guarda a observação da última devolução, exibida ao autor ao corrigir o documento.
ALTER TABLE track_documents DROP CONSTRAINT track_documents_status_check;
ALTER TABLE track_documents ADD CONSTRAINT track_documents_status_check
    CHECK (status IN ('draft', 'submitted', 'changes_requested', 'approved', 'rejected', 'archived'));

ALTER TABLE track_documents ADD COLUMN review_comments text;
