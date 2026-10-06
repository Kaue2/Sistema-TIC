# TIC em Trilhas — Front-end

Interface web do sistema **TIC em Trilhas**, desenvolvida com React, TypeScript, Vite e Tailwind CSS. O projeto está em integração progressiva com a API ASP.NET Core do monorepo: login, renovação de sessão, membros, perfil, trilhas, documentos e anexos do relatório Softex já usam a API. Algumas telas ainda usam dados simulados no navegador; a lista está em [Limitações conhecidas](#limitações-conhecidas).

## Tecnologias

- React 19 e TypeScript
- Vite 8
- React Router 7
- Tailwind CSS 4
- SheetJS (`xlsx`) para importar e gerar planilhas de membros
- ESLint para análise estática

## Pré-requisitos

- Node.js 22 ou superior
- pnpm 11 ou superior

As versões usadas no ambiente atual são Node.js `22.13.1` e pnpm `11.12.0`.

## Instalação

No diretório `frontend/sistema-tic-web`, instale as dependências:

```bash
pnpm install
```

## Configuração da API

O cliente HTTP (`src/services/api.ts`) usa a variável `VITE_API_URL` como URL base da API. Sem ela, o padrão é `http://localhost:5000/api/`. Para apontar para a API local iniciada pelo perfil `http` do projeto `SistemaTic.Api`, crie um arquivo `.env.local` neste diretório:

```bash
VITE_API_URL=http://localhost:5246/api/
```

A API só aceita requisições das origens definidas em `CORS_ALLOWED_ORIGINS` (em desenvolvimento, `http://localhost:5173` e `http://localhost:4173`).

## Executar o front-end

### Desenvolvimento

```bash
pnpm dev
```

O Vite exibirá a URL local no terminal; normalmente é `http://localhost:5173`.

Para disponibilizar o servidor na rede local:

```bash
pnpm dev --host 0.0.0.0
```

### Prévia da build de produção

```bash
pnpm build
pnpm preview
```

## Comandos individuais

| Comando | Finalidade |
| --- | --- |
| `pnpm dev` | Inicia o servidor de desenvolvimento com atualização automática. |
| `pnpm lint` | Executa o ESLint no projeto. |
| `pnpm typecheck` | Verifica os tipos TypeScript sem gerar arquivos de produção. |
| `pnpm build` | Valida os tipos e gera a build de produção em `dist/`. |
| `pnpm preview` | Serve localmente a build já gerada. |
| `pnpm check` | Executa lint e build em sequência; é o comando geral de validação atual. |

Ainda não há uma suíte de testes automatizados nesta versão da branch. Quando Vitest e Playwright forem incorporados, os comandos de teste serão adicionados a esta tabela.

## Escopo implementado

### Acesso e perfil

- Login real (`POST auth/login`), com token de acesso de vida curta e refresh token de uso único. Os interceptors do axios renovam o token automaticamente e encerram a sessão quando a renovação falha.
- Saída da sessão (`POST auth/logout`), que revoga o refresh token.
- Tela de boas-vindas e atualização de acesso, com troca de senha (`POST user/change-password`).
- Perfil próprio ou de outro usuário, carregado da API, com foto (envio e download), avatar, e-mails, jornada semanal e relações.

A ação "Alterar senha" das configurações do perfil ainda não está ligada (apenas registra no console); a troca de senha funciona na tela de atualização de acesso.

### Membros

- Lista de membros com visualização em lista ou cards.
- Busca, filtro e estados vazios visuais.
- Formulário de criação e edição com dados pessoais, e-mails, carga horária, jornada, local, trilhas e documentos.
- Validação visual de campos e aviso antes de sair com alterações não salvas.
- Toast de feedback ao salvar.
- Importação de um membro por planilha `.xlsx` ou `.xls`.
- Download de modelo de planilha para preencher os dados do membro.

Criar um membro envia os dados à API (`POST user/create-user`) e vincula as trilhas selecionadas (`POST track/create-track-team-member`). Os campos de frente e documentos do formulário ainda não têm endpoint e não entram no envio. O modo de edição (`/members/:id/edit`) ainda é simulado: preenche o formulário com dados fictícios e não persiste alterações.

### Trilhas

- Central de Trilhas (`/trails`) carregada da API (`GET track`), com criação de trilha por modal (`POST track/create-track`). Alguns campos dos cartões (carreira, semestre, mentores e ícone) ainda são valores provisórios.
- Detalhe da trilha (`/trails/:id`) e envio de anexos (`/trails/:id/attachments`) ainda usam os dados simulados de `src/data/mockTrails.ts` na parte visual; o envio de anexos e imagens do relatório Softex usa a API.

### Documentos

- Lista de documentos das trilhas carregada da API (`GET track/documents`).
- Editor com os formulários de Escopo e Proposta, Plano de Ensino e relatório Softex, com leitura e gravação de conteúdo (`GET/PUT track-documents/{id}`) e transições de status (enviar para revisão, devolver, concluir, reabrir, arquivar e restaurar). As ações de devolver, concluir e reabrir exigem papel de coordenador ou administrador.
- Exportação do relatório Softex em DOCX.

## Rotas disponíveis

| Rota | Tela |
| --- | --- |
| `/` | Login |
| `/access-update` | Atualização de acesso |
| `/profile/:id` | Perfil |
| `/members` | Lista de membros |
| `/members/new` | Cadastro de membro |
| `/members/:id/edit` | Edição de membro |
| `/documents` | Lista de documentos |
| `/documents/new` | Criação de documento |
| `/documents/:id` | Visualização de documento |
| `/documents/:id/edit` | Edição de documento |
| `/documents/:id/review` | Revisão de documento |
| `/notifications` | Avisos |
| `/trails` | Central de Trilhas |
| `/trails/:id` | Detalhe da trilha |
| `/trails/:id/attachments` | Anexos do relatório Softex |

## Organização do código

Os componentes da interface seguem Atomic Design:

- `atoms`: controles básicos, como botão, avatar, input, select e fundo decorativo.
- `molecules`: combinações pequenas reutilizáveis, como busca, filtro, diálogo de confirmação, importação Excel e itens de lista.
- `organisms`: blocos maiores de interface, como navegação, jornada semanal, cartão de membro e composição de perfil.
- `pages`: telas associadas às rotas da aplicação.
- `services/excel`: leitura, validação, conversão e geração de planilhas.

## Estilo e design

O CSS global está em `src/index.css` e é carregado na entrada da aplicação. Ele importa o Tailwind, define os tokens de cor institucionais e a animação de toast.

Os estilos de layout ficam nos arquivos `.tsx`, usando classes utilitárias do Tailwind. Não há CSS Modules ou arquivos de CSS específicos por componente. Os ícones usam Material Symbols, carregado pelo HTML principal.

## Limitações conhecidas

- Avisos (`/notifications`) usam dados simulados (`src/data/mockNotifications.ts`).
- Detalhe da trilha (`/trails/:id`) e a tela de anexos usam trilhas simuladas (`src/data/mockTrails.ts`); os seletores de trilha em componentes também usam esses dados como padrão.
- A edição de membro não persiste alterações, e não há endpoint para os campos de frente e documentos do formulário de membro.
- O serviço de documentos (`src/services/document/DocumentService.ts`) mantém documentos simulados em memória, e os filtros da lista usam opções de `src/data/mockDocuments.ts`.
- "Alterar senha" nas configurações do perfil ainda não está ligada.
- A busca de membros ainda precisa ser concluída funcionalmente.
- Não há suíte de testes automatizados do frontend.
