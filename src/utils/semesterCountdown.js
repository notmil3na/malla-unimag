export const SEMESTER_CORTE = "2026-2";
export const SEMESTER_START = new Date(2026, 7, 3); // 3 ago 2026
export const SEMESTER_END = new Date(2026, 10, 28, 23, 59, 59, 999); // 28 nov 2026
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function getSemesterCountdown(now = new Date()) {
  const today = startOfDay(now);
  const start = startOfDay(SEMESTER_START);
  const endDay = startOfDay(new Date(2026, 10, 28));

  if (today < start) {
    const daysUntilStart = Math.round((start - today) / MS_PER_DAY);
    return {
      days: daysUntilStart,
      daysText: daysUntilStart === 1 ? "día para iniciar clases" : "días para iniciar clases",
      status: "Aún no inicia",
      showProgress: false,
      progress: 0,
      progressInfo: null,
    };
  }

  if (today > endDay) {
    return {
      days: 0,
      daysText: "días para terminar",
      status: "Semestre finalizado",
      showProgress: true,
      progress: 100,
      progressInfo: {
        left: "100% del semestre transcurrido",
        right: "0 días restantes",
      },
    };
  }

  const totalSemesterDays = Math.ceil((SEMESTER_END - SEMESTER_START) / MS_PER_DAY);
  const elapsedDays = Math.max(0, Math.ceil((today - SEMESTER_START) / MS_PER_DAY));
  const remainingDays = Math.max(0, Math.ceil((SEMESTER_END - now) / MS_PER_DAY));
  const semesterProgress = Math.min(
    100,
    Math.max(0, Math.round((elapsedDays / totalSemesterDays) * 100))
  );

  return {
    days: remainingDays,
    daysText: remainingDays === 1 ? "día para terminar" : "días para terminar",
    status: "Semestre en curso",
    showProgress: true,
    progress: semesterProgress,
    progressInfo: {
      left: `${semesterProgress}% del semestre transcurrido`,
      right: `${remainingDays} días restantes`,
    },
  };
}
