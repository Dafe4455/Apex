// lib/dates.ts
export function calculatePeriodEnd(start: Date, interval: string): Date {
  const date = new Date(start);
  if (interval === "MONTHLY") date.setMonth(date.getMonth() + 1);
  else if (interval === "YEARLY") date.setFullYear(date.getFullYear() + 1);
  return date;
}
