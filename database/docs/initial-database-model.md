# Relatório de Modelagem do Banco de Dados Inicial

## 1. Objetivo

Este relatório descreve a modelagem implementada para o primeiro incremento do Sistema TIC. O escopo acompanha as semanas S1 a S5 do cronograma: autenticação, perfil de colaboradores, gestão de Trilhas, calendário, Proposta/Escopo, Plano de Ensino e notificações.

O banco usa PostgreSQL sem ORM, com migrations SQL incrementais. Tabelas e colunas usam nomes em inglês no padrão `snake_case`. Identificadores de negócio usam `uuid`, datas com horário usam `timestamptz` e alterações relevantes são auditadas.

Esta modelagem substituiu os scripts exploratórios de `docker/postgres/init`, que usavam `SERIAL`, possuíam apenas o papel administrativo e inseriam um usuário fictício.

O incremento foi implementado em quatro migrations e dois seeds. O executor calcula SHA-256, registra cada versão e impede que um arquivo já aplicado seja alterado silenciosamente. A validação automatizada foi executada em PostgreSQL 16 vazio e também confirmou que uma segunda execução não reaplica migrations nem seeds.

## 2. Principais mudanças em relação ao diagrama original

| Tema | Modelo original | Modelo implementado | Motivo |
| --- | --- | --- | --- |
| Trilha e oferta | `TRILHA` reutilizável gerando `OFERTA_TRILHA` | Cada registro de `tracks` representa uma realização única; uma reabertura referencia a anterior por `source_track_id` | Cada realização tem ciclo, equipe, calendário e histórico próprios |
| Ideias | A criação começava diretamente na Trilha | `track_ideas` mantém um backlog antes da conversão em Trilha | Preserva ideias avaliadas ou rejeitadas sem criar Trilhas falsas |
| Papéis | Relação muitos-para-muitos `USUARIO_PAPEL` | Cada usuário possui exatamente um papel global em `users.role_id` | Decisão funcional: Coordenador, Administrativo, Mentor ou Monitor |
| Cargo | Não existia separação entre papel e cargo | `job_positions` e `user_job_positions` | Papel controla acesso; cargo representa a posição institucional e mantém histórico |
| Senhas | Senha armazenada junto ao usuário | Credenciais isoladas em `user_credentials`, com senha provisória e troca obrigatória | Reduz exposição e deixa as regras de autenticação explícitas |
| Importação | Não modelada | `user_import_batches` e `user_import_rows` | Permite cadastro de colaboradores por planilha com erros por linha |
| Workflow | Estado concentrado na oferta | Modelo padrão clonável em tarefas independentes por fase | Trilhas trabalham em paralelo e não precisam de bloqueios rígidos entre fases |
| Modalidade | Texto livre | Apenas `online` e `hybrid`, com validações | Online é assíncrona; híbrida combina conteúdo online e encontros presenciais |
| Salas | Um campo de local na oferta | Sala e capacidade são fotografadas em `track_events` | A reserva ocorre no sistema da faculdade; o Sistema TIC registra apenas o resultado |
| Documentos | Versões completas em JSONB | Conteúdo atual mais revisões contendo somente diferenças por campo | Evita cópias repetidas e mantém autoria de cada alteração |
| Modelos documentais | Estrutura fixa implícita | `document_template_versions` guarda a estrutura de cada versão | Mudanças de formulário só afetam novas Trilhas |
| Arquivos | Arquivos genéricos sem política de armazenamento | `file_assets` guarda somente metadados e chave externa | Fotos, documentos, vídeos e evidências não ficam como binário no PostgreSQL |
| Softex | Relatórios, respostas e Anexo 12 no primeiro diagrama | Detalhamento adiado para migrations futuras | Os modelos ainda estão sendo definidos fora do sistema |
| Alunos | Inscrições, AVA, atividades, presença e certificado | Fora do primeiro incremento | A lista de alunos continuará externa até o módulo de inscrições |

