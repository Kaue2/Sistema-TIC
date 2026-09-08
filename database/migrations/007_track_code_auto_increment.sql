-- O código da trilha nunca é definido na criação; passa a ser sequencial e gerado pelo banco.
ALTER TABLE tracks DROP COLUMN code;
ALTER TABLE tracks ADD COLUMN code integer GENERATED ALWAYS AS IDENTITY UNIQUE;
