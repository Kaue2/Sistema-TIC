INSERT INTO document_templates (id, code, name, description) VALUES
    (
        '00000000-0000-4000-8000-000000000501',
        'proposal_scope',
        'Proposta e Escopo',
        'Formulário versionado de proposta e escopo da Trilha.'
    ),
    (
        '00000000-0000-4000-8000-000000000502',
        'teaching_plan',
        'Plano de Ensino',
        'Formulário versionado do plano pedagógico da Trilha.'
    );

INSERT INTO document_template_versions (
    id,
    document_template_id,
    version,
    schema_definition,
    change_notes,
    is_published,
    published_at
) VALUES
    (
        '00000000-0000-4000-8000-000000000511',
        '00000000-0000-4000-8000-000000000501',
        1,
        $proposal$
        {
          "schema_version": 1,
          "sections": [
            {
              "code": "identification",
              "title": "Identificação",
              "fields": [
                {"code": "mentor_name", "type": "text", "required": true},
                {"code": "mentor_lattes_url", "type": "url", "required": false},
                {"code": "knowledge_area", "type": "knowledge_area_reference", "required": true},
                {"code": "knowledge_subareas", "type": "text_list", "required": false},
                {"code": "suggested_names", "type": "text_list", "required": true},
                {"code": "presentation", "type": "textarea", "required": true, "max_length": 300}
              ]
            },
            {
              "code": "execution",
              "title": "Execução",
              "fields": [
                {"code": "execution_start_date", "type": "date", "required": true},
                {"code": "execution_end_date", "type": "date", "required": true},
                {"code": "modality", "type": "select", "required": true, "options": ["online", "hybrid"]},
                {"code": "online_workload_minutes", "type": "integer", "required": true, "minimum": 0},
                {"code": "in_person_workload_minutes", "type": "integer", "required": true, "minimum": 0},
                {"code": "suggested_in_person_times", "type": "text_list", "required": false},
                {"code": "planned_capacity", "type": "integer", "required": false, "minimum": 1}
              ]
            },
            {
              "code": "audience",
              "title": "Público e requisitos",
              "fields": [
                {"code": "target_audience", "type": "textarea", "required": true},
                {"code": "registration_start_date", "type": "date", "required": false},
                {"code": "registration_end_date", "type": "date", "required": false},
                {"code": "prerequisites", "type": "textarea", "required": false},
                {"code": "attendance_requirement_percent", "type": "decimal", "required": false, "minimum": 0, "maximum": 100},
                {"code": "learning_level", "type": "select", "required": false, "options": ["introductory", "intermediate", "advanced"]}
              ]
            },
            {
              "code": "resources_competencies",
              "title": "Recursos e competências",
              "fields": [
                {"code": "software_requirements", "type": "text_list", "required": false},
                {"code": "equipment_requirements", "type": "text_list", "required": false},
                {"code": "technical_competencies", "type": "text_list", "required": true},
                {"code": "nontechnical_competencies", "type": "text_list", "required": false},
                {"code": "knowledge_dimensions", "type": "text_list", "required": false}
              ]
            }
          ]
        }
        $proposal$::jsonb,
        'Versão inicial baseada no modelo pedagógico analisado.',
        true,
        clock_timestamp()
    ),
    (
        '00000000-0000-4000-8000-000000000512',
        '00000000-0000-4000-8000-000000000502',
        1,
        $teaching_plan$
        {
          "schema_version": 1,
          "sections": [
            {
              "code": "overview",
              "title": "Visão geral",
              "fields": [
                {"code": "introduction", "type": "rich_text", "required": true},
                {"code": "general_teaching_objective", "type": "rich_text", "required": true},
                {"code": "general_learning_objective", "type": "rich_text", "required": true},
                {"code": "context", "type": "rich_text", "required": false}
              ]
            },
            {
              "code": "bibliography",
              "title": "Bibliografia",
              "fields": [
                {"code": "basic_references", "type": "text_list", "required": true},
                {"code": "complementary_references", "type": "text_list", "required": false}
              ]
            },
            {
              "code": "modules",
              "title": "Módulos e unidades",
              "fields": [
                {
                  "code": "items",
                  "type": "repeating_group",
                  "required": true,
                  "fields": [
                    {"code": "title", "type": "text", "required": true},
                    {"code": "description", "type": "textarea", "required": false},
                    {"code": "general_objective", "type": "textarea", "required": false},
                    {
                      "code": "learning_units",
                      "type": "repeating_group",
                      "required": true,
                      "fields": [
                        {"code": "title", "type": "text", "required": true},
                        {"code": "learning_objectives", "type": "textarea", "required": true},
                        {"code": "topic", "type": "text", "required": true},
                        {"code": "content", "type": "rich_text", "required": true},
                        {"code": "assessment_strategy", "type": "textarea", "required": false},
                        {"code": "resources", "type": "textarea", "required": false},
                        {"code": "delivery_mode", "type": "select", "required": true, "options": ["online_async", "in_person"]},
                        {"code": "workload_minutes", "type": "integer", "required": true, "minimum": 1}
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
        $teaching_plan$::jsonb,
        'Versão inicial baseada no Plano de Ensino analisado.',
        true,
        clock_timestamp()
    );