### 2.1. Destino de cada tabela do diagrama original

O diagrama anterior não será descartado. Ele será dividido entre o banco inicial e migrations futuras, conforme o mapa abaixo.

| Tabela original | Destino após o planejamento | Implementação |
| --- | --- | --- |
| `USUARIO` | Dividida | `users` mantém identidade e papel; `user_credentials` mantém a senha; `user_profiles`, `user_contacts`, `user_availability` e `user_job_positions` completam o perfil |
| `PAPEL` | Mantida e renomeada | `roles`, inicialmente com Coordenador, Administrativo, Mentor e Monitor |
| `USUARIO_PAPEL` | Removida | `users.role_id` garante um único papel vigente; mudanças ficam em `audit_events` |
| `TRILHA` | Mantida e ampliada | `tracks` passa a representar uma realização única e recebe modalidade, período, cargas horárias, situação, categoria e planejamento de vagas |
| `MODULO_TRILHA` | Mantida e renomeada | `track_modules` |
| `ENCONTRO_MODULO` | Dividida | `track_learning_units` mantém conteúdo pedagógico; `track_events` mantém datas, horários e sala dos encontros híbridos |
| `OFERTA_TRILHA` | Incorporada em `tracks` | Não haverá uma oferta separada: uma reoferta é uma nova Trilha ligada à anterior por `source_track_id` |
| `OFERTA_RESPONSAVEL` | Mantida e renomeada | `track_team_members`, com vários responsáveis e indicação de líder |
| `TIPO_DOCUMENTO` | Ampliada | `document_templates` e `document_template_versions` permitem alterar a estrutura dos formulários sem afetar documentos antigos |
| `DOCUMENTO_OFERTA` | Mantida e renomeada | `track_documents` |
| `VERSAO_DOCUMENTO` | Redesenhada | `document_revisions` agrupa revisões e `document_revision_changes` guarda apenas diferenças por campo |
| `APROVACAO_DOCUMENTO` | Mantida e renomeada | `document_reviews`, com decisões de aprovação, rejeição ou solicitação de ajustes |
| `ARQUIVO` | Mantida e renomeada | `file_assets`, somente com metadados, hash e localização externa; nenhum binário será salvo no PostgreSQL |
| `ARQUIVO_VINCULO` | Removida como relação polimórfica | Vínculos explícitos, como `document_revision_files` e `user_profiles.photo_file_id`, preservam integridade referencial |
| `ALUNO` | Adiada | Migration futura do módulo de estudantes |
| `INSCRICAO` | Adiada | Migration futura do módulo de seleção e inscrições |
| `TIPO_PENDENCIA` | Adiada | Será redesenhada com o fluxo real de análise de candidatos |
| `PENDENCIA_INSCRICAO` | Adiada | Migration futura de inscrições |
| `MATRICULA_AVA` | Adiada | Futuro registro da inclusão no Teams; a integração automática não faz parte do V1 |
| `ATIVIDADE_OFERTA` | Adiada | Futuro módulo acadêmico, ligado à Trilha e às unidades de aprendizagem |
| `ENTREGA_ATIVIDADE` | Adiada | Futuro módulo acadêmico por inscrição do aluno |
| `RESULTADO_FINAL_ALUNO` | Adiada | Futuro módulo de fechamento e certificação |
| `MODELO_RELATORIO` | Adiada | Será substituída por modelos versionados da Softex quando os documentos forem estabilizados |
| `ITEM_MODELO_RELATORIO` | Adiada | Futura definição versionada dos itens Softex |
| `RELATORIO_OFERTA` | Adiada | Futuro relatório por Trilha |
| `RESPOSTA_ITEM_RELATORIO` | Adiada | Futuras respostas aos itens do modelo Softex |
| `CERTIFICADO` | Adiada | Futuro módulo de conclusão e certificados |
| `COMUNICACAO` | Dividida | Avisos internos entram agora em `notifications`; e-mails, WhatsApp e comunicações com alunos serão modelados depois |
| `HISTORICO_EVENTO` | Mantida e generalizada | `audit_events`, com diferenças estruturadas em JSONB, ator, entidade e correlação |

