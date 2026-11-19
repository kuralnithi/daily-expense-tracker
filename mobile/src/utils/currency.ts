import { CURRENCY_SYMBOL } from './constants';

/**
 * Format a number as Indian Rupees
 * e.g. 12345.67 -> ₹12,345.67
 */
export function formatCurrency(amount: number, showSymbol = true): string {
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  return showSymbol ? `${CURRENCY_SYMBOL}${formatted}` : formatted;
}

/**
 * Format compact number (e.g. 12345 -> ₹12.3K)
 */
export function formatCompactCurrency(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 100000) {
    return `${CURRENCY_SYMBOL}${(abs / 100000).toFixed(1)}L`;
  }
  if (abs >= 1000) {
    return `${CURRENCY_SYMBOL}${(abs / 1000).toFixed(1)}K`;
  }
  return formatCurrency(amount);
}

/**
 * Parse a currency string to number
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[₹,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}
