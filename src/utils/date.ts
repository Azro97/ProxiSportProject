// src/utils/date.ts
// Date helpers used by services and filter components.
// All computations use local time so start/end-of-day match the user's timezone.

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Returns today + the next 13 days as date chip data.
 * Matches the reference design: day name / day number / month abbreviation.
 */
export function getUpcomingWeekDays(): {
  dayName: string;
  dayNum: number;
  month: string;
  date: Date;
}[] {
  const dayLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const today = new Date();
  const result = [];
  for (let i = 0; i <= 13; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    result.push({
      dayName: i === 0 ? 'Auj.' : dayLabels[d.getDay()],
      dayNum: d.getDate(),
      month: monthLabels[d.getMonth()],
      date: d,
    });
  }
  return result;
}

/** Format a Date as DD/MM/YYYY (local time). */
export function formatDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Format a Date as HH:MM (local time). */
export function formatTime(d: Date): string {
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/** Format a Date as "15 juillet 2026" (long French format). */
export function formatDateLong(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
