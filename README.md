# Sistema TIC

Este repositorio esta sendo organizado como um monorepo para centralizar banco de dados, backend, frontend, infraestrutura local e documentacao do projeto.

Neste momento, a proposta e validar a estrutura com a equipe antes de iniciar qualquer implementacao de codigo.

## Objetivo Da Estrutura

A organizacao separa claramente as responsabilidades do sistema:

- `database/`: modelagem, scripts SQL versionados, seeds e documentacao do banco.
- `backend/`: API ASP.NET Core organizada em Onion Architecture.
- `frontend/`: aplicacao Angular com Tailwind CSS.
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
│   └── docs/
├── docker/
│   └── postgres/
│       └── init/
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

## Banco De Dados

O PostgreSQL sera usado via Docker com a imagem oficial.

A proposta inicial e trabalhar sem ORM. O acesso ao banco no backend deve usar SQL explicito, mantendo as queries visiveis e versionadas quando fizer sentido.

Pastas previstas:

- `database/migrations`: scripts SQL versionados.
- `database/seeds`: dados iniciais para desenvolvimento.
- `database/docs`: documentacao do modelo do banco.

## Frontend

O frontend sera uma SPA Angular com Tailwind CSS.

A pasta `frontend/sistema-tic-web` ficara reservada para a aplicacao Angular quando a equipe aprovar o inicio dessa etapa.

## Documentacao

A pasta `docs/` deve concentrar materiais de alinhamento da equipe, como:

- arquitetura;
- endpoints;
- regras de negocio;
- fluxo de desenvolvimento;
- decisoes tecnicas relevantes.

## Decisoes A Validar Com A Equipe

- Confirmar ASP.NET Core como backend principal.
- Confirmar Angular com Tailwind no frontend.
- Confirmar PostgreSQL sem ORM.
- Confirmar Docker apenas para PostgreSQL no inicio.
- Confirmar uso de Swagger para documentacao da API.
- Confirmar desenvolvimento sequencial: banco, backend e frontend.
