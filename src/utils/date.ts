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
 * Returns today + the next 6 days as { label, date } pairs.
 * Today is always labelled "Aujourd'hui".
 */
export function getUpcomingWeekDays(): { label: string; date: Date }[] {
  const dayLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const today = new Date();
  const result: { label: string; date: Date }[] = [
    { label: "Aujourd'hui", date: today },
  ];
  for (let i = 1; i <= 6; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    result.push({ label: dayLabels[d.getDay()], date: d });
  }
  return result;
}
