export type CheckboxFieldOption = {
  label: string;
  value: string;
  group?: string;
};

export const CAREER_FIELD_OPTIONS = [
  { label: "Projetos em ecossistema Apple", value: "Projetos em ecossistema Apple" },
  { label: "Engenharia de Software", value: "Engenharia de Software" },
  { label: "UI & User Experience", value: "UI & User Experience" },
  { label: "Computação Quântica", value: "Computação Quântica" },
  { label: "Engenharia de Dados", value: "Engenharia de Dados" },
  { label: "Gestão e Inovação", value: "Gestão e Inovação" },
  { label: "Empregabilidade e Projeto de Vida", value: "Empregabilidade e Projeto de Vida" },
];

export const GREAT_AREA_OPTIONS = [
  { label: "Automação", value: "Automação" },
  { label: "Cloud Computing", value: "Cloud Computing" },
  { label: "Data Science", value: "Data Science" },
  { label: "Database NoSQL", value: "Database NoSQL" },
  { label: "Database SQL", value: "Database SQL" },
  { label: "DevOps", value: "DevOps" },
  { label: "Inovação e Gestão", value: "Inovação e Gestão" },
  { label: "Inteligência Artificial", value: "Inteligência Artificial" },
  { label: "Lógica de Programação", value: "Lógica de Programação" },
  { label: "Programação Backend", value: "Programação Backend" },
  { label: "Programação Frontend", value: "Programação Frontend" },
  { label: "Programação Mobile", value: "Programação Mobile" },
  { label: "Programação para Jogos", value: "Programação para Jogos" },
  { label: "Programação Quântica", value: "Programação Quântica" },
  { label: "Quality Assurance", value: "Quality Assurance" },
  { label: "Redes & Segurança", value: "Redes & Segurança" },
  { label: "UX & UI Design", value: "UX & UI Design" },
  { label: "Outro", value: "Outro" },
];

export const MODALITY_OPTIONS = [
  { label: "Presencial", value: "Presencial" },
  { label: "On-line", value: "On-line" },
  { label: "Híbrido", value: "Híbrido" },
];

export const TARGET_AUDIENCE_OPTIONS = [
  { label: "Ensino Médio", value: "Ensino Médio", group: "Senac SP" },
  { label: "Ensino Superior presencial", value: "Ensino Superior presencial", group: "Senac SP" },
  { label: "Ensino Superior a distância", value: "Ensino Superior a distância", group: "Senac SP" },
  { label: "Pós-graduação presencial", value: "Pós-graduação presencial", group: "Senac SP" },
  { label: "Pós-graduação a distância", value: "Pós-graduação a distância", group: "Senac SP" },
  { label: "Colaboradores", value: "Colaboradores", group: "Senac SP" },
  { label: "Parceiros", value: "Parceiros", group: "Externo" },
  { label: "Outros", value: "Outros", group: "Externo" },
];

export const WORKLOAD_OPTIONS = [
  { label: "24 horas", value: "24 horas" },
  { label: "32 horas", value: "32 horas" },
  { label: "Outro", value: "Outro" },
];

export const LEVEL_OPTIONS = [
  { label: "Introdutório", value: "Introdutório" },
  { label: "Intermediário", value: "Intermediário" },
  { label: "Avançado", value: "Avançado" },
];

export const NON_TECHNICAL_COMPETENCY_OPTIONS = [
  { label: "Desenvolver habilidades específicas e técnicas voltadas para as demandas atuais do mercado de trabalho.", value: "Desenvolver habilidades específicas e técnicas voltadas para as demandas atuais do mercado de trabalho." },
  { label: "Capacitar-se em tecnologias e inovação, especialmente em áreas dinâmicas como TIC.", value: "Capacitar-se em tecnologias e inovação, especialmente em áreas dinâmicas como TIC." },
  { label: "Validar suas competências adquiridas progressivamente.", value: "Validar suas competências adquiridas progressivamente." },
  { label: "Promover sua própria autonomia e flexibilidade no processo de aprendizagem, personalizando seus itinerários formativos.", value: "Promover sua própria autonomia e flexibilidade no processo de aprendizagem, personalizando seus itinerários formativos." },
  { label: "Aplicar metodologias de aprendizagem prática e orientada por projetos reais, resolvendo problemas do mundo real.", value: "Aplicar metodologias de aprendizagem prática e orientada por projetos reais, resolvendo problemas do mundo real." },
  { label: "Integrar o conhecimento com as demandas do mercado de trabalho, garantindo que as competências adquiridas tenham aplicação imediata.", value: "Integrar o conhecimento com as demandas do mercado de trabalho, garantindo que as competências adquiridas tenham aplicação imediata." },
  { label: "Preparar-se para atuar em ambientes de transformação digital, adaptando-se a novas tecnologias e tendências.", value: "Preparar-se para atuar em ambientes de transformação digital, adaptando-se a novas tecnologias e tendências." },
  { label: "Estimular seu processo de aprendizagem contínua (long life learning), buscando evolução e atualização constante (reskilling e upskilling).", value: "Estimular seu processo de aprendizagem contínua (long life learning), buscando evolução e atualização constante (reskilling e upskilling)." },
  { label: "Fomentar um senso crítico e adaptabilidade, respondendo de forma eficaz às mudanças no contexto profissional.", value: "Fomentar um senso crítico e adaptabilidade, respondendo de forma eficaz às mudanças no contexto profissional." },
  { label: "Facilitar sua participação em redes colaborativas, conectando-se com empresas, instituições de ensino e oportunidades de trabalho.", value: "Facilitar sua participação em redes colaborativas, conectando-se com empresas, instituições de ensino e oportunidades de trabalho." },
  { label: "Desenvolver habilidades de trabalhar em makerspace.", value: "Desenvolver habilidades de trabalhar em makerspace." },
  { label: "Desenvolver habilidades de trabalho hands on.", value: "Desenvolver habilidades de trabalho hands on." },
  { label: "Desenvolver uma postura colaborativa.", value: "Desenvolver uma postura colaborativa." },
  { label: "Outros.", value: "Outros." },
];

export const CURRICULUM_NATURE_OPTIONS = [
  { label: "Factual (dados, fatos, acontecimentos, experiências)", value: "Factual" },
  { label: "Conceitual (definições, conceitos, regras, princípios, explicações)", value: "Conceitual" },
  { label: "Procedimental (atividades, situações, ferramentas e recursos)", value: "Procedimental" },
  { label: "Metacognitivo (informações que estimulem o raciocínio, a crítica, a descoberta, a solução de problemas e a tomada de decisão)", value: "Metacognitivo" },
];

export const REQUISITES_OPTIONS = [
  { label: "Não há", value: "none" },
  { label: "Sim, listar abaixo", value: "list" },
];
