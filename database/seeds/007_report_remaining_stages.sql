-- Completa o catálogo do relatório com as quatro metas já disponíveis na tela Softex.
-- softex_field_id preserva o identificador original para ligar cada campo à pergunta exportada.
UPDATE report_stages
   SET display_order = display_order + 100
 WHERE code IN (
     'M1.13', 'M1.14', 'M1.15', 'M1.18', 'M1.19', 'M1.20',
     'M2.1', 'M2.2', 'M2.3', 'M2.4', 'M2.5', 'M2.6'
 );

INSERT INTO report_stages (id, code, name, display_order) VALUES
    ('40000000-0000-4000-8000-000000000118', 'M1.18', 'Produção de materiais audiovisuais e conteúdos didáticos', 4),
    ('40000000-0000-4000-8000-000000000119', 'M1.19', 'Inclusão e validação de conteúdos na plataforma virtual', 5),
    ('40000000-0000-4000-8000-000000000120', 'M1.20', 'Perfis de entrada e saída e métodos de seleção', 6),
    ('40000000-0000-4000-8000-000000000205', 'M2.5', 'Avaliação do desempenho dos estudantes', 11)
ON CONFLICT (id) DO UPDATE SET
    code = EXCLUDED.code,
    name = EXCLUDED.name,
    display_order = EXCLUDED.display_order,
    is_active = true;

UPDATE report_stages
   SET display_order = CASE code
       WHEN 'M1.13' THEN 1
       WHEN 'M1.14' THEN 2
       WHEN 'M1.15' THEN 3
       WHEN 'M1.18' THEN 4
       WHEN 'M1.19' THEN 5
       WHEN 'M1.20' THEN 6
       WHEN 'M2.1' THEN 7
       WHEN 'M2.2' THEN 8
       WHEN 'M2.3' THEN 9
       WHEN 'M2.4' THEN 10
       WHEN 'M2.5' THEN 11
       WHEN 'M2.6' THEN 12
       ELSE display_order
   END
 WHERE code IN (
     'M1.13', 'M1.14', 'M1.15', 'M1.18', 'M1.19', 'M1.20',
     'M2.1', 'M2.2', 'M2.3', 'M2.4', 'M2.5', 'M2.6'
 );

