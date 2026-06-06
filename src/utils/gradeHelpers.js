export const PASS_GRADE = 300;
export const MAX_GRADE = 500;

export function isEnglishLetterGrade(materia, semestre) {
  return materia.id.startsWith("ENG") && typeof semestre === "number" && semestre >= 5;
}

export function isGradePassed(materia, semestre, nota) {
  if (nota === undefined || nota === null || nota === "") return false;
  if (isEnglishLetterGrade(materia, semestre)) return nota === "A";
  const numeric = Number(nota);
  return !isNaN(numeric) && numeric >= PASS_GRADE;
}

export function isGradeFailed(materia, semestre, nota) {
  if (nota === undefined || nota === null || nota === "") return false;
  if (isEnglishLetterGrade(materia, semestre)) return nota === "I";
  const numeric = Number(nota);
  return !isNaN(numeric) && numeric < PASS_GRADE;
}

export function isValidNumericGrade(value) {
  if (value === undefined || value === null || value === "" || value === "-") return false;
  const numeric = Number(value);
  return !isNaN(numeric);
}

export function sanitizeNumericGrade(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const numeric = Number(value);
  if (isNaN(numeric)) return undefined;
  return Math.max(0, Math.min(MAX_GRADE, numeric));
}

export function canEnrollMateria(materia, allMaterias) {
  if (materia.estado !== "faltante") return false;
  if (!materia.prereqs?.length) return true;
  return materia.prereqs.every((pid) => {
    const prereq = allMaterias.find((m) => m.id === pid);
    return prereq?.estado === "aprobada";
  });
}
