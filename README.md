# Sistema TIC

Este repositorio esta sendo organizado como um monorepo para centralizar banco de dados, backend, frontend, infraestrutura local e documentacao do projeto.

O primeiro incremento do banco PostgreSQL está implementado. Backend e frontend permanecem fora deste incremento para preservar a ordem banco, backend e frontend.

## Objetivo Da Estrutura

A organizacao separa claramente as responsabilidades do sistema:

- `database/`: modelagem, scripts SQL versionados, seeds e documentacao do banco.
- `backend/`: API ASP.NET Core organizada em Onion Architecture.
- `frontend/`: aplicação React com Vite, TypeScript, React Router e Tailwind CSS.
- `docker/`: arquivos auxiliares para infraestrutura local.
- `docs/`: documentacao tecnica e funcional do projeto.

## Fluxo De Desenvolvimento Proposto

O desenvolvimento deve seguir uma ordem sequencial:

1. Banco de dados
2. Backend
3. Frontend

Essa ordem evita que a API e a interface sejam construidas antes de existir clareza sobre modelo de dados, regras principais e contratos esperados.

## Estrutura Planejada

```text
Sistema-TIC/
├── backend/
│   ├── SistemaTic.sln
│   ├── src/
│   │   ├── SistemaTic.Api/
│   │   ├── SistemaTic.Domain/
│   │   ├── SistemaTic.Application/
│   │   ├── SistemaTic.Infrastructure/
│   │   ├── SistemaTic.Shared/
│   │   └── SistemaTic.DatabaseMigrator/
│   └── tests/
│       ├── SistemaTic.UnitTests/
│       └── SistemaTic.IntegrationTests/
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

O backend sera uma API ASP.NET Core com arquitetura Onion.

Responsabilidades previstas:

- `SistemaTic.Api`: controllers, Swagger, configuracao HTTP, health checks, CORS e entrada da aplicacao.
- `SistemaTic.Domain`: entidades, value objects e regras de dominio.
- `SistemaTic.Application`: casos de uso, contratos de aplicacao, DTOs internos e validacoes.
- `SistemaTic.Infrastructure`: acesso ao PostgreSQL, implementacoes de persistencia, transacoes e servicos externos.
- `SistemaTic.Shared`: tipos compartilhados somente quando houver necessidade real.
- `SistemaTic.DatabaseMigrator`: runner para aplicar migrations SQL versionadas.

## Banco de dados

O PostgreSQL sera usado via Docker com a imagem oficial.

A proposta inicial e trabalhar sem ORM. O acesso ao banco no backend deve usar SQL explicito, mantendo as queries visiveis e versionadas quando fizer sentido.

Estrutura implementada:

- `database/migrations`: scripts SQL versionados.
- `database/seeds`: catálogos, workflow e modelos documentais iniciais.
- `database/scripts/apply-migrations.ps1`: executor com transação, checksum SHA-256 e controle em `schema_migrations`/`data_seeds`.
- `database/scripts/test-database.ps1`: teste completo em PostgreSQL 16 isolado e descartável.
- `database/docs/initial-database-model.md`: relatório da modelagem implementada e comparação com o diagrama original.

Para iniciar somente o PostgreSQL e aplicar o banco:

```powershell
Copy-Item .env.example .env
docker compose up -d postgres
.\database\scripts\apply-migrations.ps1
```

Para validar as migrations em um banco limpo sem alterar o volume local de desenvolvimento:

```powershell
.\database\scripts\test-database.ps1
```

O executor não reaplica versões registradas e interrompe a execução se o conteúdo de uma versão aplicada tiver outro checksum. Uma mudança posterior deve sempre entrar em uma nova migration.

## Frontend

O frontend será uma SPA React com Vite, TypeScript, React Router e Tailwind CSS, gerenciada por `pnpm`.

A pasta `frontend/sistema-tic-web` ficará reservada até o início da etapa de frontend.

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
- Desenvolvimento sequencial: banco, backend e frontend.
