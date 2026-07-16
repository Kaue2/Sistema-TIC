INSERT INTO roles (id, code, name, hierarchy_level, description) VALUES
    ('00000000-0000-4000-8000-000000000001', 'coordinator', 'Coordenador', 40, 'Coordena o programa e administra papéis de acesso.'),
    ('00000000-0000-4000-8000-000000000002', 'administrator', 'Administrativo', 30, 'Organiza, acompanha e valida a operação das Trilhas.'),
    ('00000000-0000-4000-8000-000000000003', 'mentor', 'Mentor', 20, 'Professor responsável pelo conteúdo e pelas aulas da Trilha.'),
    ('00000000-0000-4000-8000-000000000004', 'monitor', 'Monitor', 10, 'Aluno contratado para apoiar mentor e administrativo.');

INSERT INTO job_positions (id, code, name, description) VALUES
    ('00000000-0000-4000-8000-000000000101', 'program_coordinator', 'Coordenador do programa', 'Cargo de coordenação do TIC em Trilhas.'),
    ('00000000-0000-4000-8000-000000000102', 'administrative_staff', 'Profissional administrativo', 'Cargo da equipe administrativa.'),
    ('00000000-0000-4000-8000-000000000103', 'professor', 'Professor', 'Professor da faculdade que pode atuar como mentor.'),
    ('00000000-0000-4000-8000-000000000104', 'student_monitor', 'Aluno monitor', 'Aluno contratado para atuar como monitor.');

INSERT INTO knowledge_areas (id, code, name) VALUES
    ('00000000-0000-4000-8000-000000000201', 'programming_logic', 'Lógica de programação'),
    ('00000000-0000-4000-8000-000000000202', 'frontend', 'Desenvolvimento front-end'),
    ('00000000-0000-4000-8000-000000000203', 'backend', 'Desenvolvimento back-end'),
    ('00000000-0000-4000-8000-000000000204', 'mobile', 'Desenvolvimento mobile'),
    ('00000000-0000-4000-8000-000000000205', 'games', 'Desenvolvimento de jogos'),
    ('00000000-0000-4000-8000-000000000206', 'data_science', 'Ciência de dados'),
    ('00000000-0000-4000-8000-000000000207', 'cloud_computing', 'Computação em nuvem'),
    ('00000000-0000-4000-8000-000000000208', 'artificial_intelligence', 'Inteligência artificial'),
    ('00000000-0000-4000-8000-000000000209', 'quality_assurance', 'Qualidade e testes de software'),
    ('00000000-0000-4000-8000-000000000210', 'sql_databases', 'Bancos de dados SQL'),
    ('00000000-0000-4000-8000-000000000211', 'nosql_databases', 'Bancos de dados NoSQL'),
    ('00000000-0000-4000-8000-000000000212', 'quantum_computing', 'Computação quântica'),
    ('00000000-0000-4000-8000-000000000213', 'devops', 'DevOps'),
    ('00000000-0000-4000-8000-000000000214', 'ux_ui', 'UX e UI'),
    ('00000000-0000-4000-8000-000000000215', 'innovation_management', 'Inovação e gestão'),
    ('00000000-0000-4000-8000-000000000216', 'automation', 'Automação'),
    ('00000000-0000-4000-8000-000000000217', 'networks_security', 'Redes e segurança'),
    ('00000000-0000-4000-8000-000000000218', 'other', 'Outra área');

INSERT INTO track_categories (id, code, name, description) VALUES
    ('00000000-0000-4000-8000-000000000301', 'general', 'Trilha formativa', 'Categoria inicial para as Trilhas formativas do programa.');

INSERT INTO workflow_templates (
    id, code, name, version, description, is_default, is_active
) VALUES (
    '00000000-0000-4000-8000-000000000401',
    'standard_track_lifecycle',
    'Ciclo de vida padrão da Trilha',
    1,
    'Checklist ajustável criado a partir do processo operacional levantado com a equipe.',
    true,
    true
);