O relacionamento direto entre `TIPO_PENDENCIA` e `ALUNO` exibido ao final do diagrama original será removido. Uma pendência pertence a uma inscrição específica, nunca diretamente ao aluno nem em uma relação muitos-para-muitos com tipos de pendência.

## 3. Convenções gerais

- Chaves primárias: `uuid` com `gen_random_uuid()`.
- E-mails: `citext` e restrição `unique`, evitando duplicidade por diferença entre maiúsculas e minúsculas.
- Datas de auditoria: `created_at`, `updated_at` e `timestamptz`.
- Exclusão: registros históricos não serão apagados fisicamente; usuários e catálogos serão desativados.
- Estados controlados: restrições `check` ou catálogos, evitando textos arbitrários.
- Valores de carga horária: minutos inteiros; o total será calculado a partir das parcelas presencial e online.
- Conteúdo documental variável: `jsonb`, vinculado a uma versão imutável de modelo.
- Arquivos: somente metadados, URL/chave externa, MIME type, tamanho e hash.
- Auditoria: diferenças em JSONB, ator, entidade, ação, data e correlação da operação.

## 4. Migration 001 — Fundação e catálogos

### Tabelas

| Tabela | Finalidade | Campos principais |
| --- | --- | --- |
| `schema_migrations` | Controlar scripts já aplicados | `version`, `name`, `checksum_sha256`, `applied_at` |
| `data_seeds` | Controlar seeds já aplicados | `version`, `name`, `checksum_sha256`, `applied_at` |
| `roles` | Papéis globais do sistema | `id`, `code`, `name`, `description`, `is_active` |
| `job_positions` | Catálogo de cargos institucionais | `id`, `code`, `name`, `description`, `is_active` |
| `knowledge_areas` | Catálogo administrável de áreas de conhecimento | `id`, `code`, `name`, `description`, `is_active` |
| `track_categories` | Grupos usados nos filtros de Trilhas | `id`, `code`, `name`, `description`, `is_active` |
| `audit_events` | Histórico transversal de alterações | `id`, `actor_user_id`, `entity_type`, `entity_id`, `action`, `changes`, `correlation_id`, `occurred_at` |

Os papéis iniciais são `coordinator`, `administrator`, `mentor` e `monitor`. O Coordenador é o único papel autorizado a criar usuários e alterar papéis quando `app.current_user_id` identifica o ator da operação; a migration já aplica essa proteção no banco, e o backend deverá reforçá-la posteriormente.

## 5. Migration 002 — Usuários e colaboradores

