export type TransactionType = 'income' | 'expense';

export type IncomeCategory =
  | 'Salary'
  | 'Freelance'
  | 'Investments'
  | 'Business'
  | 'Rental'
  | 'Others';

export type ExpenseCategory =
  | 'Housing'
  | 'Groceries'
  | 'Transport'
  | 'Utilities'
  | 'Entertainment'
  | 'Healthcare'
  | 'Education'
  | 'Shopping'
  | 'Dining Out'
  | 'Personal Care'
  | 'Travel'
  | 'Others';

export type Category = IncomeCategory | ExpenseCategory;

export type PaymentMethod =
  | 'UPI'
  | 'Cash'
  | 'Debit Card'
  | 'Credit Card'
  | 'Bank Transfer'
  | 'Other';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: Category;
  date: string; // YYYY-MM-DD
  createdAt: number;
  paymentMethod?: PaymentMethod;
  recurring?: boolean;
  recurringFrequency?: 'weekly' | 'monthly' | 'yearly';
  receipt?: string; // base64 or image/receipt note
  notes?: string;
}

export interface Budget {
  id: string;
  category: Category;
  monthlyLimit: number;
  period: string; // YYYY-MM
  alertThreshold?: number; // default 80%
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  category: string;
  color?: string;
  notes?: string;
}

export interface Bill {
  id: string;
  title: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  category: Category;
  recurring: boolean;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  status: 'upcoming' | 'paid' | 'overdue';
  autoPay?: boolean;
  paidDate?: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: string; // YYYY-MM-DD
  category: Category;
  paymentMethod: PaymentMethod;
  status: 'active' | 'cancelled' | 'paused';
  icon?: string;
}

export type DateFilterOption =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'this_year'
  | 'custom';

export interface FilterState {
  search: string;
  type: 'all' | 'income' | 'expense';
  category: string;
  paymentMethod: 'all' | PaymentMethod;
  dateRange: 'all' | 'current-month' | 'previous-month' | 'custom' | DateFilterOption;
  startDate: string;
  endDate: string;
  sortBy: 'newest' | 'oldest' | 'highest' | 'lowest';
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
}

export type ThemeMode = 'light' | 'dark';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export type NavigationTab =
  | 'dashboard'
  | 'transactions'
  | 'income'
  | 'expenses'
  | 'categories'
  | 'budgets'
  | 'savings_goals'
  | 'bills'
  | 'subscriptions'
  | 'reports'
  | 'ai_assistant'
  | 'emi_calculator'
  | 'settings'
  | 'profile';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
