import type {
  Transaction,
  ThemeMode,
  Budget,
  SavingsGoal,
  Bill,
  Subscription,
  PaymentMethod,
} from '../types';
import {
  getTodayDateString,
  getCurrentMonthKey,
  getPreviousMonthKey,
} from './dates';

export const STORAGE_KEYS = {
  TRANSACTIONS: 'expenseflow_transactions_v1',
  BUDGETS: 'expenseflow_budgets_v1',
  SAVINGS_GOALS: 'expenseflow_savings_v1',
  BILLS: 'expenseflow_bills_v1',
  SUBSCRIPTIONS: 'expenseflow_subscriptions_v1',
  THEME: 'expenseflow_theme_v1',
  CURRENCY: 'expenseflow_currency_v1',
};

// Initial clean empty sets
export function getInitialSampleTransactions(): Transaction[] {
  return [];
}

export function getInitialSampleBudgets(): Budget[] {
  return [];
}

export function getInitialSampleSavingsGoals(): SavingsGoal[] {
  return [];
}

export function getInitialSampleBills(): Bill[] {
  return [];
}

export function getInitialSampleSubscriptions(): Subscription[] {
  return [];
}

export function isValidTransactionObject(obj: any): obj is Transaction {
  if (!obj || typeof obj !== 'object') return false;
  if (typeof obj.id !== 'string' || !obj.id) return false;
  if (typeof obj.description !== 'string' || !obj.description.trim()) return false;
  if (typeof obj.amount !== 'number' || isNaN(obj.amount) || !isFinite(obj.amount) || obj.amount <= 0) return false;
  if (obj.type !== 'income' && obj.type !== 'expense') return false;
  if (typeof obj.category !== 'string' || !obj.category) return false;
  if (typeof obj.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(obj.date)) return false;
  return true;
}

// Transactions
export function loadTransactionsFromStorage(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      saveTransactionsToStorage([]);
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      saveTransactionsToStorage([]);
      return [];
    }
    const filtered = parsed
      .filter(isValidTransactionObject)
      .filter((tx) => !tx.id.startsWith('tx_init_') && !tx.id.startsWith('tx_prev_'));
    if (filtered.length !== parsed.length) {
      saveTransactionsToStorage(filtered);
    }
    return filtered;
  } catch (error) {
    return [];
  }
}

export function saveTransactionsToStorage(transactions: Transaction[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    return true;
  } catch (error) {
    return false;
  }
}

export function clearTransactionsFromStorage(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    return true;
  } catch (error) {
    return false;
  }
}

// Budgets
export function loadBudgetsFromStorage(): Budget[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    if (!raw) {
      saveBudgetsToStorage([]);
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const filtered = parsed.filter((b: Budget) => b && typeof b.id === 'string' && !b.id.startsWith('b_'));
    if (filtered.length !== parsed.length) {
      saveBudgetsToStorage(filtered);
    }
    return filtered;
  } catch {
    return [];
  }
}

export function saveBudgetsToStorage(budgets: Budget[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    return true;
  } catch {
    return false;
  }
}

// Savings Goals
export function loadSavingsGoalsFromStorage(): SavingsGoal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVINGS_GOALS);
    if (!raw) {
      saveSavingsGoalsToStorage([]);
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const filtered = parsed.filter((g: SavingsGoal) => g && typeof g.id === 'string' && !g.id.startsWith('sg_'));
    if (filtered.length !== parsed.length) {
      saveSavingsGoalsToStorage(filtered);
    }
    return filtered;
  } catch {
    return [];
  }
}

export function saveSavingsGoalsToStorage(goals: SavingsGoal[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, JSON.stringify(goals));
    return true;
  } catch {
    return false;
  }
}

// Bills
export function loadBillsFromStorage(): Bill[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BILLS);
    if (!raw) {
      saveBillsToStorage([]);
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const filtered = parsed.filter((b: Bill) => b && typeof b.id === 'string' && !b.id.startsWith('bill_'));
    if (filtered.length !== parsed.length) {
      saveBillsToStorage(filtered);
    }
    return filtered;
  } catch {
    return [];
  }
}

export function saveBillsToStorage(bills: Bill[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
    return true;
  } catch {
    return false;
  }
}

// Subscriptions
export function loadSubscriptionsFromStorage(): Subscription[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
    if (!raw) {
      saveSubscriptionsToStorage([]);
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const filtered = parsed.filter((s: Subscription) => s && typeof s.id === 'string' && !s.id.startsWith('sub_'));
    if (filtered.length !== parsed.length) {
      saveSubscriptionsToStorage(filtered);
    }
    return filtered;
  } catch {
    return [];
  }
}

export function saveSubscriptionsToStorage(subscriptions: Subscription[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions));
    return true;
  } catch {
    return false;
  }
}

// Theme & Currency
export function loadThemeFromStorage(): ThemeMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.THEME);
    if (raw === 'light' || raw === 'dark') return raw;
  } catch {}
  if (typeof window !== 'undefined' && window.matchMedia) {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  }
  return 'light';
}

export function saveThemeToStorage(theme: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch {}
}

export function loadCurrencyFromStorage(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENCY);
    if (raw && typeof raw === 'string') return raw;
  } catch {}
  return 'INR';
}

export function saveCurrencyToStorage(currencyCode: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENCY, currencyCode);
  } catch {}
}