```mermaid
erDiagram
    ROLES ||--o{ USERS : classifies
    USERS ||--|| USER_CREDENTIALS : authenticates_with
    USERS ||--|| USER_PROFILES : owns
    USERS ||--o{ USER_CONTACTS : has
    USERS ||--o{ USER_AVAILABILITY : declares
    USERS ||--o{ USER_JOB_POSITIONS : occupies
    JOB_POSITIONS ||--o{ USER_JOB_POSITIONS : classifies
    USERS ||--o{ USER_IMPORT_BATCHES : imports
    USER_IMPORT_BATCHES ||--o{ USER_IMPORT_ROWS : contains
    USERS o|--o{ USER_IMPORT_ROWS : creates
    USERS ||--o{ FILE_ASSETS : uploads
    FILE_ASSETS o|--o| USER_PROFILES : represents_photo

    ROLES {
        uuid id PK
        varchar code UK
        varchar name
        boolean is_active
    }
    USERS {
        uuid id PK
        uuid role_id FK
        citext email UK
        varchar full_name
        varchar status
        timestamptz created_at
        timestamptz updated_at
    }
    USER_CREDENTIALS {
        uuid user_id PK, FK
        text password_hash
        boolean must_change_password
        timestamptz temporary_password_expires_at
        timestamptz password_changed_at
        integer failed_attempts
        timestamptz locked_until
    }
    USER_PROFILES {
        uuid user_id PK, FK
        uuid photo_file_id FK
        varchar preferred_name
        varchar work_location
        integer weekly_workload_minutes
        text biography
        text lattes_url
    }
    USER_CONTACTS {
        uuid id PK
        uuid user_id FK
        varchar contact_type
        varchar label
        varchar contact_value
        boolean is_primary
    }
    USER_AVAILABILITY {
        uuid id PK
        uuid user_id FK
        smallint weekday
        time starts_at
        time ends_at
        varchar timezone
    }
    JOB_POSITIONS {
        uuid id PK
        varchar code UK
        varchar name
        boolean is_active
    }
    USER_JOB_POSITIONS {
        uuid id PK
        uuid user_id FK
        uuid job_position_id FK
        date starts_on
        date ends_on
        uuid created_by_user_id FK
    }
    FILE_ASSETS {
        uuid id PK
        uuid uploaded_by_user_id FK
        varchar provider
        text storage_key
        text external_url
        varchar original_file_name
        varchar media_type
        bigint size_bytes
        char sha256
    }
    USER_IMPORT_BATCHES {
        uuid id PK
        uuid imported_by_user_id FK
        uuid source_file_id FK
        varchar status
        integer total_rows
        integer successful_rows
        integer failed_rows
    }
    USER_IMPORT_ROWS {
        uuid id PK
        uuid batch_id FK
        uuid imported_user_id FK
        integer row_number
        jsonb raw_data
        varchar status
        jsonb error_messages
    }
```

### Regras importantes

- Um usuário possui um único `role_id` ativo.
- O e-mail de acesso é obrigatório e único sem diferenciar maiúsculas e minúsculas.
- A senha provisória nunca será armazenada em texto puro; somente seu hash será persistido.
- `must_change_password = true` limita o primeiro acesso à troca de senha.
- Apenas um cargo pode ter `ends_on is null` para o mesmo usuário.
- Blocos de disponibilidade do mesmo usuário não podem ter horários inválidos; sobreposições serão rejeitadas.
- A planilha de importação é processada linha a linha e os erros não impedem o registro das linhas válidas.

## 6. Migration 003 — Ideias, Trilhas, workflow, calendário e currículo