INSERT INTO workflow_template_tasks (
    workflow_template_id,
    code,
    phase,
    title,
    description,
    default_responsibility,
    default_due_offset_days,
    display_order,
    is_required
) VALUES
    ('00000000-0000-4000-8000-000000000401', 'send_production_kickoff_email', 'planning', 'Enviar e-mail de início da produção', 'Centralizar no e-mail as respostas e declarações da produção.', 'administrator', 0, 10, true),
    ('00000000-0000-4000-8000-000000000401', 'open_sharepoint_environment', 'planning', 'Abrir ambiente no SharePoint', 'Registrar o ambiente externo acessível por administrativo e mentor.', 'administrator', 1, 20, true),
    ('00000000-0000-4000-8000-000000000401', 'complete_proposal_scope', 'planning', 'Preencher Proposta e Escopo', NULL, 'mentor', 5, 30, true),
    ('00000000-0000-4000-8000-000000000401', 'complete_teaching_plan', 'planning', 'Preencher Plano de Ensino', NULL, 'mentor', 7, 40, true),
    ('00000000-0000-4000-8000-000000000401', 'complete_softex_spreadsheet', 'planning', 'Preencher planilha Softex', 'Atividade manual nesta versão; a planilha detalhada será modelada futuramente.', 'administrator', 7, 50, true),
    ('00000000-0000-4000-8000-000000000401', 'define_deliverables', 'planning', 'Definir e acompanhar entregáveis', NULL, 'mentor', 8, 60, true),
    ('00000000-0000-4000-8000-000000000401', 'validate_planning_documents', 'planning', 'Validar documentos de planejamento', NULL, 'administrator', 10, 70, true),

    ('00000000-0000-4000-8000-000000000401', 'produce_track_material', 'production', 'Produzir material da Trilha', 'Produzir os materiais definidos nos documentos aprovados.', 'mentor', 14, 110, true),
    ('00000000-0000-4000-8000-000000000401', 'perform_weekly_validation', 'production', 'Realizar validações semanais', 'Tarefa recorrente controlada operacionalmente até existir recorrência no sistema.', 'administrator', 21, 120, true),
    ('00000000-0000-4000-8000-000000000401', 'perform_final_production_validation', 'production', 'Realizar validação final da produção', NULL, 'administrator', 30, 130, true),

    ('00000000-0000-4000-8000-000000000401', 'publish_track', 'pre_track', 'Divulgar a Trilha', NULL, 'administrator', 35, 210, true),
    ('00000000-0000-4000-8000-000000000401', 'open_validate_teams', 'pre_track', 'Abrir e validar ambiente no Teams', 'Registrar o link e o identificador do ambiente externo.', 'administrator', 36, 220, true),
    ('00000000-0000-4000-8000-000000000401', 'analyze_eligible_students', 'pre_track', 'Analisar alunos elegíveis', 'Controle nominal de alunos permanece externo neste incremento.', 'administrator', 38, 230, true),
    ('00000000-0000-4000-8000-000000000401', 'confirm_registration_list', 'pre_track', 'Definir inscritos e confirmar alunos', 'Controle nominal de alunos permanece externo neste incremento.', 'administrator', 40, 240, true),
    ('00000000-0000-4000-8000-000000000401', 'enroll_students_in_teams', 'pre_track', 'Inscrever alunos no AVA/Teams', 'Atividade manual referente ao ambiente externo.', 'administrator', 41, 250, true),

    ('00000000-0000-4000-8000-000000000401', 'start_track', 'track', 'Iniciar a Trilha', NULL, 'administrator', 45, 310, true),
    ('00000000-0000-4000-8000-000000000401', 'monitor_classes_and_students', 'track', 'Acompanhar aulas e alunos', NULL, 'mentor', 46, 320, true),
    ('00000000-0000-4000-8000-000000000401', 'finish_track', 'track', 'Finalizar a Trilha', NULL, 'administrator', 75, 330, true),

    ('00000000-0000-4000-8000-000000000401', 'receive_mentor_results', 'post_track', 'Receber planilha de resultados do mentor', 'Inclui inscritos, atividades, provas e presença; os dados detalhados ficam para evolução futura.', 'administrator', 76, 410, true),
    ('00000000-0000-4000-8000-000000000401', 'validate_evidence', 'post_track', 'Validar evidências', NULL, 'administrator', 78, 420, true),
    ('00000000-0000-4000-8000-000000000401', 'build_final_report', 'post_track', 'Construir relatório final', NULL, 'administrator', 80, 430, true),
    ('00000000-0000-4000-8000-000000000401', 'validate_softex_annex_12', 'post_track', 'Validar Anexo 12 da planilha Softex', NULL, 'administrator', 82, 440, true),
    ('00000000-0000-4000-8000-000000000401', 'collect_digital_signature', 'post_track', 'Coletar assinatura digital', 'Assinatura realizada em serviço externo.', 'administrator', 84, 450, true),
    ('00000000-0000-4000-8000-000000000401', 'send_documents_to_softex', 'post_track', 'Enviar documentos para a Softex', NULL, 'administrator', 85, 460, true),
    ('00000000-0000-4000-8000-000000000401', 'record_softex_approval', 'post_track', 'Registrar aprovação da Softex', 'Registrar manualmente o retorno da organização externa.', 'administrator', 90, 470, true),
    ('00000000-0000-4000-8000-000000000401', 'send_certificates', 'post_track', 'Enviar certificados aos concluintes', 'Certificados e concluintes serão detalhados em evolução futura.', 'administrator', 92, 480, true);
