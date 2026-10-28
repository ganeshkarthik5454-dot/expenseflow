import type { Transaction, DateFilterOption } from '../types';

/**
 * Returns today's local date as YYYY-MM-DD string without UTC skew
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns current month key as YYYY-MM
 */
export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Returns previous month key as YYYY-MM
 */
export function getPreviousMonthKey(): string {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-indexed, so 0 is previous month of month 1
  if (month === 0) {
    month = 12;
    year -= 1;
  }
  const monthStr = String(month).padStart(2, '0');
  return `${year}-${monthStr}`;
}

/**
 * Formats full current day for header
 */
export function formatHeaderDate(): string {
  const now = new Date();
  return now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Extracts distinct months present across transactions plus the current month, sorted newest first
 */
export function getAvailableMonths(transactions: Transaction[]): string[] {
  const monthSet = new Set<string>();
  monthSet.add(getCurrentMonthKey());
  monthSet.add(getPreviousMonthKey());

  transactions.forEach((tx) => {
    if (tx.date && tx.date.length >= 7) {
      monthSet.add(tx.date.substring(0, 7));
    }
  });

  return Array.from(monthSet).sort().reverse();
}

/**
 * Helper to get week start date string (Monday of current week)
 */
export function getWeekStartDateString(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday
  const monday = new Date(now.setDate(diff));
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const d = String(monday.getDate()).padStart(2, '0');
  return `${year}-${month}-${d}`;
}

/**
 * Helper to get current year string (e.g. "2026")
 */
export function getCurrentYearString(): string {
  return String(new Date().getFullYear());
}

/**
 * Checks if a transaction date string matches a filter
 */
export function isDateMatchingFilter(
  txDate: string,
  filterType: 'all' | 'current-month' | 'previous-month' | 'custom' | DateFilterOption,
  customStart?: string,
  customEnd?: string
): boolean {
  if (filterType === 'all') return true;

  const today = getTodayDateString();
  const currentMonth = getCurrentMonthKey();
  const previousMonth = getPreviousMonthKey();
  const weekStart = getWeekStartDateString();
  const currentYear = getCurrentYearString();

  if (filterType === 'today') {
    return txDate === today;
  }

  if (filterType === 'this_week') {
    return txDate >= weekStart && txDate <= today;
  }

  if (filterType === 'this_month' || filterType === 'current-month') {
    return txDate.startsWith(currentMonth);
  }

  if (filterType === 'previous-month') {
    return txDate.startsWith(previousMonth);
  }

  if (filterType === 'this_year') {
    return txDate.startsWith(currentYear);
  }

  if (filterType === 'custom') {
    if (customStart && txDate < customStart) return false;
    if (customEnd && txDate > customEnd) return false;
    return true;
  }

  return true;
}
