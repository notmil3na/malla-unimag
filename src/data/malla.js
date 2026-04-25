// Malla curricular — Ingeniería de Sistemas
// Acuerdo Académico N° 21 de 2024
export const MALLA_SISTEMAS = [
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
      { id: "PDP1", nombre: "Proyecto de Diseño y Prototipado",  creditos: 2, estado: "faltante", prereqs: ["PWB1"] },
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
