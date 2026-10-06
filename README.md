# Sistema TIC

Este repositorio esta sendo organizado como um monorepo para centralizar banco de dados, backend, frontend, infraestrutura local e documentacao do projeto.

O projeto segue uma abordagem incremental: o banco, o backend e o frontend evoluem juntos, uma funcionalidade por vez, conforme as lacunas aparecem nos testes manuais. O banco PostgreSQL possui 17 migrations e 8 seeds, o backend expõe a API REST e o frontend consome a API para autenticação, membros, trilhas, documentos e relatório Softex. Algumas telas do frontend ainda usam dados simulados; o detalhamento está em `frontend/sistema-tic-web/README.md`.

## Objetivo Da Estrutura

A organizacao separa claramente as responsabilidades do sistema:

- `database/`: modelagem, scripts SQL versionados, seeds e documentacao do banco.
- `backend/`: API ASP.NET Core organizada em Onion Architecture.
- `frontend/`: aplicação React com Vite, TypeScript, React Router e Tailwind CSS.
- `docker/`: arquivos auxiliares para infraestrutura local.
- `docs/`: documentacao tecnica e funcional do projeto.

## Fluxo De Desenvolvimento

Cada funcionalidade segue a mesma ordem, de baixo para cima:

1. Banco de dados
2. Backend
3. Frontend

Essa ordem evita que a API e a interface sejam construidas antes de existir clareza sobre modelo de dados, regras principais e contratos esperados. As tabelas, endpoints e telas são criados sob demanda, quando a funcionalidade é necessária, e não todos de uma vez.

## Estrutura

```text
Sistema-TIC/
├── backend/
│   ├── backend.slnx
│   ├── src/
│   │   ├── SistemaTic.Api/
│   │   ├── SistemaTic.Domain/
│   │   ├── SistemaTic.Application/
│   │   ├── SistemaTic.Infrastructure/
│   │   ├── SistemaTic.Shared/             (reservado, ainda sem código)
│   │   └── SistemaTic.DatabaseMigrator/   (reservado, ainda sem código)
│   └── tests/
│       ├── SistemaTic.UnitTests/          (reservado, ainda sem testes)
│       └── SistemaTic.IntegrationTests/   (reservado, ainda sem testes)
├── frontend/
│   └── sistema-tic-web/
│       └── src/
├── database/
│   ├── migrations/
│   ├── seeds/
│   ├── scripts/
│   ├── tests/
│   └── docs/
├── docker/
├── docs/
├── docker-compose.yml
├── README.md
└── .gitignore
```

## Backend

O backend é uma API ASP.NET Core com arquitetura Onion. A solução é `backend/backend.slnx`.

Responsabilidades de cada projeto:

- `SistemaTic.Api`: controllers, Swagger (habilitado em desenvolvimento), configuracao HTTP, autenticação JWT com refresh token, CORS e entrada da aplicacao.
- `SistemaTic.Domain`: entidades, value objects e regras de dominio.
- `SistemaTic.Application`: casos de uso, contratos de aplicacao, DTOs internos e validacoes.
- `SistemaTic.Infrastructure`: acesso ao PostgreSQL, implementacoes de persistencia, transacoes e servicos externos.
- `SistemaTic.Shared`: tipos compartilhados somente quando houver necessidade real. Ainda não possui código.
- `SistemaTic.DatabaseMigrator`: reservado para um runner em C# de migrations SQL versionadas. Ainda não foi implementado; hoje as migrations são aplicadas por `database/scripts/apply-migrations.ps1`.

## Banco de dados

O PostgreSQL sera usado via Docker com a imagem oficial.

A proposta inicial e trabalhar sem ORM. O acesso ao banco no backend deve usar SQL explicito, mantendo as queries visiveis e versionadas quando fizer sentido.

Estrutura implementada:

- `database/migrations`: scripts SQL versionados.
- `database/seeds`: catálogos, workflow e modelos documentais iniciais.
- `database/scripts/apply-migrations.ps1` / `apply-migrations.sh`: executor com transação, checksum SHA-256 e controle em `schema_migrations`/`data_seeds`.
- `database/scripts/test-database.ps1` / `test-database.sh`: teste completo em PostgreSQL 16 isolado e descartável.
- `database/docs/initial-database-model.md`: relatório da modelagem implementada e comparação com o diagrama original.

Para iniciar somente o PostgreSQL e aplicar o banco:

Windows (PowerShell):

```powershell
Copy-Item .env.example .env
docker compose up -d postgres
.\database\scripts\apply-migrations.ps1
```

macOS/Linux (bash, sem necessidade de pwsh):

```bash
cp .env.example .env
docker compose up -d postgres
./database/scripts/apply-migrations.sh
```

Para validar as migrations em um banco limpo sem alterar o volume local de desenvolvimento:

```powershell
.\database\scripts\test-database.ps1
```

```bash
./database/scripts/test-database.sh
```

O executor não reaplica versões registradas e interrompe a execução se o conteúdo de uma versão aplicada tiver outro checksum. Uma mudança posterior deve sempre entrar em uma nova migration.

As duas branches usaram `011` para mudanças diferentes. A versão `011` permanece com o currículo do usuário, e o fluxo de revisão de documentos usa `0110`. Se o banco já registrou o fluxo como `011`, os executores reconhecem seu nome e checksum e ajustam apenas o identificador do histórico para `0110`, sem executar esse SQL novamente. O conteúdo das duas migrations foi preservado.

## Frontend

O frontend é uma SPA React com Vite, TypeScript, React Router e Tailwind CSS, gerenciada por `pnpm`, em `frontend/sistema-tic-web`. Instalação, configuração da URL da API (`VITE_API_URL`), rotas e limitações conhecidas estão em `frontend/sistema-tic-web/README.md`.

## Documentacao

A pasta `docs/` deve concentrar materiais de alinhamento da equipe, como:

- arquitetura;
- endpoints;
- regras de negocio;
- fluxo de desenvolvimento;
- decisoes tecnicas relevantes.

## Decisões confirmadas

- ASP.NET Core com Onion Architecture no backend.
- React, Vite, TypeScript, React Router e Tailwind CSS no frontend.
- `pnpm` para o workspace JavaScript.
- PostgreSQL sem ORM.
- Imagem oficial do PostgreSQL em Docker.
- Swagger para documentação da API.
- Desenvolvimento incremental e bottom-up: cada funcionalidade percorre banco, backend e frontend, à medida que a necessidade aparece.
