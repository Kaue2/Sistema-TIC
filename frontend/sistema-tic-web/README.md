# TIC em Trilhas — Front-end

Interface web do sistema **TIC em Trilhas**, desenvolvida com React, TypeScript, Vite e Tailwind CSS. O projeto está na etapa de protótipo funcional: todos os dados, ações de salvamento e perfis são simulados no navegador; ainda não existe integração com API, autenticação real ou banco de dados.

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

- Tela de login visual, com campos de e-mail e senha e controle de visibilidade da senha.
- Tela de boas-vindas e atualização de acesso.
- Perfil próprio ou de outro usuário, com avatar, e-mails, currículo, Lattes, configurações, relações e jornada semanal.

As ações de login, edição de perfil, troca de senha e saída ainda são demonstrativas.

### Membros

- Lista de membros com visualização em lista ou cards.
- Busca, filtro e estados vazios visuais.
- Formulário de criação e edição com dados pessoais, e-mails, carga horária, jornada, local, trilhas e documentos.
- Validação visual de campos e aviso antes de sair com alterações não salvas.
- Toast de feedback ao salvar.
- Importação de um membro por planilha `.xlsx` ou `.xls`.
- Download de modelo de planilha para preencher os dados do membro.

Salvar um membro atualmente apenas mostra uma confirmação visual; os dados não são enviados nem persistidos.

## Rotas disponíveis

| Rota | Tela |
| --- | --- |
| `/` | Login |
| `/welcome` | Boas-vindas |
| `/access-update` | Atualização de acesso |
| `/profile/:id` | Perfil |
| `/members` | Lista de membros |
| `/members/new` | Cadastro de membro |
| `/members/:id/edit` | Edição de membro |

Os itens de navegação para Avisos, Trilhas e Documentos já aparecem visualmente, mas suas telas e rotas ainda não fazem parte desta versão.

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

- Não há backend, API, banco de dados ou autenticação real.
- Dados de perfil e membros são mocks.
- Salvar, editar perfil e login não persistem alterações.
- Algumas opções visuais da navegação apontam para telas ainda não implementadas.
- A busca de membros ainda precisa ser concluída funcionalmente.