```mermaid
erDiagram
    USERS ||--o{ TRACK_IDEAS : registers
    TRACK_IDEAS o|--o| TRACKS : becomes
    TRACKS o|--o{ TRACKS : originates
    KNOWLEDGE_AREAS ||--o{ TRACKS : classifies
    TRACK_CATEGORIES ||--o{ TRACKS : groups
    TRACKS ||--o{ TRACK_TEAM_MEMBERS : has
    TRACKS ||--o{ TRACK_REUSE_ITEMS : records_reuse
    USERS ||--o{ TRACK_TEAM_MEMBERS : participates
    WORKFLOW_TEMPLATES ||--o{ WORKFLOW_TEMPLATE_TASKS : defines
    TRACKS ||--o{ TRACK_TASKS : plans
    WORKFLOW_TEMPLATE_TASKS o|--o{ TRACK_TASKS : originates
    TRACK_TASKS ||--o{ TRACK_TASK_ASSIGNEES : assigned_to
    USERS ||--o{ TRACK_TASK_ASSIGNEES : receives
    TRACKS ||--o{ TRACK_EVENTS : schedules
    TRACKS ||--o{ TRACK_MODULES : contains
    TRACK_MODULES ||--o{ TRACK_LEARNING_UNITS : contains
    TRACK_EVENTS o|--o| TRACK_LEARNING_UNITS : schedules
    TRACKS ||--o{ TRACK_REQUIREMENTS : requires
    TRACKS ||--o{ TRACK_COMPETENCIES : develops
    TRACKS ||--o{ TRACK_EXTERNAL_RESOURCES : references

    TRACK_IDEAS {
        uuid id PK
        uuid proposed_by_user_id FK
        uuid suggested_knowledge_area_id FK
        varchar title
        text description
        varchar status
        uuid reviewed_by_user_id FK
        text review_notes
        timestamptz created_at
        timestamptz reviewed_at
    }
    TRACKS {
        uuid id PK
        uuid idea_id FK, UK
        uuid source_track_id FK
        uuid knowledge_area_id FK
        uuid category_id FK
        varchar code UK
        varchar title
        varchar short_description
        varchar modality
        varchar learning_level
        varchar status
        date planned_production_starts_on
        date planned_production_ends_on
        date planned_track_starts_on
        date planned_track_ends_on
        timestamptz registration_starts_at
        timestamptz registration_ends_at
        integer online_workload_minutes
        integer in_person_workload_minutes
        integer total_workload_minutes
        integer planned_capacity
        text target_audience
        text prerequisites
        uuid created_by_user_id FK
    }
    TRACK_REUSE_ITEMS {
        uuid id PK
        uuid track_id FK
        uuid source_track_id FK
        varchar item_type
        uuid source_entity_id
        uuid copied_entity_id
        uuid copied_by_user_id FK
    }
    TRACK_TEAM_MEMBERS {
        uuid id PK
        uuid track_id FK
        uuid user_id FK
        varchar responsibility
        boolean is_lead
        date starts_on
        date ends_on
    }
    WORKFLOW_TEMPLATES {
        uuid id PK
        varchar code
        integer version
        varchar name
        boolean is_default
        boolean is_active
    }
    WORKFLOW_TEMPLATE_TASKS {
        uuid id PK
        uuid workflow_template_id FK
        varchar code
        varchar phase
        varchar title
        text description
        varchar default_responsibility
        integer default_due_offset_days
        integer display_order
        boolean is_required
    }
    TRACK_TASKS {
        uuid id PK
        uuid track_id FK
        uuid source_template_task_id FK
        varchar phase
        varchar code
        varchar title
        text description
        varchar status
        timestamptz due_at
        integer display_order
        boolean is_required
        timestamptz completed_at
    }
    TRACK_TASK_ASSIGNEES {
        uuid track_task_id PK, FK
        uuid user_id PK, FK
        timestamptz assigned_at
    }
    TRACK_EVENTS {
        uuid id PK
        uuid track_id FK
        varchar event_type
        varchar title
        text description
        timestamptz starts_at
        timestamptz ends_at
        varchar timezone
        varchar location_name
        varchar room_name
        integer room_capacity
        text external_reference
    }
    TRACK_MODULES {
        uuid id PK
        uuid track_id FK
        integer display_order
        varchar title
        text description
        text general_objective
    }
    TRACK_LEARNING_UNITS {
        uuid id PK
        uuid module_id FK
        uuid scheduled_event_id FK
        integer display_order
        varchar title
        text learning_objectives
        text topic
        text content
        text assessment_strategy
        text resources
        varchar delivery_mode
        integer workload_minutes
    }
    TRACK_REQUIREMENTS {
        uuid id PK
        uuid track_id FK
        varchar requirement_type
        text description
        boolean is_mandatory
    }
    TRACK_COMPETENCIES {
        uuid id PK
        uuid track_id FK
        varchar competency_type
        text description
    }
    TRACK_EXTERNAL_RESOURCES {
        uuid id PK
        uuid track_id FK
        varchar resource_type
        varchar name
        text external_url
        varchar external_id
    }
```

### Estados e fases

- Ideia: `new`, `under_review`, `accepted`, `rejected`, `archived`.
- Trilha: `draft`, `planning`, `production`, `pre_track`, `running`, `post_track`, `completed`, `cancelled`.
- Fase de tarefa: `planning`, `production`, `pre_track`, `track`, `post_track`.
- Tarefa: `todo`, `in_progress`, `blocked`, `done`, `cancelled`.

