import { CORTES, corteForSemester } from "../App.jsx";
import {
  MAX_GRADE,
  isEnglishLetterGrade,
  isValidNumericGrade,
} from "./gradeHelpers.js";

export function getObligatorias(malla) {
  return malla.flatMap((sem) =>
    typeof sem.semestre === "number" ? sem.materias : []
  );
}

export function buildSemestreMap(malla) {
  const map = new Map();
  malla.forEach((sem) => {
    if (typeof sem.semestre !== "number") return;
    sem.materias.forEach((m) => map.set(m.id, sem.semestre));
  });
  return map;
}

export function calcCareerTime(user) {
  const ingresoIdx = CORTES.indexOf(user.ingresoCorte || "");
  const currentCorte = corteForSemester(user.ingresoCorte, Number(user.semester) || 1);
  const currentIdx = currentCorte ? CORTES.indexOf(currentCorte) : -1;

  if (ingresoIdx === -1 || currentIdx === -1) {
    return { semesters: 0, totalMonths: 0, years: 0, months: 0, currentCorte };
  }

  const semesters = currentIdx - ingresoIdx + 1;
  const totalMonths = semesters * 6;
  return {
    semesters,
    totalMonths,
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
    currentCorte,
  };
}

export function estimateGraduation(malla, user) {
  const obligatorias = getObligatorias(malla);
  const totalCreditos = obligatorias.reduce((a, m) => a + m.creditos, 0);
  const aprobadas = obligatorias.filter((m) => m.estado === "aprobada");
  const cursando = obligatorias.filter((m) => m.estado === "cursando");
  const faltantes = obligatorias.filter((m) => m.estado === "faltante");

  const creditosAprobados = aprobadas.reduce((a, m) => a + m.creditos, 0);
  const creditosPendientes = [...cursando, ...faltantes].reduce((a, m) => a + m.creditos, 0);

  const semestresTranscurridos = Math.max(1, (Number(user.semester) || 1) - 1);
  const ritmoCreditosPorSemestre = creditosAprobados / semestresTranscurridos;

  if (creditosPendientes === 0) {
    return {
      totalCreditos,
      creditosAprobados,
      creditosPendientes: 0,
      ritmoCreditosPorSemestre,
      semestresEstimados: 0,
      mesesEstimados: 0,
      anosEstimados: 0,
      mesesRestantes: 0,
      mensaje: "¡Carrera obligatoria completada según tu malla!",
    };
  }

  if (ritmoCreditosPorSemestre <= 0) {
    return {
      totalCreditos,
      creditosAprobados,
      creditosPendientes,
      ritmoCreditosPorSemestre: 0,
      semestresEstimados: null,
      mesesEstimados: null,
      anosEstimados: null,
      mesesRestantes: null,
      mensaje: "Aún no hay ritmo calculable. Aprueba materias para estimar tu fecha de grado.",
    };
  }

  const semestresEstimados = Math.ceil(creditosPendientes / ritmoCreditosPorSemestre);
  const mesesEstimados = semestresEstimados * 6;
  return {
    totalCreditos,
    creditosAprobados,
    creditosPendientes,
    ritmoCreditosPorSemestre,
    semestresEstimados,
    mesesEstimados,
    anosEstimados: Math.floor(mesesEstimados / 12),
    mesesRestantes: mesesEstimados % 12,
    mensaje: null,
  };
}

export function projectDesiredAverage(malla, notas, desiredAvg) {
  const target = Number(desiredAvg);
  if (!desiredAvg || isNaN(target) || target <= 0) return null;

  let sumPond = 0;
  let sumCred = 0;
  const pendingBySem = new Map();

  malla.forEach((sem) => {
    if (typeof sem.semestre !== "number") return;

    sem.materias.forEach((mat) => {
      if (isEnglishLetterGrade(mat, sem.semestre)) return;

      const n = notas[mat.id];
      let hasRecord = false;

      if (n && isValidNumericGrade(n.nota)) {
        sumPond += Number(n.nota) * mat.creditos;
        sumCred += mat.creditos;
        hasRecord = true;
      }

      (n?.intentos || []).forEach((it) => {
        if (isValidNumericGrade(it.nota)) {
          sumPond += Number(it.nota) * mat.creditos;
          sumCred += mat.creditos;
          hasRecord = true;
        }
      });

      if (!hasRecord) {
        if (!pendingBySem.has(sem.semestre)) pendingBySem.set(sem.semestre, []);
        pendingBySem.get(sem.semestre).push(mat);
      }
    });
  });

  const pendingMaterias = [...pendingBySem.values()].flat();
  const pendingCred = pendingMaterias.reduce((a, m) => a + m.creditos, 0);

  if (pendingCred === 0) {
    const currentAvg = sumCred > 0 ? sumPond / sumCred : null;
    return {
      currentAvg,
      pendingCred: 0,
      requiredUniform: null,
      feasible: true,
      pendingBySem,
      message: currentAvg !== null
        ? `Ya tienes nota en todas las materias numéricas. Promedio actual: ${currentAvg.toFixed(1)}`
        : "No hay materias pendientes de nota numérica.",
    };
  }

  const requiredUniform = (target * (sumCred + pendingCred) - sumPond) / pendingCred;
  const feasible = requiredUniform <= MAX_GRADE && requiredUniform >= 0;
  const currentAvg = sumCred > 0 ? sumPond / sumCred : null;

  return {
    currentAvg,
    pendingCred,
    requiredUniform,
    feasible,
    pendingBySem,
    message: !feasible
      ? requiredUniform > MAX_GRADE
        ? `Se necesitaría ${requiredUniform.toFixed(1)} de promedio en lo pendiente (máximo 500). Meta muy alta.`
        : "No se puede calcular una proyección válida con los datos actuales."
      : null,
  };
}
