// Malla curricular — Ingeniería de Sistemas
// Acuerdo Académico N° 21 de 2024

export const MALLA = [
  {
    semestre: 1,
    materias: [
      { id: "CAL1", nombre: "Cálculo Diferencial",                    creditos: 4, estado: "faltante", prereqs: [] },
      { id: "MAD1", nombre: "Matemáticas Discretas",                  creditos: 4, estado: "faltante", prereqs: [] },
      { id: "IIS1", nombre: "Introducción a la Ingeniería de Sistemas",creditos: 2, estado: "faltante", prereqs: [] },
      { id: "ALG1", nombre: "Algoritmos y Programación",              creditos: 4, estado: "faltante", prereqs: [] },
      { id: "PLE1", nombre: "Procesos Lectores y Escriturales",       creditos: 2, estado: "faltante", prereqs: [] },
      { id: "ENG1", nombre: "General English I",                      creditos: 2, estado: "faltante", prereqs: [] },
    ],
  },
  {
    semestre: 2,
    materias: [
      { id: "CAL2", nombre: "Cálculo Integral",                creditos: 4, estado: "faltante", prereqs: ["CAL1"] },
      { id: "ALI1", nombre: "Álgebra Lineal",                  creditos: 3, estado: "faltante", prereqs: ["CAL1"] },
      { id: "EDA1", nombre: "Estructura de Datos I",           creditos: 4, estado: "faltante", prereqs: ["ALG1"] },
      { id: "POO1", nombre: "Programación Orientada a Objetos",creditos: 4, estado: "faltante", prereqs: ["ALG1"] },
      { id: "ENG2", nombre: "General English II",              creditos: 2, estado: "faltante", prereqs: ["ENG1"] },
    ],
  },
  {
    semestre: 3,
    materias: [
      { id: "CAV1", nombre: "Cálculo Vectorial",               creditos: 4, estado: "faltante", prereqs: ["CAL2"] },
      { id: "PRE1", nombre: "Probabilidad y Estadística",      creditos: 3, estado: "faltante", prereqs: ["CAL2"] },
      { id: "PES1", nombre: "Pensamiento de Sistemas",         creditos: 2, estado: "faltante", prereqs: ["IIS1"] },
      { id: "EDA2", nombre: "Estructura de Datos II",          creditos: 4, estado: "faltante", prereqs: ["EDA1", "POO1"] },
      { id: "EOA1", nombre: "Expresión Oral y Argumentación",  creditos: 2, estado: "faltante", prereqs: ["PLE1"] },
      { id: "ENG3", nombre: "General English III",             creditos: 2, estado: "faltante", prereqs: ["ENG2"] },
    ],
  },
  {
    semestre: 4,
    materias: [
      { id: "EDI1", nombre: "Ecuaciones Diferenciales",         creditos: 3, estado: "faltante", prereqs: ["CAV1"] },
      { id: "EST2", nombre: "Estadística Inferencial",          creditos: 3, estado: "faltante", prereqs: ["PRE1"] },
      { id: "BDA1", nombre: "Bases de Datos",                   creditos: 4, estado: "faltante", prereqs: ["EDA2"] },
      { id: "SID1", nombre: "Sistemas Digitales",               creditos: 4, estado: "faltante", prereqs: ["MAD1"] },
      { id: "FHC1", nombre: "Formación Humanística y Ciudadana",creditos: 2, estado: "faltante", prereqs: [] },
      { id: "ENG4", nombre: "General English IV",               creditos: 2, estado: "faltante", prereqs: ["ENG3"] },
    ],
  },
  {
    semestre: 5,
    materias: [
      { id: "ANM1", nombre: "Análisis Numérico",                           creditos: 3, estado: "faltante", prereqs: ["CAV1", "ALI1"] },
      { id: "IOD1", nombre: "Investigación de Operaciones Determinísticas", creditos: 3, estado: "faltante", prereqs: ["EST2", "ALI1"] },
      { id: "MAV1", nombre: "Matemáticas Avanzadas",                       creditos: 3, estado: "faltante", prereqs: ["CAV1"] },
      { id: "PWB1", nombre: "Programación para Web",                        creditos: 4, estado: "faltante", prereqs: ["POO1"] },
      { id: "ARC1", nombre: "Arquitectura de Computadores",                creditos: 3, estado: "faltante", prereqs: ["SID1"] },
      { id: "ENG5", nombre: "General English V",                           creditos: 2, estado: "faltante", prereqs: ["ENG4"] },
    ],
  },
  {
    semestre: 6,
    materias: [
      { id: "FIM1", nombre: "Física Mecánica",                   creditos: 4, estado: "faltante", prereqs: ["CAV1"] },
      { id: "ISW1", nombre: "Ingeniería de Software",            creditos: 4, estado: "faltante", prereqs: ["PWB1", "BDA1"] },
      { id: "COM1", nombre: "Compiladores",                      creditos: 4, estado: "faltante", prereqs: ["EDA2"] },
      { id: "IEC1", nombre: "Ingeniería Económica",              creditos: 3, estado: "faltante", prereqs: [] },
      { id: "PDP1", nombre: "Proyecto de Diseño y Prototipado",  creditos: 2, estado: "faltante", prereqs: ["ISW1"] },
    ],
  },
  {
    semestre: 7,
    materias: [
      { id: "CYO1", nombre: "Calor y Ondas",                 creditos: 4, estado: "faltante", prereqs: ["FIM1"] },
      { id: "DOT1", nombre: "Diseño Organizacional de TI",   creditos: 4, estado: "faltante", prereqs: ["ISW1"] },
      { id: "ASW1", nombre: "Arquitectura de Software",      creditos: 4, estado: "faltante", prereqs: ["ISW1"] },
      { id: "SIS1", nombre: "Sistemas Operativos",           creditos: 4, estado: "faltante", prereqs: ["ARC1"] },
      { id: "LEG1", nombre: "Legislación Informática",       creditos: 2, estado: "faltante", prereqs: [] },
    ],
  },
  {
    semestre: 8,
    materias: [
      { id: "EYM1", nombre: "Electricidad y Magnetismo",          creditos: 4, estado: "faltante", prereqs: ["CYO1"] },
      { id: "ETI1", nombre: "Ética en Ingeniería de Sistemas",    creditos: 2, estado: "faltante", prereqs: [] },
      { id: "IAR1", nombre: "Inteligencia Artificial",            creditos: 4, estado: "faltante", prereqs: ["IOD1", "MAV1"] },
      { id: "GPR1", nombre: "Gestión de Proyectos",               creditos: 3, estado: "faltante", prereqs: ["ISW1"] },
    ],
  },
  {
    semestre: 9,
    materias: [
      { id: "DIS1", nombre: "Dinámica de Sistemas",                    creditos: 4, estado: "faltante", prereqs: ["EDI1"] },
      { id: "RED1", nombre: "Redes",                                   creditos: 4, estado: "faltante", prereqs: ["SIS1"] },
      { id: "EFD1", nombre: "Experiencia Final de Diseño en Ingeniería",creditos: 4, estado: "faltante", prereqs: ["GPR1", "ASW1"] },
      { id: "EPR1", nombre: "Electiva de Profundización",              creditos: 12, estado: "faltante", prereqs: [] },
    ],
  },
];

export const ESTADOS = {
  aprobada:  { label: "Aprobada",  emoji: "✓" },
  cursando:  { label: "Cursando",  emoji: "◉" },
  faltante:  { label: "Faltante",  emoji: "○" },
};
