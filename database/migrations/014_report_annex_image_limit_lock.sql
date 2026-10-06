-- Corrige a race no limite de 20 imagens ativas por anexo (trigger criado na 009).
-- O count(*) do trigger não trava nada: em READ COMMITTED, duas transações concorrentes
-- podiam ver 19 imagens e inserir ambas, chegando a 21. O backend já serializava via
-- SELECT ... FOR UPDATE OF ra, mas inserts por SQL direto ainda furavam o limite.
-- Agora o próprio trigger trava a linha do anexo pai antes de contar, serializando
-- inserts/updates concorrentes no mesmo anexo. O lock é reentrante na mesma transação,
-- então o fluxo do backend (que já trava o anexo) não é afetado.
CREATE OR REPLACE FUNCTION enforce_report_annex_image_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM 1
       FROM report_annexes
      WHERE id = NEW.report_annex_id
        FOR UPDATE;

    IF (
        SELECT count(*)
          FROM report_annex_images
         WHERE report_annex_id = NEW.report_annex_id
           AND deleted_at IS NULL
           AND id IS DISTINCT FROM NEW.id
    ) >= 20 THEN
        RAISE EXCEPTION 'A report annex may contain at most 20 active images';
    END IF;
    RETURN NEW;
END;
$$;
