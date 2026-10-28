import React, { useState } from 'react';
import {
  Repeat,
  Plus,
  Tv,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Calendar,
  CreditCard,
  Trash2,
  Edit2,
  X,
  TrendingUp,
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, getCategoryMeta } from '../utils/categories';
import { formatCurrency, formatDate } from '../utils/formatters';
import type { Subscription, Category, PaymentMethod } from '../types';

export const SubscriptionsView: React.FC = () => {
  const {
    subscriptions,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    toggleSubscriptionStatus,
    totalMonthlySubscriptions,
    currency,
  } = useTransactions();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [nextBillingDate, setNextBillingDate] = useState('');
  const [category, setCategory] = useState<Category>('Entertainment');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Credit Card');
  const [formError, setFormError] = useState('');

  const annualProjectedCost = totalMonthlySubscriptions * 12;
  const activeSubsCount = subscriptions.filter((s) => s.status === 'active').length;

  const handleOpenAdd = () => {
    setEditingSub(null);
    setName('');
    setAmount('');
    setBillingCycle('monthly');
    setNextBillingDate(new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]);
    setCategory('Entertainment');
    setPaymentMethod('Credit Card');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sub: Subscription) => {
    setEditingSub(sub);
    setName(sub.name);
    setAmount(String(sub.amount));
    setBillingCycle(sub.billingCycle);
    setNextBillingDate(sub.nextBillingDate);
    setCategory(sub.category);
    setPaymentMethod(sub.paymentMethod);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Subscription name is required.');
      return;
    }
    const val = Number(amount);
    if (!val || val <= 0) {
      setFormError('Amount must be greater than 0.');
      return;
    }

    if (editingSub) {
      updateSubscription(editingSub.id, {
        name: name.trim(),
        amount: val,
        billingCycle,
        nextBillingDate,
        category,
        paymentMethod,
      });
    } else {
      addSubscription({
        name: name.trim(),
        amount: val,
        billingCycle,
        nextBillingDate,
        category,
        paymentMethod,
        status: 'active',
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
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Repeat className="w-5 h-5" />
            </span>
            <span>Recurring Subscriptions Tracker</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Audit streaming services, cloud software, memberships, and optimize your monthly burn rate.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subscription</span>
        </button>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400">Monthly Run Rate</span>
          <p className="text-xl sm:text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 tabular-nums mt-1">
            {formatCurrency(totalMonthlySubscriptions, currency)} / mo
          </p>
          <span className="text-[11px] text-slate-400">
            For {activeSubsCount} active memberships
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400">Annual Projected Cost</span>
          <p className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums mt-1">
            {formatCurrency(annualProjectedCost, currency)} / yr
          </p>
          <span className="text-[11px] text-slate-400">12-month recurring commitments</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400">Audited Services</span>
          <p className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums mt-1">
            {subscriptions.length}
          </p>
          <span className="text-[11px] text-slate-400">
            {subscriptions.filter((s) => s.status === 'paused').length} paused • {subscriptions.filter((s) => s.status === 'cancelled').length} cancelled
          </span>
        </div>
      </div>

      {/* Subscriptions Grid */}
      {subscriptions.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <Repeat className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No Subscriptions Tracked Yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Add recurring subscriptions like Netflix, Spotify, AWS, Gym, or iCloud to track renewing costs.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subscription</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subscriptions.map((sub) => {
            const meta = getCategoryMeta(sub.category);
            const Icon = meta.icon;

            return (
              <div
                key={sub.id}
                className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all shadow-xs space-y-4 ${
                  sub.status === 'active'
                    ? 'border-slate-200/80 dark:border-slate-800'
                    : 'border-slate-200/60 dark:border-slate-800/80 opacity-70 bg-slate-50/50 dark:bg-slate-900/40'
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
                        {sub.name}
                      </h3>
                      <span className="text-[11px] text-slate-400 capitalize">
                        {sub.billingCycle} • {sub.paymentMethod}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(sub)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      title="Edit subscription"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteSubscription(sub.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Delete subscription"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Renews on: </span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {formatDate(sub.nextBillingDate)}
                    </span>
                  </div>

                  <p className="text-lg font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {formatCurrency(sub.amount, currency)}
                    <span className="text-xs font-normal text-slate-400">
                      /{sub.billingCycle === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  </p>
                </div>

                {/* Status and Action */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      sub.status === 'active'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                        : sub.status === 'paused'
                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                        : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {sub.status === 'active' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                    {sub.status === 'paused' && <PauseCircle className="w-3 h-3 text-amber-600" />}
                    {sub.status === 'cancelled' && <XCircle className="w-3 h-3 text-rose-600" />}
                    <span className="capitalize">{sub.status}</span>
                  </span>

                  <button
                    onClick={() => toggleSubscriptionStatus(sub.id)}
                    className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    {sub.status === 'active' ? 'Pause' : sub.status === 'paused' ? 'Resume' : 'Reactivate'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Subscription Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Repeat className="w-5 h-5 text-indigo-600" />
                <span>{editingSub ? 'Edit Subscription' : 'Track Subscription'}</span>
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
                  Service / Provider Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Netflix Premium, Spotify Family, ChatGPT Plus"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
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
                    placeholder="649"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Billing Cycle
                  </label>
                  <select
                    value={billingCycle}
                    onChange={(e) => setBillingCycle(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Next Renewal Date
                  </label>
                  <input
                    type="date"
                    value={nextBillingDate}
                    onChange={(e) => setNextBillingDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.method} value={m.method}>
                        {m.method}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
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
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs"
                >
                  {editingSub ? 'Save Changes' : 'Track Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