WITH catalog (stage_code, question_number, softex_field_id, label) AS (
    VALUES
    ('M1.18', 1, '1.18 -02', 'Detalhamento dos materiais produzidos para cada capacitação, como: Vídeos educacionais, Apresentações (slides, infográficos), Guias de estudo e manuais, Apostilas e outros materiais de leitura, Exercícios e atividades práticas.'),
    ('M1.18', 2, '1.18 -03', 'Tipos de mídia utilizados, como vídeos, podcasts, PDFs, plataformas interativas, entre outros.'),
    ('M1.18', 3, '1.18 -04', 'Explicação de como cada material serve ao objetivo educacional da capacitação.'),
    ('M1.18', 4, '1.18 -05', 'Nome e função dos membros da equipe pedagógica responsáveis pela criação dos materiais.'),
    ('M1.18', 5, '1.18 -06', 'Descrição das etapas e do tempo necessário para a produção de cada conteúdo, com prazos cumpridos e pendentes.'),
    ('M1.18', 6, '1.18 -07', 'Relatório das atividades de revisão e adaptação de materiais existentes, explicando quais conteúdos foram atualizados, por quê, e o que foi modificado.'),
    ('M1.18', 7, '1.18 -08', 'Indicação clara de como os materiais produzidos se relacionam diretamente com as ementas e os objetivos de cada capacitação.'),
    ('M1.18', 8, '1.18 -09', 'Explicação de como e quando os materiais serão utilizados nas aulas.'),
    ('M1.18', 9, '1.18 -10', 'Descrição dos critérios adotados para garantir a qualidade técnica e pedagógica dos materiais.'),
    ('M1.18', 10, '1.18 -12', 'Indicação de quantos conjuntos completos de materiais foram produzidos e vinculados a capacitações específicas.'),
    ('M1.18', 11, '1.18 -11', 'Inclusão de feedback recebido dos usuários dos materiais (estudantes, professores), quando aplicável, e como esse feedback tem sido utilizado para melhorias.'),
    ('M1.18', 12, '1.18 -16', 'Resumo das atividades executadas no mês, destacando os principais avanços na produção dos materiais audiovisuais e didáticos.'),
    ('M1.19', 1, '1.19 -02', 'Detalhamento de cada conjunto de materiais disponibilizados na plataforma, como: Vídeos, PDFs e apresentações, Guias, apostilas e atividades.'),
    ('M1.19', 2, '1.19 -03', 'Divisão dos materiais por categorias, como módulos de aprendizagem, atividades práticas, exercícios, entre outros.'),
    ('M1.19', 3, '1.19 -07', 'Nome dos responsáveis pelo processo de upload e curadoria dos conteúdos na plataforma.'),
    ('M1.19', 4, '1.19 -08', 'Detalhamento das datas de inclusão de cada material na plataforma.'),
    ('M1.19', 5, '1.19 -09', 'Como os materiais estão organizados dentro do LMS (divisão por módulos, pastas, ou outros critérios).'),
    ('M1.19', 6, '1.19 -10', 'Relatório sobre os testes realizados para verificar se todos os materiais estão acessíveis e compatíveis com os dispositivos utilizados pelos estudantes.'),
    ('M1.19', 7, '1.19 -11', 'Descrição dos problemas identificados no processo de disponibilização e como foram resolvidos.'),
    ('M1.19', 8, '1.19 -12', 'Feedback obtido de alunos e professores que já tiveram acesso aos materiais na plataforma.'),
    ('M1.19', 9, '1.19 -13', 'Ações realizadas para ajustar ou melhorar os materiais com base no feedback recebido.'),
    ('M1.19', 10, '1.19 -16', 'Resumo das atividades realizadas durante o mês, com ênfase nas capacitações que já têm materiais completos disponíveis e na validação técnica da plataforma.'),
    ('M1.20', 1, '1.20 -02', 'Listar as competências e conhecimentos que os egressos devem possuir ao final do curso, alinhando-os com as demandas do mercado de trabalho.'),
    ('M1.20', 2, '1.20 -04', 'É importante incluir a justificativa para a escolha desses métodos e como eles se relacionam com os perfis definidos.'),
    ('M1.20', 3, '1.20 -05', 'Apresentar dados quantitativos e qualitativos sobre o desempenho dos candidatos durante o processo seletivo.'),
    ('M1.20', 4, '1.20 -06', 'Isso pode incluir estatísticas sobre a taxa de aprovação, feedback das entrevistas e resultados dos testes aplicados.'),
    ('M1.20', 5, '1.20 -07', 'Comparar os perfis dos candidatos selecionados com os perfis desejados, destacando as semelhanças e diferenças. Isso ajudará a avaliar a eficácia do processo de seleção em atender às necessidades do projeto.'),
    ('M1.20', 6, '1.20 -08', 'Incluir sugestões para aprimorar o processo de seleção com base nas observações feitas durante a execução do projeto. Isso pode envolver ajustes nos critérios de seleção ou na metodologia aplicada.'),
    ('M1.20', 7, '1.20 -09', 'Informar sobre como os perfis de entrada e saída foram formatados e disponibilizados nas plataformas tecnológicas para facilitar o acesso às informações pelos envolvidos no processo de seleção.'),
    ('M2.5', 1, '2.5 -02', 'Definição clara dos critérios utilizados para avaliar o desempenho dos estudantes, alinhados com os objetivos de aprendizagem estabelecidos.'),
    ('M2.5', 2, '2.5 -03', 'Descrição dos métodos de avaliação aplicados, como provas, trabalhos, projetos, atividades práticas, quizzes online, autoavaliações, entre outros.'),
    ('M2.5', 3, '2.5 -04', 'Indicação da frequência com que as avaliações foram realizadas (semanal, mensal, ao final de cada módulo) e o formato adotado (presencial, online, síncrono, assíncrono).'),
    ('M2.5', 4, '2.5 -05', 'Lista completa das atividades de avaliação aplicadas em cada capacitação, com descrições que incluam o tipo de atividade, os objetivos específicos de cada uma, e as competências avaliadas.'),
    ('M2.5', 5, '2.5 -06', 'Registro das datas em que cada atividade foi aplicada e os prazos de entrega ou conclusão.'),
    ('M2.5', 6, '2.5 -07', 'Apresentação dos resultados das avaliações, mostrando a distribuição das notas ou classificações por atividade e por estudante.'),
    ('M2.5', 7, '2.5 -08', 'Identificação de tendências nos resultados, como áreas onde os estudantes se destacaram ou tiveram dificuldades.'),
    ('M2.5', 8, '2.5 -09', 'Descrição do processo de feedback oferecido aos estudantes, incluindo como e quando eles receberam o retorno sobre seu desempenho.'),
    ('M2.5', 9, '2.5 -10', 'Exemplos de feedbacks fornecidos, destacando a importância de orientações claras para a melhoria contínua.'),
    ('M2.5', 10, '2.5 -11', 'Análise de como os resultados das avaliações se alinham com os objetivos de aprendizagem estabelecidos para a capacitação.'),
    ('M2.5', 11, '2.5 -12', 'Verificação se as metas de desempenho dos estudantes foram atingidas e onde houve desvios.'),
    ('M2.5', 12, '2.5 -13', 'Sugestões de melhorias baseadas nos resultados das avaliações, como reforço de conteúdos, ajustes nos métodos de ensino ou reavaliação de atividades.'),
    ('M2.5', 13, '2.5 -14', 'Planos para apoio adicional ou medidas de intervenção para estudantes que não atingiram o desempenho esperado.'),
    ('M2.5', 14, '2.5 -15', 'Resumo dos principais resultados das avaliações e a interpretação desses resultados em termos de sucesso da capacitação.'),
    ('M2.5', 15, '2.5 -16', 'Discussão sobre o impacto das avaliações no processo de ensino aprendizagem e no desenvolvimento dos estudantes.'),
    ('M2.5', 16, '2.5 -17', 'Inclusão de exemplos de provas, projetos ou outras atividades de avaliação aplicadas.'),
    ('M2.5', 17, '2.5 -18', 'Gráficos, tabelas ou outras representações visuais dos dados de desempenho dos estudantes.'),
    ('M2.5', 18, '2.5 -19', 'Planejamento de possíveis ajustes nos métodos de avaliação para as próximas capacitações, baseados nas lições aprendidas.')
), questions AS (
    SELECT rs.id AS stage_id,
           c.stage_code || '_Q' || lpad(c.question_number::text, 2, '0') AS code,
           c.label,
           c.softex_field_id,
           c.question_number AS display_order
      FROM catalog c
      JOIN report_stages rs ON rs.code = c.stage_code
)
INSERT INTO report_questions (
    report_stage_id, code, label, softex_field_id, display_order
)
SELECT stage_id, code, label, softex_field_id, display_order
  FROM questions
