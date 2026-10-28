import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  RotateCcw,
  Download,
  Calendar,
  X,
  FileQuestion,
  Plus,
  CreditCard,
  FileText,
} from 'lucide-react';
import type { Transaction, FilterState, PaymentMethod } from '../types';
import { useTransactions } from '../context/TransactionContext';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../utils/categories';
import { isDateMatchingFilter } from '../utils/dates';
import { TransactionItem } from './TransactionItem';
import { ConfirmModal } from './ConfirmModal';

interface TransactionListProps {
  maxItems?: number;
  showFilters?: boolean;
  fixedType?: 'income' | 'expense';
  title?: string;
  onViewAll?: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  maxItems,
  showFilters = true,
  fixedType,
  title,
  onViewAll,
}) => {
  const {
    transactions,
    currency,
    deleteTransaction,
    setEditingTransaction,
    setIsAddModalOpen,
    exportCSV,
    exportPDFLedger,
  } = useTransactions();

  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: fixedType || 'all',
    category: 'all',
    paymentMethod: 'all',
    dateRange: 'all',
    startDate: '',
    endDate: '',
    sortBy: 'newest',
  });

  const [transactionToDelete, setTransactionToDelete] =
    useState<Transaction | null>(null);

  // Available categories based on selected type (de-duplicated)
  const availableCategories = useMemo(() => {
    const activeType = fixedType || filters.type;
    if (activeType === 'income') return INCOME_CATEGORIES;
    if (activeType === 'expense') return EXPENSE_CATEGORIES;
    return Array.from(new Set([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]));
  }, [filters.type, fixedType]);

  // Filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    const targetType = fixedType || filters.type;

    return transactions
      .filter((tx) => {
        // Search matching (description or category)
        if (filters.search.trim()) {
          const q = filters.search.trim().toLowerCase();
          const matchDesc = tx.description.toLowerCase().includes(q);
          const matchCat = tx.category.toLowerCase().includes(q);
          const matchReceipt = tx.receipt?.toLowerCase().includes(q);
          if (!matchDesc && !matchCat && !matchReceipt) return false;
        }

        // Type filter
        if (targetType !== 'all' && tx.type !== targetType) {
          return false;
        }

        // Category filter
        if (filters.category !== 'all' && tx.category !== filters.category) {
          return false;
        }

        // Payment method filter
        if (filters.paymentMethod !== 'all' && tx.paymentMethod !== filters.paymentMethod) {
          return false;
        }

        // Date filter
        if (
          !isDateMatchingFilter(
            tx.date,
            filters.dateRange,
            filters.startDate,
            filters.endDate
          )
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'newest') {
          const dateDiff = b.date.localeCompare(a.date);
          return dateDiff !== 0 ? dateDiff : b.createdAt - a.createdAt;
        }
        if (filters.sortBy === 'oldest') {
          const dateDiff = a.date.localeCompare(b.date);
          return dateDiff !== 0 ? dateDiff : a.createdAt - b.createdAt;
        }
        if (filters.sortBy === 'highest') {
          return b.amount - a.amount;
        }
        if (filters.sortBy === 'lowest') {
          return a.amount - b.amount;
        }
        return 0;
      });
  }, [transactions, filters, fixedType]);

  const displayedList = maxItems
    ? filteredTransactions.slice(0, maxItems)
    : filteredTransactions;

  const isFiltered =
    Boolean(filters.search.trim()) ||
    (!fixedType && filters.type !== 'all') ||
    filters.category !== 'all' ||
    filters.paymentMethod !== 'all' ||
    filters.dateRange !== 'all' ||
    Boolean(filters.startDate) ||
    Boolean(filters.endDate) ||
    filters.sortBy !== 'newest';

  const activeFilterDescription = useMemo(() => {
    if (!isFiltered) return 'Complete Ledger (Unfiltered)';
    const parts: string[] = [];
    if (filters.search.trim()) parts.push(`Search: "${filters.search.trim()}"`);
    const activeType = fixedType || filters.type;
    if (activeType !== 'all') parts.push(`Type: ${activeType}`);
    if (filters.category !== 'all') parts.push(`Category: ${filters.category}`);
    if (filters.paymentMethod !== 'all') parts.push(`Method: ${filters.paymentMethod}`);
    if (filters.dateRange !== 'all') parts.push(`Date: ${filters.dateRange}`);
    return parts.join(' | ') || 'Filtered Selection';
  }, [isFiltered, filters, fixedType]);

  const handleResetFilters = () => {
    setFilters({
      search: '',
      type: fixedType || 'all',
      category: 'all',
      paymentMethod: 'all',
      dateRange: 'all',
      startDate: '',
      endDate: '',
      sortBy: 'newest',
    });
  };

  const handleDeleteConfirm = () => {
    if (transactionToDelete) {
      deleteTransaction(transactionToDelete.id);
      setTransactionToDelete(null);
    }
  };

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsAddModalOpen(true);
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
      {/* Top Header of the Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {title || (maxItems ? 'Recent Transactions' : 'Transaction History')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Showing {displayedList.length} of {transactions.length} total entries
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {maxItems && onViewAll && (
            <button
              onClick={onViewAll}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer"
            >
              View Full Ledger &rarr;
            </button>
          )}

          {!maxItems && transactions.length > 0 && (
            <>
              <button
                onClick={() =>
                  exportPDFLedger(
                    filteredTransactions,
                    isFiltered,
                    activeFilterDescription
                  )
                }
                title="Download formatted executive PDF statement"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-xl transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>PDF Statement ({filteredTransactions.length})</span>
              </button>

              <button
                onClick={() => exportCSV(filteredTransactions, isFiltered)}
                title="Download CSV spreadsheet"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>CSV</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Controls (shown if showFilters is true) */}
      {showFilters && (
        <div className="space-y-3 mb-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                placeholder="Search memo, invoice, category..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
              />
              {filters.search && (
                <button
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, search: '' }))
                  }
                  aria-label="Clear search text"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Type Filter (hidden if fixedType is provided) */}
            {!fixedType ? (
              <div className="flex items-center p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                {(['all', 'income', 'expense'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        type: t,
                        category: 'all',
                      }))
                    }
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors cursor-pointer ${
                      filters.type === t
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <select
                  value={filters.paymentMethod}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      paymentMethod: e.target.value as any,
                    }))
                  }
                  className="w-full py-2 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                >
                  <option value="all">All Payment Methods</option>
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm.method} value={pm.method}>
                      {pm.method}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Category Dropdown */}
            <div>
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, category: e.target.value }))
                }
                className="w-full py-2 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
              >
                <option value="all">All Categories</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div>
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    sortBy: e.target.value as any,
                  }))
                }
                className="w-full py-2 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="highest">Sort: Highest Amount</option>
                <option value="lowest">Sort: Lowest Amount</option>
              </select>
            </div>
          </div>

          {/* Date Range Sub-controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-xs">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-slate-400 font-medium mr-1">Period:</span>
              {[
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: 'this_week', label: 'This Week' },
                { id: 'this_month', label: 'This Month' },
                { id: 'this_year', label: 'This Year' },
                { id: 'custom', label: 'Custom' },
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, dateRange: d.id as any }))
                  }
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    filters.dateRange === d.id
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {isFiltered && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Custom Date Pickers */}
          {filters.dateRange === 'custom' && (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs">From:</span>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="py-1 px-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs">To:</span>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                  className="py-1 px-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transaction List Entries */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {displayedList.length > 0 ? (
          displayedList.map((tx) => (
            <TransactionItem
              key={tx.id}
              transaction={tx}
              currency={currency}
              onEditRequest={handleEdit}
              onDeleteRequest={(t) => setTransactionToDelete(t)}
            />
          ))
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
              <FileQuestion className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              No transactions found
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm">
              {isFiltered
                ? 'No records match the active criteria. Try adjusting or resetting your filters.'
                : 'Your financial ledger is currently empty. Start logging your income or expenses.'}
            </p>

            <div className="mt-4 flex items-center gap-3">
              {isFiltered ? (
                <button
                  onClick={handleResetFilters}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              ) : (
                <button
                  onClick={() => {
                    setEditingTransaction(null);
                    setIsAddModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log First Transaction</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(transactionToDelete)}
        title="Delete Transaction"
        message={`Are you sure you want to delete "${transactionToDelete?.description}"? This action cannot be undone.`}
        confirmLabel="Delete Record"
        cancelLabel="Keep Record"
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setTransactionToDelete(null)}
      />
    </div>
  );
};