O estado geral da Trilha serve para filtro e comunicação. Ele não bloqueia automaticamente tarefas de outras fases, pois o trabalho pode ocorrer em paralelo.

### Regras de modalidade

- `online`: carga presencial igual a zero; unidades de aprendizagem somente `online_async`; não existem aulas síncronas para alunos.
- `hybrid`: deve possuir carga online e presencial; unidades podem ser `online_async` ou `in_person`.
- Um evento `hybrid_class` só pode pertencer a uma Trilha híbrida e exige `room_name` e `room_capacity`.
- Não haverá validação de conflito de sala, porque a reserva ocorre no sistema da faculdade.
- A capacidade registrada é apenas uma referência de planejamento. Alunos e lista final não fazem parte deste incremento.

### Reabertura de Trilha

Uma reabertura cria uma nova linha em `tracks` e preenche `source_track_id`. As cópias seletivas de workflow, currículo, documentos, requisitos e competências ficam registradas em `track_reuse_items`. Equipe, calendário, tarefas concluídas, evidências e participantes nunca são compartilhados entre as duas Trilhas.

## 7. Migration 004 — Documentos e notificações

```mermaid
erDiagram
    DOCUMENT_TEMPLATES ||--o{ DOCUMENT_TEMPLATE_VERSIONS : versions
    DOCUMENT_TEMPLATE_VERSIONS ||--o{ TRACK_DOCUMENTS : instantiates
    TRACKS ||--o{ TRACK_DOCUMENTS : owns
    TRACK_DOCUMENTS ||--o{ DOCUMENT_REVISIONS : records
    DOCUMENT_REVISIONS ||--o{ DOCUMENT_REVISION_CHANGES : contains
    USERS ||--o{ DOCUMENT_REVISION_CHANGES : authors
    DOCUMENT_REVISIONS ||--o{ DOCUMENT_REVIEWS : receives
    USERS ||--o{ DOCUMENT_REVIEWS : decides
    DOCUMENT_REVISIONS ||--o{ DOCUMENT_REVISION_FILES : references
    FILE_ASSETS ||--o{ DOCUMENT_REVISION_FILES : identifies
    USERS ||--o{ NOTIFICATIONS : creates
    NOTIFICATIONS ||--o{ NOTIFICATION_RECIPIENTS : delivers
    USERS ||--o{ NOTIFICATION_RECIPIENTS : receives

    DOCUMENT_TEMPLATES {
        uuid id PK
        varchar code UK
        varchar name
        text description
        boolean is_active
    }
    DOCUMENT_TEMPLATE_VERSIONS {
        uuid id PK
        uuid document_template_id FK
        integer version
        jsonb schema_definition
        boolean is_published
        uuid created_by_user_id FK
        timestamptz published_at
    }
    TRACK_DOCUMENTS {
        uuid id PK
        uuid track_id FK
        uuid document_template_id FK
        uuid template_version_id FK
        varchar status
        jsonb current_content
        text sharepoint_url
        varchar sharepoint_item_id
        integer current_revision_number
        uuid created_by_user_id FK
        uuid updated_by_user_id FK
    }
    DOCUMENT_REVISIONS {
        uuid id PK
        uuid track_document_id FK
        integer revision_number
        varchar status
        text summary
        uuid created_by_user_id FK
        timestamptz submitted_at
    }
    DOCUMENT_REVISION_CHANGES {
        bigint id PK
        uuid document_revision_id FK
        integer change_order
        text field_path
        varchar operation
        jsonb old_value
        jsonb new_value
        uuid changed_by_user_id FK
        timestamptz changed_at
    }
    DOCUMENT_REVIEWS {
        uuid id PK
        uuid document_revision_id FK
        uuid reviewer_user_id FK
        varchar decision
        text comments
        timestamptz reviewed_at
    }
    DOCUMENT_REVISION_FILES {
        uuid document_revision_id PK, FK
        uuid file_asset_id PK, FK
        varchar purpose
        uuid attached_by_user_id FK
    }
    NOTIFICATIONS {
        uuid id PK
        uuid created_by_user_id FK
        varchar notification_type
        varchar title
        text message
        uuid track_id FK
        uuid track_task_id FK
        uuid track_document_id FK
        timestamptz created_at
    }
    NOTIFICATION_RECIPIENTS {
        uuid notification_id PK, FK
        uuid user_id PK, FK
        timestamptz delivered_at
        timestamptz read_at
    }
```

