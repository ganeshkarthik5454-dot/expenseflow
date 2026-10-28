import type { Transaction } from '../types';
import { getTodayDateString } from './dates';

/**
 * Sanitize cell to prevent CSV formula injection (DDE attacks)
 * If cell starts with =, +, -, @, \t, or \r, prepend a single quote
 */
function sanitizeCSVField(val: string | number | undefined | null): string {
  if (val === null || val === undefined) return '';
  let str = String(val);

  // Prevent CSV Formula Injection
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (/[",\n\r]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Export transactions array to downloadable CSV file
 */
export function exportTransactionsToCSV(
  transactions: Transaction[],
  isFiltered: boolean = false
): { success: boolean; message: string; count: number } {
  if (!transactions || transactions.length === 0) {
    return {
      success: false,
      message: 'No transactions available to export.',
      count: 0,
    };
  }

  try {
    const headers = [
      'Date',
      'Transaction Type',
      'Category',
      'Description',
      'Amount',
      'Payment Method',
      'Transaction ID',
    ];

    const rows = transactions.map((tx) => [
      sanitizeCSVField(tx.date),
      sanitizeCSVField(tx.type),
      sanitizeCSVField(tx.category),
      sanitizeCSVField(tx.description),
      // Store numeric amount directly with 2 decimals
      tx.amount.toFixed(2),
      sanitizeCSVField(tx.paymentMethod || 'Other'),
      sanitizeCSVField(tx.id),
    ]);

    const csvContent =
      '\uFEFF' + // UTF-8 BOM for Excel compatibility
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    if (typeof document !== 'undefined') {
      const link = document.createElement('a');
      const today = getTodayDateString();
      const suffix = isFiltered ? '-filtered' : '';
      link.href = url;
      link.download = `expenseflow-transactions${suffix}-${today}.csv`;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up object URL after short delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    }

    return {
      success: true,
      message: `Exported ${transactions.length} transaction${
        transactions.length === 1 ? '' : 's'
      } to CSV.`,
      count: transactions.length,
    };
  } catch (error) {
    console.error('Failed to export CSV:', error);
    return {
      success: false,
      message: 'An unexpected error occurred while generating CSV export.',
      count: 0,
    };
  }
}
