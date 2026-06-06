// Malla curricular — Ingeniería de Sistemas
// Acuerdo Académico N° 21 de 2024
// Nota: prereqs de "60% / 70% del plan" no se modelan como materia; quedan sin prereq en la malla.
export const MALLA_SISTEMAS = [
  {
    semestre: 1,
    materias: [
      { id: "ALG1", codigo: "01011403", nombre: "Algoritmos y Programación",               creditos: 4, estado: "faltante", prereqs: [] },
      { id: "CAL1", codigo: "01011401", nombre: "Cálculo Diferencial",                     creditos: 4, estado: "faltante", prereqs: [] },
      { id: "ENG1", codigo: "01011406", nombre: "General English I",                       creditos: 2, estado: "faltante", prereqs: [] },
      { id: "IIS1", codigo: "01011404", nombre: "Introducción a la Ingeniería de Sistemas", creditos: 2, estado: "faltante", prereqs: [] },
      { id: "MAD1", codigo: "01011402", nombre: "Matemáticas Discretas",                   creditos: 4, estado: "faltante", prereqs: [] },
      { id: "PLE1", codigo: "01011405", nombre: "Procesos Lectores y Escriturales",        creditos: 2, estado: "faltante", prereqs: [] },
    ],
  },
  {
    semestre: 2,
    materias: [
      { id: "ALI1", codigo: "02011408", nombre: "Álgebra Lineal",                          creditos: 3, estado: "faltante", prereqs: [] },
      { id: "CAL2", codigo: "02011407", nombre: "Cálculo Integral",                        creditos: 4, estado: "faltante", prereqs: ["CAL1"] },
      { id: "EDA1", codigo: "02011409", nombre: "Estructura de Datos I",                   creditos: 4, estado: "faltante", prereqs: ["ALG1"] },
      { id: "ENG2", codigo: "02011411", nombre: "General English II",                      creditos: 2, estado: "faltante", prereqs: ["ENG1"] },
      { id: "POO1", codigo: "02011410", nombre: "Programación Orientada a Objetos",        creditos: 4, estado: "faltante", prereqs: ["ALG1"] },
    ],
  },
  {
    semestre: 3,
    materias: [
      { id: "CAV1", codigo: "03011412", nombre: "Cálculo Vectorial",                        creditos: 4, estado: "faltante", prereqs: ["CAL2", "ALI1"] },
      { id: "EDA2", codigo: "03011415", nombre: "Estructura de Datos II",                  creditos: 4, estado: "faltante", prereqs: ["EDA1"] },
      { id: "EOA1", codigo: "03011416", nombre: "Expresión Oral y Argumentación",          creditos: 2, estado: "faltante", prereqs: ["PLE1"] },
      { id: "ENG3", codigo: "03011417", nombre: "General English III",                     creditos: 2, estado: "faltante", prereqs: ["ENG2"] },
      { id: "PES1", codigo: "03011414", nombre: "Pensamiento de Sistemas",                 creditos: 2, estado: "faltante", prereqs: [] },
      { id: "PRE1", codigo: "03011413", nombre: "Probabilidad y Estadística",              creditos: 3, estado: "faltante", prereqs: ["CAL2"] },
    ],
  },
  {
    semestre: 4,
    materias: [
      { id: "BDA1", codigo: "04011420", nombre: "Bases de Datos",                            creditos: 4, estado: "faltante", prereqs: ["EDA2"] },
      { id: "EDI1", codigo: "04011418", nombre: "Ecuaciones Diferenciales",                  creditos: 3, estado: "faltante", prereqs: ["CAL2"] },
      { id: "EST2", codigo: "04011419", nombre: "Estadística Inferencial",                   creditos: 3, estado: "faltante", prereqs: ["PRE1"] },
      { id: "FHC1", codigo: "04011422", nombre: "Formación Humanística y Ciudadana",       creditos: 2, estado: "faltante", prereqs: [] },
      { id: "ENG4", codigo: "04011423", nombre: "General English IV",                      creditos: 2, estado: "faltante", prereqs: ["ENG3"] },
      { id: "SID1", codigo: "04011421", nombre: "Sistemas Digitales",                      creditos: 4, estado: "faltante", prereqs: ["MAD1"] },
    ],
  },
  {
    semestre: 5,
    materias: [
      { id: "ANM1", codigo: "06011430", nombre: "Análisis Numérico",                           creditos: 3, estado: "faltante", prereqs: ["EDI1"] },
      { id: "ARC1", codigo: "05011429", nombre: "Arquitectura de Computadores",                creditos: 3, estado: "faltante", prereqs: [] },
      { id: "ENG5", codigo: "05011431", nombre: "General English V",                           creditos: 2, estado: "faltante", prereqs: ["ENG4"] },
      { id: "IOD1", codigo: "05011425", nombre: "Investigación de Operaciones Determinísticas", creditos: 3, estado: "faltante", prereqs: ["ALI1"] },
      { id: "MAV1", codigo: "07011435", nombre: "Matemáticas Avanzadas",                       creditos: 3, estado: "faltante", prereqs: ["EDI1"] },
      { id: "PWB1", codigo: "05011427", nombre: "Programación para Web",                        creditos: 4, estado: "faltante", prereqs: ["POO1", "BDA1"] },
    ],
  },
  {
    semestre: 6,
    materias: [
      { id: "COM1", codigo: "06011433", nombre: "Compiladores",                             creditos: 4, estado: "faltante", prereqs: ["EDA2"] },
      { id: "FIM1", codigo: "07011436", nombre: "Física Mecánica",                          creditos: 4, estado: "faltante", prereqs: ["CAL1"] },
      { id: "ISW1", codigo: "06011432", nombre: "Ingeniería de Software",                   creditos: 4, estado: "faltante", prereqs: ["PWB1"] },
      { id: "IEC1", codigo: "06011450", nombre: "Ingeniería Económica",                     creditos: 3, estado: "faltante", prereqs: ["EST2"] },
      { id: "PDP1", codigo: "06011434", nombre: "Proyecto de Diseño y Prototipado",         creditos: 2, estado: "faltante", prereqs: ["PWB1"] },
    ],
  },
  {
    semestre: 7,
    materias: [
      { id: "ASW1", codigo: "07011438", nombre: "Arquitectura de Software",                 creditos: 4, estado: "faltante", prereqs: ["ISW1"] },
      { id: "CYO1", codigo: "08011440", nombre: "Calor y Ondas",                            creditos: 4, estado: "faltante", prereqs: ["FIM1"] },
      { id: "DOT1", codigo: "07011437", nombre: "Diseño Organizacional de TI",              creditos: 4, estado: "faltante", prereqs: ["PES1"] },
      { id: "LEG1", codigo: "09011448", nombre: "Legislación Informática",                  creditos: 2, estado: "faltante", prereqs: [] },
      { id: "SIS1", codigo: "08011442", nombre: "Sistemas Operativos",                      creditos: 4, estado: "faltante", prereqs: ["ARC1", "COM1"] },
    ],
  },
  {
    semestre: 8,
    materias: [
      { id: "EPR1", codigo: "08011466", nombre: "Electiva de Profundización I",             creditos: 3, estado: "faltante", prereqs: [] },
      { id: "EYM1", codigo: "08011441", nombre: "Electricidad y Magnetismo",                creditos: 4, estado: "faltante", prereqs: ["CYO1"] },
      { id: "ETI1", codigo: "09011446", nombre: "Ética en Ingeniería de Sistemas",          creditos: 2, estado: "faltante", prereqs: [] },
      { id: "GPR1", codigo: "09011447", nombre: "Gestión de Proyectos",                     creditos: 3, estado: "faltante", prereqs: ["IEC1"] },
      { id: "IAR1", codigo: "06011431", nombre: "Inteligencia Artificial",                  creditos: 4, estado: "faltante", prereqs: ["EST2", "ANM1", "COM1"] },
    ],
  },
  {
    semestre: 9,
    materias: [
      { id: "DIS1", codigo: "09011444", nombre: "Dinámica de Sistemas",                     creditos: 4, estado: "faltante", prereqs: ["PES1", "EDI1"] },
      { id: "EPR2", codigo: "09011467", nombre: "Electiva de Profundización II",            creditos: 3, estado: "faltante", prereqs: [] },
      { id: "EPR3", codigo: "09011469", nombre: "Electiva de Profundización III",           creditos: 3, estado: "faltante", prereqs: [] },
      { id: "EFD1", codigo: "09011462", nombre: "Experiencia Final de Diseño en Ingeniería", creditos: 4, estado: "faltante", prereqs: ["PDP1", "ASW1", "IAR1"] },
      { id: "RED1", codigo: "09011445", nombre: "Redes",                                    creditos: 4, estado: "faltante", prereqs: ["SIS1"] },
    ],
  },
  {
    semestre: 10,
    materias: [
      { id: "EPR4", codigo: "09011468", nombre: "Electiva de Profundización IV",            creditos: 3, estado: "faltante", prereqs: [] },
    ],
  },
  {
    semestre: "opt",
    label: "Optativos",
    materias: [
      { id: "OPT_0001", codigo: "OPT_0001", nombre: "Análisis Automático de Imágenes",           creditos: 3, estado: "faltante", prereqs: [], optativa: true },
      { id: "OPT_0004", codigo: "OPT_0004", nombre: "Análisis, Modelado y Visualización de Datos", creditos: 3, estado: "faltante", prereqs: [], optativa: true },
      { id: "OPT_0010", codigo: "OPT_0010", nombre: "Bases de Datos No Relacionales",             creditos: 3, estado: "faltante", prereqs: [], optativa: true },
      { id: "OPT_0011", codigo: "OPT_0011", nombre: "Bodegas de Datos",                           creditos: 3, estado: "faltante", prereqs: [], optativa: true },
      { id: "OPT_0008", codigo: "OPT_0008", nombre: "DevOps",                                     creditos: 3, estado: "faltante", prereqs: [], optativa: true },
      { id: "OPT_0006", codigo: "OPT_0006", nombre: "Diseño de Interfaces",                       creditos: 3, estado: "faltante", prereqs: [], optativa: true },
      { id: "OPT_0005", codigo: "OPT_0005", nombre: "Gobierno de TI",                             creditos: 3, estado: "faltante", prereqs: [], optativa: true },
      { id: "OPT_0007", codigo: "OPT_0007", nombre: "Hacking Ético",                              creditos: 3, estado: "faltante", prereqs: [], optativa: true },
      { id: "OPT_0015", codigo: "OPT_0015", nombre: "Innovación Empresarial",                     creditos: 3, estado: "faltante", prereqs: [], optativa: true },
      { id: "OPT_0012", codigo: "OPT_0012", nombre: "Microprocesamiento",                         creditos: 3, estado: "faltante", prereqs: ["ARC1"], optativa: true },
      { id: "OPT_0009", codigo: "OPT_0009", nombre: "Microservicios",                             creditos: 3, estado: "faltante", prereqs: [], optativa: true },
      { id: "OPT_0014", codigo: "OPT_0014", nombre: "MLOps",                                      creditos: 3, estado: "faltante", prereqs: [], optativa: true },
      { id: "OPT_0003", codigo: "OPT_0003", nombre: "Modelado y Simulación",                      creditos: 3, estado: "faltante", prereqs: [], optativa: true },
      { id: "OPT_0002", codigo: "OPT_0002", nombre: "Procesamiento de Imágenes Médicas",          creditos: 3, estado: "faltante", prereqs: [], optativa: true },
      { id: "OPT_0013", codigo: "OPT_0013", nombre: "Sistema de Información Geográfica",          creditos: 3, estado: "faltante", prereqs: [], optativa: true },
    ],
  },
];

