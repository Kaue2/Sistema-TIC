# Roteiro — Demo ao vivo do Sistema TIC em Trilhas

Objetivo: mostrar o ciclo completo (criar pessoa → pessoa entra e monta uma trilha →
preenche e envia documento pra revisão → perfil → equipe), reforçando em cada etapa
o que antes era manual/descentralizado (e-mail, WhatsApp, planilha, pasta compartilhada)
e agora é auto-atendido e rastreável dentro do próprio sistema.

Duração alvo: ~10-12 min de clique + narrativa. Não entrar em detalhe técnico — o ponto
é velocidade e visibilidade, não a arquitetura.

## Preparação (antes de abrir pra plateia)

- [ ] Subir banco, backend e frontend e confirmar login funcionando.
- [ ] **Trocar a foto do Julio** — hoje ela é uma imagem de teste (`hero.png`, um ícone de
      envelope) que usamos pra validar o upload. Sobe uma foto de verdade antes de apresentar.
- [ ] **Limpar (ou ignorar) as trilhas de teste** criadas durante o desenvolvimento
      (`Trilha Teste Automatizado Playwright`, `Trilha Auto Coordenador Teste`, etc.) — ou
      pelo menos evitar que elas apareçam em primeiro plano na Central de Trilhas / Documentos
      durante a demo. Se for mais rápido, cria um usuário coordenador novo só pra demo, sem
      esse histórico.
- [ ] Deixar duas janelas/abas lado a lado: uma logada como Julio (coordenador), outra pronta
      pra logar como a pessoa nova assim que ela for criada. Evita ficar entrando e saindo de
      conta no meio da apresentação.
- [ ] Ter um e-mail e nome de teste já decididos pra não perder tempo pensando no que digitar.

## 1. Julio (coordenador) cria um usuário novo

- Login como Julio → **Membros → Adicionar membro**.
- Preencher nome, e-mails, cargo, carga horária e disponibilidade semanal.
- Destacar: o sistema **não deixa salvar sem carga horária e sem pelo menos um dia de
  disponibilidade preenchido** — antes isso ficava só "combinado" informalmente e não raro
  se perdia.
- Salvar → usuário já nasce com uma senha temporária, pronto pra logar. Sem precisar abrir
  chamado de TI, sem e-mail manual de boas-vindas com senha em texto puro.

## 2. O usuário novo entra pela primeira vez

- Na outra janela, logar com o e-mail criado e a senha temporária.
- Sistema força a **troca de senha** antes de liberar o resto (tela de primeiro acesso).
- Ir em **Trilhas** e **Documentos**: mostrar que estão **vazios** para essa pessoa.
  - Ponto importante pra narrar: isso não é "não tem trilha no sistema" — é que o sistema
    só mostra pra cada pessoa as trilhas onde ela é **membro de fato**. Antes, com
    planilha/pasta compartilhada, todo mundo via (ou precisava procurar) tudo; aqui cada um
    só vê o que é dele.
- (Sugestão de melhoria pra esse momento) Já aproveitar e subir a **foto de perfil** dessa
  pessoa aqui — dá pra mostrar ao vivo que a foto aparece **na hora** no ícone de navegação
  e, mais pra frente, na aba de Membros, sem precisar recarregar a página nem pedir de novo
  ao servidor.

## 3. Criar uma trilha nova

- Pode ser o Julio ou o próprio usuário novo criando (dependendo de quem tiver o cargo certo)
  — **Trilhas → Nova Trilha**.
- Preencher nome, área de conhecimento, regime (Assíncrono/Híbrido), carga horária (24h/32h)
  e escolher mentor/monitor na hora, pela lista de membros já cadastrados.
- Salvar → a trilha aparece **imediatamente** na Central de Trilhas e, principalmente, já
  aparece na aba **Documentos** de quem criou (o criador vira membro da trilha automaticamente)
  e de quem foi vinculado como mentor/monitor — sem precisar de outro passo manual pra
  "liberar acesso".

## 4. Preencher os documentos e enviar pra revisão

- Entrar na trilha criada → abrir **Escopo e Proposta** (ou Plano de Ensino).
- Preencher os campos, **Salvar** (fica como Rascunho) e depois **Enviar p/ revisão**.
- Mostrar o status mudando de **Rascunho → Em Revisão** na tela — isso é o que substitui o
  "manda o Word por e-mail/WhatsApp pro coordenador olhar": agora o documento troca de status
  dentro do próprio sistema e fica rastreável (quem editou, quando).

## 5. Perfil do usuário

- Abrir o próprio perfil (ícone no canto) do usuário novo.
- Mostrar dados pessoais, e-mails, carga horária, disponibilidade semanal e a **foto** já
  carregada (reforça o que foi mostrado no passo 2, agora dentro da tela de perfil completa).

## 6. Aba de Membros

- Voltar pra **Membros**, mostrar o usuário novo já na lista, com foto, cargo e contato.
- Usar a busca e os filtros por cargo (Coordenação/Administração/Mentoria/Monitoria) pra
  mostrar como é rápido achar alguém — comparar com "procurar nome em planilha/lista de
  contatos".
- Trocar entre visão em lista e em cards, se der tempo — mais visual pra fechar a demo.

## O que **não** incluir na demo (ainda)

- **Aprovar/concluir, arquivar, reabrir ou devolver um documento.** Só "Enviar para revisão"
  está de fato ligado ao banco hoje — as outras transições de status (usadas no modo de
  revisão do coordenador) ainda passam por um mock em memória e **não persistem** pra
  documentos reais; clicar nelas hoje não dá erro visível, mas também não salva nada. Vale
  arrumar isso antes de prometer o ciclo completo de aprovação numa demo maior.
- Softex — ainda é 100% mock (não existe template dele no banco ainda), então mostrar esse
  tipo de documento reforça a ideia errada de que já está tudo pronto.

## Observação técnica à parte (não é pra demo, é pra lembrar depois)

O endpoint `POST /api/user/create-user` hoje não tem `[Authorize]` — qualquer um com acesso
à API consegue criar usuário sem estar logado como coordenador. Não afeta a demo (o front só
mostra essa tela pra quem já está logado), mas é um buraco de segurança que vale fechar antes
de expor esse ambiente fora da rede local.
