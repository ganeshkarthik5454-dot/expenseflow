import React from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { formatCurrency } from '../utils/formatters';
import type { FinancialTotals } from '../utils/calculations';
import type { Transaction } from '../types';

interface SummaryCardsProps {
  totals?: FinancialTotals;
  transactions?: Transaction[];
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  totals: propTotals,
  transactions: propTransactions,
}) => {
  const { totals: contextTotals, currency, transactions: contextTransactions } =
    useTransactions();

  const totals = propTotals || contextTotals;
  const transactions = propTransactions || contextTransactions;

  const incomeCount = transactions.filter((t) => t.type === 'income').length;
  const expenseCount = transactions.filter((t) => t.type === 'expense').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
      {/* CARD 1: TOTAL BALANCE */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
            Total Net Balance
          </span>
          <div
            className={`p-2.5 rounded-xl ${
              totals.totalBalance > 0
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                : totals.totalBalance < 0
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="space-y-1">
          <div
            className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight tabular-nums ${
              totals.totalBalance > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : totals.totalBalance < 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-800 dark:text-slate-200'
            }`}
          >
            {formatCurrency(totals.totalBalance, currency)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span>{transactions.length} total transactions</span>
          </p>
        </div>
      </div>

      {/* CARD 2: TOTAL INCOME */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
            Total Income
          </span>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatCurrency(totals.totalIncome, currency)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {incomeCount} income {incomeCount === 1 ? 'entry' : 'entries'}
          </p>
        </div>
      </div>

      {/* CARD 3: TOTAL EXPENSES */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-rose-200 dark:hover:border-rose-900/50 transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
            Total Expenses
          </span>
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-rose-600 dark:text-rose-400 tabular-nums">
            {formatCurrency(totals.totalExpenses, currency)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {expenseCount} expense {expenseCount === 1 ? 'entry' : 'entries'}
          </p>
        </div>
      </div>
    </div>
  );
};