### Modelos iniciais

Foram cadastrados dois modelos:

1. `proposal_scope`: baseado no documento Proposta e Escopo, com os dados operacionais relevantes também normalizados em `tracks`, `track_requirements` e `track_competencies`.
2. `teaching_plan`: baseado no Plano de Ensino, com módulos e unidades normalizados em `track_modules` e `track_learning_units`.

Campos variáveis ou que não precisam de filtro permanecem em `TRACK_DOCUMENTS.current_content`. Isso permite alterar a estrutura dos formulários sem criar uma coluna SQL para cada nova pergunta.

### Versionamento por diferenças

- O documento possui somente um conteúdo completo atual em `current_content`.
- Uma revisão agrupa as alterações realizadas antes de cada submissão.
- Cada diferença registra caminho do campo, operação, valor anterior, valor novo, autor e horário.
- Revisões submetidas são imutáveis.
- A reconstrução histórica começa em um objeto vazio e reaplica as alterações na ordem das revisões.
- Uma nova versão de modelo é usada apenas por documentos criados depois de sua publicação.
- Arquivos e evidências não são copiados; cada revisão referencia a versão externa por `file_assets`.
- Decisões administrativas possíveis: `approved`, `changes_requested` e `rejected`.

### Notificações

Notificações automáticas já são geradas para atribuição de tarefa, submissão e validação de documento. O tipo `task_due` deixa o esquema preparado para o futuro processo agendado de proximidade de prazo. Avisos manuais usam o mesmo modelo, e a leitura é individual em `notification_recipients.read_at`.

## 8. Dados fora do primeiro incremento

As seguintes estruturas do diagrama original não serão criadas agora:

- alunos e dados pessoais de estudantes;
- candidaturas, inscrições, pendências e confirmação de lista;
- matrícula no Teams/AVA;
- presença, avaliações, atividades e notas;
- resultado final e certificado;
- relatórios de prestação de contas, respostas Softex e Anexo 12;
- assinatura digital;
- envio automático de e-mails, integração com Teams ou SharePoint;
- catálogo ou motor de reserva de salas.

Esses módulos serão adicionados por migrations futuras, usando `tracks`, `track_events`, `file_assets` e `track_external_resources` como pontos de integração.

## 9. Ordem de implementação e validação

1. As quatro migrations são aplicadas na ordem numérica pelo script `database/scripts/apply-migrations.ps1`.
2. Os seeds cadastram papéis, cargos, áreas, categoria, 26 tarefas do workflow padrão e as versões iniciais dos dois modelos documentais.
3. O `psql` do container oficial aplica cada arquivo em uma transação e registra seu SHA-256.
4. O script `database/scripts/test-database.ps1` sobe uma instância isolada, executa os testes de regras e repete o executor para validar idempotência.
5. Os scripts exploratórios e o usuário fictício foram removidos de `docker/postgres/init`.

## 10. Decisões ainda deliberadamente adiadas

- Estrutura definitiva dos relatórios Softex.
- Campos pessoais, critérios e retenção de dados dos alunos.
- Forma de importar planilhas de presença e atividades do Teams.
- Provedor de armazenamento de produção; o banco já ficará independente dessa escolha.
- Regras finais de conclusão, presença e certificação.
