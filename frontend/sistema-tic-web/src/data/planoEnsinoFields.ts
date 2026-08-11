import type {
  PlanoEnsinoCard,
  PlanoEnsinoContent,
} from "../types/document";

export type PlanoEnsinoStringField = {
  [K in keyof PlanoEnsinoContent]: PlanoEnsinoContent[K] extends string
    ? K
    : never;
}[keyof PlanoEnsinoContent];

export type PlanoTextareaField<K extends PlanoEnsinoStringField> = {
  id: K;
  label: string;
  description?: string;
  placeholder?: string;
  maxLength: number;
};

export type CardTextareaField<K extends keyof PlanoEnsinoCard> = {
  id: K;
  label: string;
  description?: string;
  placeholder?: string;
  maxLength: number;
};

export const ESTRUTURA_GERAL_FIELDS: PlanoTextareaField<PlanoEnsinoStringField>[] = [
  {
    id: "presentation",
    label: "Texto de apresentação",
    maxLength: 600,
    placeholder: "Descreva a apresentação da trilha...",
    description:
      "Descrever de forma concisa a proposta da trilha, contextualizando o conteúdo, destacando as ferramentas utilizadas e a metodologia.",
  },
  {
    id: "generalObjectives",
    label: "Objetivos gerais de ensino",
    maxLength: 1000,
    placeholder: "Liste os objetivos gerais de ensino...",
    description: "Listar as metas amplas que a trilha visa alcançar.",
  },
  {
    id: "basicBibliography",
    label: "Bibliografia básica",
    maxLength: 1000,
    placeholder: "Ex.: AUTOR, Título da obra, edição, ano.",
    description:
      "Recomenda-se de 3 a 5 referências, preferencialmente formatadas de acordo com as normas da ABNT.",
  },
  {
    id: "complementaryBibliography",
    label: "Bibliografia complementar",
    maxLength: 1000,
    placeholder: "Ex.: AUTOR, Título da obra, edição, ano.",
    description:
      "Recomenda-se de 3 a 5 referências, preferencialmente formatadas de acordo com as normas da ABNT.",
  },
  {
    id: "trailContext",
    label: "Contexto da trilha",
    maxLength: 1000,
    placeholder: "Descreva o contexto da trilha...",
    description:
      "Apresentar o panorama da trilha e justificar suas abordagens, explicar o foco do curso, estratégias pedagógicas e recursos utilizados (ex: VisualG). Reforçar como as estratégias promovem aprendizagem ativa e significativa.",
  },
];

export const CARD_FIELDS: CardTextareaField<keyof PlanoEnsinoCard>[] = [
  {
    id: "objectives",
    label: "Objetivos específicos de aprendizagem",
    maxLength: 2000,
    placeholder: "Descreva as competências a serem desenvolvidas...",
    description: "Competências a serem desenvolvidas a cada etapa.",
  },
  {
    id: "classTheme",
    label: "Tema da aula",
    maxLength: 100,
    placeholder: "Ex.: Introdução à linguagem C",
  },
  {
    id: "contentList",
    label: "Lista de conteúdos",
    maxLength: 500,
    placeholder: "Ex.: Variáveis, operadores, controle de fluxo",
  },
  {
    id: "evaluationStrategy",
    label: "Estratégia(s) de avaliação e de atividade",
    maxLength: 500,
    placeholder: "Descreva as estratégias de avaliação...",
  },
  {
    id: "resources",
    label: "Recursos e instrumentos",
    maxLength: 500,
    placeholder: "Ex.: VisualG, notebook, projetor",
  },
  {
    id: "workloadModality",
    label: "Modalidade e previsão de carga horária",
    maxLength: 500,
    placeholder: "Ex.: 8h assíncrona, 4h síncrona",
  },
];

export const MODULE_MAX_TITLE_LENGTH = 100;
