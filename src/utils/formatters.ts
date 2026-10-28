import type { CurrencyConfig } from '../types';

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR)' },
  { code: 'USD', symbol: '$', name: 'US Dollar (USD)' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (GBP)' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen (JPY)' },
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar (CAD)' },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar (AUD)' },
];

/**
 * Format numeric amount into formatted currency string.
 * Default is INR with Indian number grouping (e.g., ₹1,50,000.00).
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'INR',
  showSign: boolean = false
): string {
  if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
    amount = 0;
  }

  const locale = currencyCode === 'INR' ? 'en-IN' : 'en-US';
  const absVal = Math.abs(amount);

  let formatted = '';
  try {
    formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(absVal);
  } catch (err) {
    // Fallback if currency code is unrecognized
    const cur = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode);
    const sym = cur?.symbol || '₹';
    formatted = `${sym}${absVal.toFixed(2)}`;
  }

  if (showSign) {
    if (amount > 0) return `+${formatted}`;
    if (amount < 0) return `−${formatted}`;
    return formatted;
  }

  return formatted;
}

/**
 * Format standard YYYY-MM-DD date into localized human-readable date.
 * Avoid timezone shift by splitting components.
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const date = new Date(year, month, day);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format YYYY-MM into readable month name and year (e.g. "October 2026")
 */
export function formatMonthKey(monthKey: string): string {
  if (!monthKey) return '';
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;

  const date = new Date(year, month, 1);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format percentage with controlled decimals
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return '0%';
  }
  return `${value.toFixed(decimals)}%`;
}
