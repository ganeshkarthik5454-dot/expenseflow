import React from 'react';
import { Trash2, Edit2, Repeat, Receipt, Smartphone } from 'lucide-react';
import type { Transaction } from '../types';
import { getCategoryMeta } from '../utils/categories';
import { formatCurrency, formatDate } from '../utils/formatters';

interface TransactionItemProps {
  transaction: Transaction;
  currency: string;
  onEditRequest?: (transaction: Transaction) => void;
  onDeleteRequest: (transaction: Transaction) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  currency,
  onEditRequest,
  onDeleteRequest,
}) => {
  const meta = getCategoryMeta(transaction.category);
  const Icon = meta.icon;
  const isIncome = transaction.type === 'income';

  return (
    <div className="group flex items-center justify-between p-3 sm:p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800/80 last:border-b-0">
      {/* Left: Category Icon + Description & Metadata */}
      <div className="flex items-center gap-3.5 min-w-0 pr-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
          style={{
            backgroundColor: meta.bgColor,
            color: meta.color,
          }}
        >
          <Icon className="w-5 h-5" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {transaction.description}
            </p>
            {transaction.recurring && (
              <span
                title="Recurring transaction"
                className="p-0.5 rounded text-slate-400 dark:text-slate-500 hover:text-emerald-500"
              >
                <Repeat className="w-3 h-3" />
              </span>
            )}
            {transaction.receipt && (
              <span
                title={`Receipt: ${transaction.receipt}`}
                className="p-0.5 rounded text-slate-400 dark:text-slate-500"
              >
                <Receipt className="w-3 h-3" />
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {transaction.category}
            </span>
            <span aria-hidden="true">·</span>
            <span>{formatDate(transaction.date)}</span>
            {transaction.paymentMethod && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[11px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400 font-medium">
                  {transaction.paymentMethod}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Amount & Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="text-right">
          <span
            className={`text-sm sm:text-base font-bold font-mono tabular-nums ${
              isIncome
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(
              isIncome ? transaction.amount : -transaction.amount,
              currency,
              true
            )}
          </span>
        </div>

        <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
          {onEditRequest && (
            <button
              onClick={() => onEditRequest(transaction)}
              aria-label={`Edit ${transaction.description}`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => onDeleteRequest(transaction)}
            aria-label={`Delete ${transaction.description}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
