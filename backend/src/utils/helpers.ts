/**
 * Format a Date object to YYYY-MM-DD string.
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculate start and end dates for a named period.
 */
export function calculateDateRange(period: 'today' | 'week' | 'month' | 'year'): {
  startDate: string;
  endDate: string;
} {
  const now = new Date();
  const today = formatDate(now);

  switch (period) {
    case 'today':
      return { startDate: today, endDate: today };

    case 'week': {
      const day = now.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { startDate: formatDate(monday), endDate: formatDate(sunday) };
    }

    case 'month': {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: formatDate(firstDay), endDate: formatDate(lastDay) };
    }

    case 'year': {
      const firstDay = new Date(now.getFullYear(), 0, 1);
      const lastDay = new Date(now.getFullYear(), 11, 31);
      return { startDate: formatDate(firstDay), endDate: formatDate(lastDay) };
    }

    default:
      return { startDate: today, endDate: today };
  }
}

/**
 * Returns offset and validated limit for pagination.
 */
export function paginationHelper(
  page: number,
  limit: number,
  maxLimit = 100
): { offset: number; limit: number; page: number } {
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(maxLimit, Math.max(1, Math.floor(limit)));
  const offset = (safePage - 1) * safeLimit;
  return { offset, limit: safeLimit, page: safePage };
}

/**
 * Parse a date string safely. Returns null if invalid.
 */
export function parseDate(dateStr: string): Date | null {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Returns true if a string is a valid YYYY-MM-DD date.
 */
export function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}
