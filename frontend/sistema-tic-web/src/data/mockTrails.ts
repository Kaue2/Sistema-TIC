import type { Trail } from "../types/trail";

const brunaMentors = [
  {
    id: "bruna-ux",
    fullName: "Bruna Pagnotta Faria",
    role: "Mentoria UX/UI",
    email: "bruna.pagnottafaria@senacsp.edu.br",
  },
  {
    id: "bruna-pedagogica",
    fullName: "Bruna Pagnotta Faria",
    role: "Mentoria pedagógica",
    email: "bruna.pagnottafaria@senacsp.edu.br",
  },
];

const defaultProgress = [
  { label: "Geral", value: 50, featured: true },
  { label: "Escopo e Proposta", value: 50 },
  { label: "Plano de Ensino", value: 50 },
  { label: "Softex", value: 25 },
];

export const mockTrails: Trail[] = [
  {
    id: "2986",
    title: "Dominando Algoritmos com C",
    icon: "code",
    career: "Engenharia de Software",
    mentors: brunaMentors,
    semester: "2026/2",
    modality: "Híbrido",
    level: "Introdutório",
    stage: "Pré Trilha",
    description:
      "Aprenda lógica de programação na prática, abordando sequências, condições, repetições, listas e funções para criar soluções eficientes. A trilha prepara você para resolver problemas reais no dia a dia.",
    progress: defaultProgress,
  },
  {
    id: "2987",
    title: "Dominando Algoritmos com C",
    icon: "construction",
    career: "UI & User Experience",
    mentors: brunaMentors,
    semester: "2026/2",
    modality: "Híbrido",
    level: "Introdutório",
    stage: "Pré Trilha",
    description:
      "Desenvolva raciocínio lógico e aplique-o na construção de experiências digitais claras e eficientes.",
    progress: defaultProgress,
  },
  {
    id: "2988",
    title: "Dominando Algoritmos com C",
    icon: "database",
    career: "Engenharia de Dados",
    mentors: brunaMentors,
    semester: "2026/2",
    modality: "Híbrido",
    level: "Introdutório",
    stage: "Pré Trilha",
    description:
      "Conheça os fundamentos de algoritmos para estruturar soluções de dados consistentes e escaláveis.",
    progress: defaultProgress,
  },
  {
    id: "2989",
    title: "Dominando Algoritmos com C",
    icon: "nutrition",
    career: "Projetos em ecossistema Apple",
    mentors: brunaMentors,
    semester: "2026/2",
    modality: "Híbrido",
    level: "Introdutório",
    stage: "Pré Trilha",
    description:
      "Construa uma base de lógica para criar soluções no ecossistema de produtos Apple.",
    progress: defaultProgress,
  },
  {
    id: "2990",
    title: "Dominando Algoritmos com C",
    icon: "science",
    career: "Computação Quântica",
    mentors: brunaMentors,
    semester: "2026/2",
    modality: "Híbrido",
    level: "Introdutório",
    stage: "Pré Trilha",
    description:
      "Fortaleça a base de resolução de problemas para os próximos desafios da computação quântica.",
    progress: defaultProgress,
  },
  {
    id: "2991",
    title: "Dominando Algoritmos com C",
    icon: "explore",
    career: "Empregabilidade e Projeto de Vida",
    mentors: brunaMentors,
    semester: "2026/2",
    modality: "Híbrido",
    level: "Introdutório",
    stage: "Pré Trilha",
    description:
      "Pratique uma abordagem estruturada para analisar problemas e planejar caminhos profissionais.",
    progress: defaultProgress,
  },
  {
    id: "2992",
    title: "Dominando Algoritmos com C",
    icon: "query_stats",
    career: "Gestão e Inovação",
    mentors: brunaMentors,
    semester: "2026/2",
    modality: "Híbrido",
    level: "Introdutório",
    stage: "Pré Trilha",
    description:
      "Use lógica de programação para apoiar a tomada de decisão em contextos de gestão e inovação.",
    progress: defaultProgress,
  },
];

export function getTrailById(id: string | undefined): Trail | undefined {
  return mockTrails.find((trail) => trail.id === id);
}
