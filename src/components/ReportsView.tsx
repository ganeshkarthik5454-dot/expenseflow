import React, { useState, useMemo, useRef } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  TrendingUp,
  TrendingDown,
  PieChart,
  Scale,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { calculateCategoryBreakdown } from '../utils/calculations';
import { formatCurrency, formatPercentage, formatDate } from '../utils/formatters';
import { getCategoryMeta } from '../utils/categories';
import { ExpenseChart } from './ExpenseChart';

export const ReportsView: React.FC = () => {
  const { transactions, totals, currency, exportCSV, exportPDFReport } =
    useTransactions();
  const printRef = useRef<HTMLDivElement>(null);

  const [timeframe, setTimeframe] = useState<'6months' | '12months' | 'all'>('6months');

  // Group transactions by month (YYYY-MM)
  const monthlyData = useMemo(() => {
    const map = new Map<string, { income: number; expense: number; month: string }>();

    // Generate recent months list
    const now = new Date();
    const count = timeframe === '6months' ? 6 : timeframe === '12months' ? 12 : 24;

    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      map.set(key, { income: 0, expense: 0, month: monthLabel });
    }

    transactions.forEach((tx) => {
      const key = tx.date.substring(0, 7);
      if (map.has(key)) {
        const item = map.get(key)!;
        if (tx.type === 'income') {
          item.income += tx.amount;
        } else {
          item.expense += tx.amount;
        }
      }
    });

    return Array.from(map.entries()).map(([key, val]) => ({
      key,
      ...val,
      net: val.income - val.expense,
      savingsRate: val.income > 0 ? ((val.income - val.expense) / val.income) * 100 : 0,
    }));
  }, [transactions, timeframe]);

  // Overall calculations for report
  const reportTotals = useMemo(() => {
    const totalInc = monthlyData.reduce((acc, m) => acc + m.income, 0);
    const totalExp = monthlyData.reduce((acc, m) => acc + m.expense, 0);
    const net = totalInc - totalExp;
    const rate = totalInc > 0 ? (net / totalInc) * 100 : 0;
    const avgMonthlyInc = monthlyData.length > 0 ? totalInc / monthlyData.length : 0;
    const avgMonthlyExp = monthlyData.length > 0 ? totalExp / monthlyData.length : 0;

    return { totalInc, totalExp, net, rate, avgMonthlyInc, avgMonthlyExp };
  }, [monthlyData]);

  // Category breakdown for current period
  const expenseBreakdown = useMemo(
    () => calculateCategoryBreakdown(transactions, 'expense'),
    [transactions]
  );

  const maxBarValue = useMemo(() => {
    let max = 1000;
    monthlyData.forEach((m) => {
      if (m.income > max) max = m.income;
      if (m.expense > max) max = m.expense;
    });
    return max * 1.15;
  }, [monthlyData]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <BarChart3 className="w-5 h-5" />
            </span>
            <span>Financial Reports & Analytics</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Comparative multi-month cash flows, spending velocity, savings rate, and exportable statements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => exportPDFReport({ timeframe })}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            <span>Export PDF Report</span>
          </button>

          <button
            onClick={() => exportCSV()}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Reporting Horizon:
        </span>
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {[
            { id: '6months', label: 'Last 6 Months' },
            { id: '12months', label: 'Last 12 Months' },
            { id: 'all', label: 'All History' },
          ].map((tf) => (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                timeframe === tf.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400">Net Accumulated Savings</span>
          <p
            className={`text-xl sm:text-2xl font-bold font-mono tabular-nums mt-1 ${
              reportTotals.net >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(reportTotals.net, currency)}
          </p>
          <span className="text-[11px] text-slate-400">Total surplus over period</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400">Average Savings Rate</span>
          <p className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums mt-1">
            {formatPercentage(reportTotals.rate)}
          </p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            {reportTotals.totalInc === 0
              ? 'No income recorded'
              : reportTotals.rate >= 20
              ? 'Optimal (>=20%)'
              : 'Needs attention (<20%)'}
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400">Monthly Avg. Inflow</span>
          <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
            {formatCurrency(reportTotals.avgMonthlyInc, currency)}
          </p>
          <span className="text-[11px] text-slate-400">Expected monthly deposits</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400">Monthly Avg. Burn</span>
          <p className="text-xl sm:text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums mt-1">
            {formatCurrency(reportTotals.avgMonthlyExp, currency)}
          </p>
          <span className="text-[11px] text-slate-400">Average monthly outflows</span>
        </div>
      </div>

      {/* Comparative Monthly Bar Chart */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>Monthly Inflow vs. Outflow Comparison</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Side-by-side performance across calendar months.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" />
              Income
            </span>
            <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
              <span className="w-3 h-3 rounded-sm bg-rose-500" />
              Expense
            </span>
          </div>
        </div>

        {/* SVG/CSS Bar Chart Grid */}
        {reportTotals.totalInc === 0 && reportTotals.totalExp === 0 ? (
          <div className="py-14 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
              <BarChart3 className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No transactions recorded for this horizon
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
              Add your first transaction to view your financial analytics.
            </p>
          </div>
        ) : (
          <div className="pt-6 pb-2">
            <div className="grid grid-flow-col auto-cols-fr gap-3 sm:gap-6 items-end h-56 border-b border-slate-200 dark:border-slate-700 px-2">
              {monthlyData.map((m) => {
                const incHeight = maxBarValue > 0 ? (m.income / maxBarValue) * 100 : 0;
                const expHeight = maxBarValue > 0 ? (m.expense / maxBarValue) * 100 : 0;

                return (
                  <div key={m.key} className="flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip on Hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-16 z-20 pointer-events-none p-2 rounded-xl bg-slate-900 text-white text-[10px] font-mono whitespace-nowrap shadow-xl">
                      <p className="font-bold">{m.month}</p>
                      <p className="text-emerald-400">+{formatCurrency(m.income, currency)}</p>
                      <p className="text-rose-400">-{formatCurrency(m.expense, currency)}</p>
                      <p className="text-slate-300">Net: {formatCurrency(m.net, currency)}</p>
                    </div>

                    <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-full pb-1">
                      {/* Income bar */}
                      <div
                        style={{ height: `${Math.max(incHeight, 2)}%` }}
                        className="w-full max-w-[20px] bg-emerald-500 hover:bg-emerald-400 rounded-t-sm transition-all duration-300"
                      />
                      {/* Expense bar */}
                      <div
                        style={{ height: `${Math.max(expHeight, 2)}%` }}
                        className="w-full max-w-[20px] bg-rose-500 hover:bg-rose-400 rounded-t-sm transition-all duration-300"
                      />
                    </div>

                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-2 truncate w-full text-center">
                      {m.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Donut Chart and Category Ranking Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenseChart
          categoryStats={expenseBreakdown}
          totalExpenses={totals.totalExpenses}
          currency={currency}
        />

        {/* Monthly Performance Ledger Table */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Scale className="w-4 h-4 text-slate-400" />
            <span>Monthly Financial Ledger</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-2">Month</th>
                  <th className="pb-2 text-right">Inflow</th>
                  <th className="pb-2 text-right">Outflow</th>
                  <th className="pb-2 text-right">Net Buffer</th>
                  <th className="pb-2 text-right">Savings %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {monthlyData.slice().reverse().map((m) => (
                  <tr key={m.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 font-sans font-medium text-slate-900 dark:text-slate-100">
                      {m.month}
                    </td>
                    <td className="py-2.5 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                      {formatCurrency(m.income, currency)}
                    </td>
                    <td className="py-2.5 text-right text-rose-600 dark:text-rose-400 font-bold">
                      {formatCurrency(m.expense, currency)}
                    </td>
                    <td
                      className={`py-2.5 text-right font-bold ${
                        m.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {formatCurrency(m.net, currency)}
                    </td>
                    <td className="py-2.5 text-right text-slate-700 dark:text-slate-300 font-bold">
                      {formatPercentage(m.savingsRate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