ON CONFLICT (code) DO UPDATE SET
    report_stage_id = EXCLUDED.report_stage_id,
    label = EXCLUDED.label,
    softex_field_id = EXCLUDED.softex_field_id,
    display_order = EXCLUDED.display_order,
    is_active = true;

-- O seed 006 associava os campos da tela às linhas do DOCX apenas pela posição.
-- Alguns modelos oficiais têm linhas sem campo equivalente na tela, por isso o
-- vínculo abaixo foi conferido pelo texto integral de cada pergunta.
UPDATE report_questions question
   SET softex_field_id = NULL
  FROM report_stages stage
 WHERE stage.id = question.report_stage_id
   AND stage.code IN (
       'M1.13', 'M1.14', 'M1.15', 'M2.1',
       'M2.2', 'M2.3', 'M2.4', 'M2.6'
   );

WITH field_mapping (question_code, softex_field_id) AS (
    VALUES
    ('M1.13_Q01', '1.13 -02'),
    ('M1.13_Q02', '1.13 -03'),
    ('M1.13_Q03', '1.13 -04'),
    ('M1.13_Q04', '1.13 -05'),
    ('M1.13_Q05', '1.13 -06'),
    ('M1.13_Q06', '1.13 -07'),
    ('M1.13_Q07', '1.13 -08'),
    ('M1.13_Q08', '1.13 -09'),
    ('M1.13_Q09', '1.13 -10'),
    ('M1.13_Q10', '1.13 -11'),
    ('M1.13_Q11', '1.13 -12'),
    ('M1.13_Q12', '1.13 -13'),
    ('M1.13_Q14', '1.13 -15'),
    ('M1.13_Q15', '1.13 -16'),
    ('M1.14_Q02', '1.14 -02'),
    ('M1.14_Q03', '1.14 -03'),
    ('M1.14_Q04', '1.14 -04'),
    ('M1.14_Q05', '1.14 -05'),
    ('M1.14_Q06', '1.14 -06'),
    ('M1.14_Q07', '1.14 -07'),
    ('M1.14_Q08', '1.14 -08'),
    ('M1.14_Q09', '1.14 -09'),
    ('M1.14_Q10', '1.14 -10'),
    ('M1.14_Q11', '1.14 -11'),
    ('M1.14_Q12', '1.14 -12'),
    ('M1.14_Q13', '1.14 -13'),
    ('M1.15_Q02', '1.15 -03'),
    ('M1.15_Q04', '1.15 -05'),
    ('M1.15_Q05', '1.15 -06'),
    ('M1.15_Q09', '1.15 -10'),
    ('M1.15_Q11', '1.15 -12'),
    ('M1.15_Q12', '1.15 -13'),
    ('M1.15_Q15', '1.15 -16'),
    ('M1.15_Q16', '1.15 -17'),
    ('M2.1_Q04', '2.1 -04'),
    ('M2.1_Q07', '2.1 -07'),
    ('M2.1_Q10', '2.1 -10'),
    ('M2.1_Q11', '2.1 -11'),
    ('M2.1_Q13', '2.1 -13'),
    ('M2.2_Q01', '2.2 -02'),
    ('M2.2_Q02', '2.2 -03'),
    ('M2.2_Q03', '2.2 -04'),
    ('M2.2_Q04', '2.2 -05'),
    ('M2.2_Q05', '2.2 -06'),
    ('M2.2_Q06', '2.2 -07'),
    ('M2.2_Q07', '2.2 -08'),
    ('M2.2_Q08', '2.2 -09'),
    ('M2.2_Q09', '2.2 -10'),
    ('M2.2_Q10', '2.2 -11'),
    ('M2.2_Q11', '2.2 -12'),
    ('M2.2_Q12', '2.2 -13'),
    ('M2.2_Q13', '2.2 -14'),
    ('M2.2_Q14', '2.2 -15'),
    ('M2.2_Q15', '2.2 -16'),
    ('M2.2_Q16', '2.2 -17'),
    ('M2.2_Q17', '2.2 -18'),
    ('M2.2_Q18', '2.2 -19'),
    ('M2.2_Q19', '2.2 -20'),
    ('M2.3_Q01', '2.3 -02'),
    ('M2.3_Q02', '2.3 -03'),
    ('M2.3_Q03', '2.3 -04'),
    ('M2.3_Q04', '2.3 -05'),
    ('M2.3_Q05', '2.3 -06'),
    ('M2.3_Q06', '2.3 -07'),
    ('M2.3_Q07', '2.3 -08'),
    ('M2.3_Q08', '2.3 -09'),
    ('M2.3_Q09', '2.3 -10'),
    ('M2.3_Q10', '2.3 -11'),
    ('M2.3_Q11', '2.3 -12'),
    ('M2.3_Q12', '2.3 -13'),
    ('M2.3_Q13', '2.3 -14'),
    ('M2.3_Q14', '2.3 -15'),
    ('M2.3_Q15', '2.3 -16'),
    ('M2.3_Q16', '2.3 -17'),
    ('M2.3_Q17', '2.3 -18'),
    ('M2.4_Q01', '2.4 -02'),
    ('M2.4_Q02', '2.4 -03'),
    ('M2.4_Q03', '2.4 -04'),
    ('M2.4_Q04', '2.4 -05'),
    ('M2.4_Q05', '2.4 -06'),
    ('M2.4_Q12', '2.4 -13'),
    ('M2.4_Q13', '2.4 -14'),
    ('M2.4_Q14', '2.4 -15'),
    ('M2.4_Q16', '2.4 -17'),
    ('M2.4_Q17', '2.4 -18'),
    ('M2.4_Q18', '2.4 -19'),
    ('M2.6_Q07', '2.6 -04'),
    ('M2.6_Q09', '2.6 -06'),
    ('M2.6_Q10', '2.6 -07'),
    ('M2.6_Q16', '2.6 -17')
)
UPDATE report_questions question
   SET softex_field_id = mapping.softex_field_id
  FROM field_mapping mapping
 WHERE question.code = mapping.question_code;
