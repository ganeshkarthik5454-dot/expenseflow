import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Edit2,
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
  Coins,
  Repeat,
  Receipt,
  FileText,
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  getCategoryMeta,
  getDefaultCategory,
} from '../utils/categories';
import { getTodayDateString } from '../utils/dates';
import { validateTransactionInput } from '../utils/validation';
import type { TransactionType, Category, PaymentMethod } from '../types';

export const TransactionModal: React.FC = () => {
  const {
    isAddModalOpen,
    setIsAddModalOpen,
    editingTransaction,
    setEditingTransaction,
    addTransaction,
    updateTransaction,
    currency,
  } = useTransactions();

  const isEditMode = Boolean(editingTransaction);

  const [type, setType] = useState<TransactionType>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Groceries');
  const [date, setDate] = useState(getTodayDateString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [recurring, setRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [receipt, setReceipt] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(getDefaultCategory(newType));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.category;
      return next;
    });
  };

  // Populate form on edit or reset on new
  useEffect(() => {
    if (isAddModalOpen) {
      if (editingTransaction) {
        setType(editingTransaction.type);
        setDescription(editingTransaction.description);
        setAmount(String(editingTransaction.amount));
        setCategory(editingTransaction.category);
        setDate(editingTransaction.date);
        setPaymentMethod(editingTransaction.paymentMethod || 'UPI');
        setRecurring(Boolean(editingTransaction.recurring));
        setRecurringFrequency(editingTransaction.recurringFrequency || 'monthly');
        setReceipt(editingTransaction.receipt || '');
        setNotes(editingTransaction.notes || '');
      } else {
        setType('expense');
        setDescription('');
        setAmount('');
        setCategory('Groceries');
        setDate(getTodayDateString());
        setPaymentMethod('UPI');
        setRecurring(false);
        setRecurringFrequency('monthly');
        setReceipt('');
        setNotes('');
      }
      setErrors({});
      setIsSubmitting(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isAddModalOpen, editingTransaction]);

  const handleClose = () => {
    setIsAddModalOpen(false);
    setEditingTransaction(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAddModalOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddModalOpen]);

  if (!isAddModalOpen) return null;

  const currentCategories =
    type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const validation = validateTransactionInput(
      description,
      amount,
      type,
      category,
      date
    );

    if (!validation.isValid) {
      setErrors(validation.errors as Record<string, string>);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const numAmount = parseFloat(amount);

    if (isEditMode && editingTransaction) {
      const success = await updateTransaction(editingTransaction.id, {
        description: description.trim(),
        amount: numAmount,
        type,
        category,
        date,
        paymentMethod,
        recurring,
        recurringFrequency: recurring ? recurringFrequency : undefined,
        receipt: receipt.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (success) {
        handleClose();
      } else {
        setIsSubmitting(false);
      }
    } else {
      const success = await addTransaction({
        description: description.trim(),
        amount: numAmount,
        type,
        category,
        date,
        paymentMethod,
        recurring,
        recurringFrequency: recurring ? recurringFrequency : undefined,
        receipt: receipt.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (success) {
        handleClose();
      } else {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="transaction-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isEditMode
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'bg-emerald-600/10 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {isEditMode ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <h2
              id="transaction-modal-title"
              className="text-base font-semibold text-slate-900 dark:text-slate-100"
            >
              {isEditMode ? 'Edit Transaction Record' : 'Log New Transaction'}
            </h2>
          </div>

          <button
            onClick={handleClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto space-y-4 flex-1 text-xs"
        >
          {/* Type Segmented Control */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  type === 'expense'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Expense</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  type === 'income'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>Income</span>
              </button>
            </div>
          </div>

          {/* Description & Amount Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Description <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {description.trim().length}/50
                </span>
              </div>
              <input
                type="text"
                maxLength={50}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Monthly salary or grocery shopping"
                className={`w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus-visible:ring-2 ${
                  errors.description
                    ? 'border-rose-400 focus-visible:ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus-visible:ring-emerald-500'
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.description}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Amount ({currency}) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Coins className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className={`w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-mono bg-white dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus-visible:ring-2 ${
                    errors.amount
                      ? 'border-rose-400 focus-visible:ring-rose-500'
                      : 'border-slate-200 dark:border-slate-700 focus-visible:ring-emerald-500'
                  }`}
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.amount}</span>
                </p>
              )}
            </div>
          </div>

          {/* Date & Payment Method Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Transaction Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-slate-100 ${
                  errors.date
                    ? 'border-rose-400 focus-visible:ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus-visible:ring-emerald-500'
                }`}
              />
              {errors.date && (
                <p className="mt-1 text-[11px] text-rose-500">{errors.date}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm.method} value={pm.method}>
                    {pm.method}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Selector Grid */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Category <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {currentCategories.map((cat) => {
                const meta = getCategoryMeta(cat);
                const Icon = meta.icon;
                const isSelected = category === cat;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 shadow-2xs font-semibold'
                        : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: meta.bgColor,
                        color: meta.color,
                      }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate">{cat}</span>
                  </button>
                );
              })}
            </div>
            {errors.category && (
              <p className="mt-1 text-[11px] text-rose-500">{errors.category}</p>
            )}
          </div>

          {/* Recurring & Receipt Options */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recurring}
                  onChange={(e) => setRecurring(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5 text-slate-400" />
                  <span>Recurring Transaction</span>
                </span>
              </label>

              {recurring && (
                <select
                  value={recurringFrequency}
                  onChange={(e) => setRecurringFrequency(e.target.value as any)}
                  className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 cursor-pointer"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Receipt className="w-3 h-3" />
                  <span>Receipt Reference / Invoice ID (Optional)</span>
                </label>
                <input
                  type="text"
                  value={receipt}
                  onChange={(e) => setReceipt(e.target.value)}
                  placeholder="e.g. REC-2026-9041 or store bill #"
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  <span>Additional Notes (Optional)</span>
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Shared bill with colleagues"
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition-all cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
              } disabled:opacity-50`}
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Record' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
