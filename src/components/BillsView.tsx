import React, { useState } from 'react';
import {
  CalendarClock,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  Trash2,
  Edit2,
  X,
  CreditCard,
  BellRing,
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { EXPENSE_CATEGORIES, getCategoryMeta } from '../utils/categories';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getTodayDateString } from '../utils/dates';
import type { Bill, Category } from '../types';

export const BillsView: React.FC = () => {
  const { bills, addBill, updateBill, deleteBill, toggleBillPaid, currency } =
    useTransactions();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState<Category>('Utilities');
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [formError, setFormError] = useState('');

  const today = getTodayDateString();

  // Categorize bills
  const overdueBills = bills.filter((b) => b.status === 'overdue' || (b.status === 'upcoming' && b.dueDate < today));
  const upcomingBills = bills.filter((b) => b.status === 'upcoming' && b.dueDate >= today);
  const paidBills = bills.filter((b) => b.status === 'paid');

  const totalUpcomingAmount = bills
    .filter((b) => b.status !== 'paid')
    .reduce((sum, b) => sum + b.amount, 0);

  const handleOpenAdd = () => {
    setEditingBill(null);
    setTitle('');
    setAmount('');
    setDueDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
    setCategory('Utilities');
    setFrequency('monthly');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: Bill) => {
    setEditingBill(b);
    setTitle(b.title);
    setAmount(String(b.amount));
    setDueDate(b.dueDate);
    setCategory(b.category);
    setFrequency(b.frequency);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Bill title is required.');
      return;
    }
    const val = Number(amount);
    if (!val || val <= 0) {
      setFormError('Please enter a valid amount.');
      return;
    }
    if (!dueDate) {
      setFormError('Due date is required.');
      return;
    }

    if (editingBill) {
      updateBill(editingBill.id, {
        title: title.trim(),
        amount: val,
        dueDate,
        category,
        frequency,
      });
    } else {
      addBill({
        title: title.trim(),
        amount: val,
        dueDate,
        category,
        recurring: true,
        frequency,
        status: dueDate < today ? 'overdue' : 'upcoming',
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <CalendarClock className="w-5 h-5" />
            </span>
            <span>Bills & Payment Reminders</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Stay ahead of recurring utility bills, credit payments, and rent with in-app reminders.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Bill Reminder</span>
        </button>
      </div>

      {/* Bill Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Pending Due Amount</span>
            <CreditCard className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums mt-1">
            {formatCurrency(totalUpcomingAmount, currency)}
          </p>
          <span className="text-[11px] text-slate-400">
            Across {overdueBills.length + upcomingBills.length} unpaid items
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Overdue Invoices</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums mt-1">
            {overdueBills.length}
          </p>
          <span className="text-[11px] text-slate-400">
            {overdueBills.length > 0 ? 'Requires immediate settlement' : 'Zero overdue payments'}
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Settled This Month</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
            {paidBills.length}
          </p>
          <span className="text-[11px] text-slate-400">Paid and archived</span>
        </div>
      </div>

      {/* Overdue Alert Banner if any */}
      {overdueBills.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                {overdueBills.length} Overdue Bill{overdueBills.length > 1 ? 's' : ''} Detected
              </h4>
              <p className="text-xs text-rose-700 dark:text-rose-300">
                Please settle these payments soon to avoid late fees or service interruptions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bills Cards List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-slate-500">
          All Recorded Bills ({bills.length})
        </h2>

        {bills.length === 0 ? (
          <div className="p-8 sm:p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <CalendarClock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No Bills on File
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Add your monthly electricity, rent, internet broadband, or credit cards to get automated reminders.
            </p>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Bill</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bills.map((bill) => {
              const meta = getCategoryMeta(bill.category);
              const Icon = meta.icon;
              const isPaid = bill.status === 'paid';
              const isOverdue = !isPaid && bill.dueDate < today;

              return (
                <div
                  key={bill.id}
                  className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all shadow-xs space-y-4 ${
                    isOverdue
                      ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20'
                      : isPaid
                      ? 'border-slate-200/60 dark:border-slate-800 opacity-80'
                      : 'border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: meta.bgColor, color: meta.color }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {bill.title}
                        </h3>
                        <span className="text-[11px] text-slate-400 capitalize">
                          {bill.frequency} • {bill.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(bill)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        title="Edit bill"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteBill(bill.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Delete bill"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-slate-400">Due Date: </span>
                      <span
                        className={`text-xs font-semibold ${
                          isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {formatDate(bill.dueDate)}
                      </span>
                    </div>

                    <p className="text-lg font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {formatCurrency(bill.amount, currency)}
                    </p>
                  </div>

                  {/* Actions & Status */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        isPaid
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                          : isOverdue
                          ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                          : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {isPaid ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Paid</span>
                        </>
                      ) : isOverdue ? (
                        <>
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>Overdue</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Upcoming</span>
                        </>
                      )}
                    </span>

                    <button
                      onClick={() => toggleBillPaid(bill.id)}
                      className={`px-3 py-1 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                        isPaid
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                          : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-2xs'
                      }`}
                    >
                      {isPaid ? 'Mark Unpaid' : 'Mark as Paid'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Bill Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-amber-600" />
                <span>{editingBill ? 'Edit Bill Reminder' : 'Add Bill Reminder'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 rounded-xl">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Bill Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. JioFiber Broadband, House Rent, Electric Board"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Amount ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="2500"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-xs"
                >
                  {editingBill ? 'Save Changes' : 'Create Reminder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
