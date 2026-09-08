-- track_categories ainda não tem discussão fechada com o time; enquanto isso, category_id
-- deixa de ser obrigatório na criação da trilha (fica null até a decisão ser tomada).
ALTER TABLE tracks ALTER COLUMN category_id DROP NOT NULL;
