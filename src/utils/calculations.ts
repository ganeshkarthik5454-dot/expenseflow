import type { Transaction, Category } from '../types';

export interface FinancialTotals {
  totalIncome: number;
  totalExpenses: number;
  totalBalance: number;
  percentageSpent: number;
  savingsPercentage: number;
}

export interface CategoryStat {
  category: Category;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface HighestSpendingResult {
  category: string | null;
  amount: number;
  percentage: number;
  summary: string;
}

export interface MonthlyStats {
  income: number;
  expenses: number;
  netBalance: number;
  percentageSpent: number;
  prevIncome: number;
  prevExpenses: number;
  expenseDiff: number;
  expenseDiffPct: number | null;
}

/**
 * Calculate overall financial totals consistently
 */
export function calculateTotals(transactions: Transaction[]): FinancialTotals {
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const tx of transactions) {
    if (tx.type === 'income') {
      totalIncome += tx.amount;
    } else if (tx.type === 'expense') {
      totalExpenses += tx.amount;
    }
  }

  // Round to 2 decimal places to avoid floating point inaccuracies
  totalIncome = Math.round(totalIncome * 100) / 100;
  totalExpenses = Math.round(totalExpenses * 100) / 100;
  const totalBalance = Math.round((totalIncome - totalExpenses) * 100) / 100;

  let percentageSpent = 0;
  let savingsPercentage = 0;

  if (totalIncome > 0) {
    percentageSpent = Math.round(((totalExpenses / totalIncome) * 100) * 10) / 10;
    savingsPercentage = Math.round((((totalIncome - totalExpenses) / totalIncome) * 100) * 10) / 10;
  } else if (totalExpenses > 0) {
    percentageSpent = 100; // If expenses exist without income
    savingsPercentage = 0;
  }

  return {
    totalIncome,
    totalExpenses,
    totalBalance,
    percentageSpent,
    savingsPercentage,
  };
}

/**
 * Calculate category breakdown for expenses or income
 */
export function calculateCategoryBreakdown(
  transactions: Transaction[],
  type: 'expense' | 'income' = 'expense'
): CategoryStat[] {
  const filtered = transactions.filter((tx) => tx.type === type);
  const totalAmount = filtered.reduce((acc, curr) => acc + curr.amount, 0);

  if (totalAmount === 0) return [];

  const map = new Map<Category, { amount: number; count: number }>();

  for (const tx of filtered) {
    const existing = map.get(tx.category) || { amount: 0, count: 0 };
    map.set(tx.category, {
      amount: Math.round((existing.amount + tx.amount) * 100) / 100,
      count: existing.count + 1,
    });
  }

  const result: CategoryStat[] = [];
  map.forEach((val, category) => {
    const percentage = totalAmount > 0 ? (val.amount / totalAmount) * 100 : 0;
    result.push({
      category,
      amount: val.amount,
      percentage: Math.round(percentage * 10) / 10,
      transactionCount: val.count,
    });
  });

  return result.sort((a, b) => b.amount - a.amount);
}

/**
 * Determine the highest spending category for a given month or all time
 */
export function calculateHighestSpendingCategory(
  transactions: Transaction[],
  monthKey?: string
): HighestSpendingResult {
  const filtered = monthKey
    ? transactions.filter((tx) => tx.date.startsWith(monthKey))
    : transactions;

  const breakdown = calculateCategoryBreakdown(filtered, 'expense');

  if (breakdown.length === 0 || breakdown[0].amount === 0) {
    return {
      category: null,
      amount: 0,
      percentage: 0,
      summary: monthKey
        ? 'No expenses recorded for this month.'
        : 'No expense records found.',
    };
  }

  const top = breakdown[0];
  const summary = `${top.category} is your highest spending category${
    monthKey ? ' this month' : ''
  }, accounting for ${top.percentage.toFixed(1)}% of expenses.`;

  return {
    category: top.category,
    amount: top.amount,
    percentage: top.percentage,
    summary,
  };
}

/**
 * Calculate monthly statistics including comparison with previous month
 */
export function calculateMonthlyStats(
  transactions: Transaction[],
  selectedMonth: string
): MonthlyStats {
  const currentMonthTx = transactions.filter((tx) =>
    tx.date.startsWith(selectedMonth)
  );
  const currentTotals = calculateTotals(currentMonthTx);

  // Compute previous month key
  const [yearStr, monthStr] = selectedMonth.split('-');
  let prevYear = parseInt(yearStr, 10);
  let prevMonth = parseInt(monthStr, 10) - 1;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear -= 1;
  }
  const prevMonthKey = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

  const prevMonthTx = transactions.filter((tx) =>
    tx.date.startsWith(prevMonthKey)
  );
  const prevTotals = calculateTotals(prevMonthTx);

  const expenseDiff =
    Math.round((currentTotals.totalExpenses - prevTotals.totalExpenses) * 100) /
    100;

  let expenseDiffPct: number | null = null;
  if (prevTotals.totalExpenses > 0) {
    expenseDiffPct =
      ((currentTotals.totalExpenses - prevTotals.totalExpenses) /
        prevTotals.totalExpenses) *
      100;
  }

  return {
    income: currentTotals.totalIncome,
    expenses: currentTotals.totalExpenses,
    netBalance: currentTotals.totalBalance,
    percentageSpent: currentTotals.percentageSpent,
    prevIncome: prevTotals.totalIncome,
    prevExpenses: prevTotals.totalExpenses,
    expenseDiff,
    expenseDiffPct,
  };
}
