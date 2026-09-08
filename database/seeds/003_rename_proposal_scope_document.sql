-- Alinha o nome do template com o rótulo já usado nas telas do front ("Escopo e Proposta").
UPDATE document_templates
   SET name = 'Escopo e Proposta'
 WHERE code = 'proposal_scope';