// Malla curricular — Hotelería y Turismo
export const MALLA_HOTELERIA_TURISMO = [
  {
    semestre: 1,
    materias: [
      { id: "BTA1", nombre: "Bebidas Tradicionales, Ancestrales y Artesanales", creditos: 2, estado: "faltante", prereqs: [] },
      { id: "RRM1", nombre: "Razonamiento y Representación Matemática", creditos: 2, estado: "faltante", prereqs: [] },
      { id: "PLE1", nombre: "Procesos Lectores y Escriturales", creditos: 2, estado: "faltante", prereqs: [] },
      { id: "CCA1", nombre: "Cátedra del Caribe", creditos: 2, estado: "faltante", prereqs: [] },
      { id: "LET1", nombre: "Legislación Turística", creditos: 2, estado: "faltante", prereqs: [] },
      { id: "IAT1", nombre: "Introducción a la Actividad Turística y Hotelera", creditos: 3, estado: "faltante", prereqs: [] },
      { id: "EPR1", nombre: "Etiqueta, Protocolo y Relaciones Públicas", creditos: 3, estado: "faltante", prereqs: [] },
      { id: "ENG1", nombre: "General English I", creditos: 2, estado: "faltante", prereqs: [] },
    ],
  },
  {
    semestre: 2,
    materias: [
      { id: "EOA1", nombre: "Expresión Oral y Argumentación", creditos: 2, estado: "faltante", prereqs: [] },
      { id: "CGF1", nombre: "Contabilidad General y Financiera", creditos: 3, estado: "faltante", prereqs: [] },
      { id: "EST1", nombre: "Estadística I", creditos: 3, estado: "faltante", prereqs: [] },
      { id: "HYP1", nombre: "Historia y Patrimonio", creditos: 2, estado: "faltante", prereqs: [] },
      { id: "AVT1", nombre: "Agencias de Viajes y Transporte Turístico", creditos: 2, estado: "faltante", prereqs: ["IAT1"] },
      { id: "ENG2", nombre: "General English II", creditos: 2, estado: "faltante", prereqs: ["ENG1"] },
      { id: "TOA1", nombre: "Teoría de las Organizaciones y de la Administración", creditos: 4, estado: "faltante", prereqs: [] },
    ],
  },
  {
    semestre: 3,
    materias: [
      { id: "ECE1", nombre: "Emprendimiento y Creación de Empresas", creditos: 2, estado: "faltante", prereqs: [] },
      { id: "GSR1", nombre: "Gestión de Servicios de Alojamiento y Reservas", creditos: 2, estado: "faltante", prereqs: ["IAT1"] },
      { id: "CCH1", nombre: "Contabilidad y Costos Hoteleros", creditos: 3, estado: "faltante", prereqs: ["CGF1"] },
      { id: "GTN1", nombre: "Geografía Turística Nacional e Internacional", creditos: 2, estado: "faltante", prereqs: ["IAT1"] },
      { id: "GAS1", nombre: "Gastronomía I: Gestión de la Inocuidad", creditos: 2, estado: "faltante", prereqs: [] },
      { id: "ENG3", nombre: "General English III", creditos: 2, estado: "faltante", prereqs: ["ENG2"] },
      { id: "FDE1", nombre: "Fundamentos de Economía", creditos: 3, estado: "faltante", prereqs: [] },
      { id: "ELP1", nombre: "Electiva de Profundización I", creditos: 2, estado: "faltante", prereqs: [] },
    ],
  },
  {
    semestre: 4,
    materias: [
      { id: "CHC1", nombre: "Cátedra Humanística y Ciudadana", creditos: 2, estado: "faltante", prereqs: [] },
      { id: "GHC1", nombre: "Gestión Hotelera en Clínicas y Hospitales", creditos: 2, estado: "faltante", prereqs: [] },
      { id: "SCH1", nombre: "Sistemas de Control Hotelero", creditos: 2, estado: "faltante", prereqs: ["GSR1"] },
      { id: "LGE1", nombre: "Logística y Gestión de Eventos", creditos: 2, estado: "faltante", prereqs: ["EPR1"] },
      { id: "GAS2", nombre: "Gastronomía II: Cocina Colombiana y Gastronomía Internacional", creditos: 4, estado: "faltante", prereqs: ["GAS1"] },
      { id: "ENG4", nombre: "General English IV", creditos: 2, estado: "faltante", prereqs: ["ENG3"] },
      { id: "OYD1", nombre: "Organización y Dirección", creditos: 4, estado: "faltante", prereqs: ["TOA1"] },
    ],
  },
  {
    semestre: 5,
    materias: [
      { id: "FIN1", nombre: "Fundamentos de Investigación", creditos: 2, estado: "faltante", prereqs: [] },
      { id: "SGD1", nombre: "Sistemas Globales de Distribución", creditos: 2, estado: "faltante", prereqs: ["SCH1"] },
      { id: "ETA1", nombre: "Ecoturismo y Turismo Alternativo", creditos: 3, estado: "faltante", prereqs: ["GTN1"] },
      { id: "GAS3", nombre: "Gastronomía III: Gestión Financiera de la Restauración", creditos: 2, estado: "faltante", prereqs: ["GAS2"] },
      { id: "ENG5", nombre: "General English V", creditos: 2, estado: "faltante", prereqs: ["ENG4"] },
      { id: "MFI1", nombre: "Matemáticas Financieras", creditos: 3, estado: "faltante", prereqs: [] },
      { id: "ELP2", nombre: "Electiva de Profundización II", creditos: 2, estado: "faltante", prereqs: [] },
      { id: "MKT1", nombre: "Marketing Turístico", creditos: 2, estado: "faltante", prereqs: [] },
    ],
  },
  {
    semestre: 6,
    materias: [
      { id: "STI1", nombre: "Seminario Taller de Investigación I", creditos: 2, estado: "faltante", prereqs: ["FIN1"] },
      { id: "CAL1", nombre: "Cálculo Diferencial", creditos: 4, estado: "faltante", prereqs: [] },
      { id: "PEP1", nombre: "Planeación Estratégica y Prospectiva", creditos: 3, estado: "faltante", prereqs: ["TOA1"] },
      { id: "MIC1", nombre: "Microeconomía", creditos: 4, estado: "faltante", prereqs: ["FDE1"] },
      { id: "ANF1", nombre: "Análisis Financiero", creditos: 3, estado: "faltante", prereqs: ["MFI1"] },
      { id: "ENG6", nombre: "General English VI", creditos: 2, estado: "faltante", prereqs: ["ENG5"] },
    ],
  },
  {
    semestre: 7,
    materias: [
      { id: "STI2", nombre: "Seminario Taller de Investigación II", creditos: 2, estado: "faltante", prereqs: ["STI1"] },
      { id: "CAL2", nombre: "Cálculo Integral", creditos: 4, estado: "faltante", prereqs: ["CAL1"] },
      { id: "GTH1", nombre: "Gerencia del Talento Humano", creditos: 2, estado: "faltante", prereqs: ["PEP1"] },
      { id: "DPR1", nombre: "Diseño de Productos Turísticos Responsables y Regenerativos", creditos: 3, estado: "faltante", prereqs: [] },
      { id: "PGS1", nombre: "Planificación y Gestión Sostenible del Turismo", creditos: 2, estado: "faltante", prereqs: [] },
      { id: "GEB1", nombre: "Gerencia de Establecimientos Gastronómicos y Bares", creditos: 2, estado: "faltante", prereqs: ["PEP1"] },
      { id: "DCO1", nombre: "Derecho Comercial", creditos: 2, estado: "faltante", prereqs: [] },
      { id: "ENG7", nombre: "General English VII", creditos: 2, estado: "faltante", prereqs: ["ENG6"] },
    ],
  },
  {
    semestre: 8,
    materias: [
      { id: "STI3", nombre: "Seminario Taller de Investigación III", creditos: 2, estado: "faltante", prereqs: ["STI2"] },
      { id: "TDS1", nombre: "Toma de Decisiones y Simulación Gerencial", creditos: 2, estado: "faltante", prereqs: ["PEP1"] },
      { id: "IAT2", nombre: "Impactos de la Actividad Turística", creditos: 2, estado: "faltante", prereqs: ["MAC1"] },
      { id: "FPR1", nombre: "Formulación de Proyectos", creditos: 2, estado: "faltante", prereqs: ["ANF1"] },
      { id: "EMD1", nombre: "Estrategias de Marketing Digital", creditos: 2, estado: "faltante", prereqs: ["DPR1"] },
      { id: "RSE1", nombre: "Responsabilidad Social Empresarial", creditos: 2, estado: "faltante", prereqs: [] },
      { id: "MAC1", nombre: "Macroeconomía", creditos: 4, estado: "faltante", prereqs: ["FDE1"] },
      { id: "ENG8", nombre: "General English VIII", creditos: 2, estado: "faltante", prereqs: ["ENG7"] },
    ],
  },
  {
    semestre: 9,
    materias: [
      { id: "GOT1", nombre: "Gerencia de Organizaciones Turísticas", creditos: 2, estado: "faltante", prereqs: ["TDS1"] },
      { id: "EEP1", nombre: "Evaluación y Ejecución de Proyectos", creditos: 2, estado: "faltante", prereqs: ["FPR1"] },
      { id: "DLA1", nombre: "Derecho Laboral", creditos: 2, estado: "faltante", prereqs: [] },
      { id: "GPC1", nombre: "Gestión Sostenible del Patrimonio Cultural", creditos: 2, estado: "faltante", prereqs: [] },
      { id: "GCS1", nombre: "Gestión de la Calidad y Sostenibilidad en Empresas Turísticas", creditos: 2, estado: "faltante", prereqs: ["TDS1"] },
      { id: "SCT1", nombre: "Sostenibilidad Corporativa en Turismo", creditos: 2, estado: "faltante", prereqs: [] },
      { id: "EST2", nombre: "Estadística II", creditos: 3, estado: "faltante", prereqs: ["EST1"] },
      { id: "PPP2", nombre: "Profundización Profesional II", creditos: 2, estado: "faltante", prereqs: [] },
    ],
  },
];

export const MALLAS_POR_CARRERA = {
  "Ingeniería de Sistemas": MALLA_SISTEMAS,
  "Hotelería y Turismo": MALLA_HOTELERIA_TURISMO,
};

export function getMallaByCareer(career) {
  return MALLAS_POR_CARRERA[career] || MALLA_SISTEMAS;
}

export const MALLA = MALLA_SISTEMAS;

export const ESTADOS = {
  aprobada:  { label: "Aprobada",  emoji: "✓" },
  cursando:  { label: "Cursando",  emoji: "◉" },
  faltante:  { label: "Faltante",  emoji: "○" },
};
