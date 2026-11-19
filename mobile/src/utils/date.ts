import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';

dayjs.extend(relativeTime);
dayjs.extend(isToday);
dayjs.extend(isYesterday);

export function formatDate(date: string | Date): string {
  return dayjs(date).format('DD MMM YYYY');
}

export function formatTime(date: string | Date): string {
  return dayjs(date).format('hh:mm A');
}

export function formatDateShort(date: string | Date): string {
  return dayjs(date).format('DD MMM');
}

export function formatDateForInput(date: string | Date): string {
  return dayjs(date).format('YYYY-MM-DD');
}

export function formatMonthYear(date: string | Date): string {
  return dayjs(date).format('MMMM YYYY');
}

export function getGreeting(): string {
  const hour = dayjs().hour();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function getRelativeDate(date: string | Date): string {
  const d = dayjs(date);
  if (d.isToday()) return 'Today';
  if (d.isYesterday()) return 'Yesterday';
  return formatDate(date);
}

export function getStartOfToday(): string {
  return dayjs().startOf('day').format('YYYY-MM-DD');
}

export function getStartOfWeek(): string {
  return dayjs().startOf('week').format('YYYY-MM-DD');
}

export function getStartOfMonth(): string {
  return dayjs().startOf('month').format('YYYY-MM-DD');
}

export function getEndOfMonth(): string {
  return dayjs().endOf('month').format('YYYY-MM-DD');
}

export function getCurrentMonth(): number {
  return dayjs().month() + 1;
}

export function getCurrentYear(): number {
  return dayjs().year();
}

export function getDaysInMonth(month: number, year: number): number {
  return dayjs(`${year}-${month}-01`).daysInMonth();
}

export function today(): string {
  return dayjs().format('YYYY-MM-DD');
}
