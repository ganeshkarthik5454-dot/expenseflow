import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Percent,
  Calendar,
  Coins,
  TrendingUp,
  PieChart,
  HelpCircle,
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { formatCurrency, formatPercentage } from '../utils/formatters';

export const EmiCalculatorView: React.FC = () => {
  const { currency, addBill, addSavingsGoal, showNotification } = useTransactions();

  // Active Tool Tab: Loan EMI vs SIP Savings Calculator
  const [activeTool, setActiveTool] = useState<'emi' | 'sip'>('emi');

  // --- EMI CALCULATOR STATE ---
  const [loanAmount, setLoanAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [tenureYears, setTenureYears] = useState('');

  // --- SIP CALCULATOR STATE ---
  const [sipMonthly, setSipMonthly] = useState('');
  const [sipReturnRate, setSipReturnRate] = useState('');
  const [sipYears, setSipYears] = useState('');

  const handleSaveEmiAsBill = () => {
    if (emiResults.monthlyEmi <= 0) return;
    const dueDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    addBill({
      title: 'Loan EMI Payment',
      amount: emiResults.monthlyEmi,
      dueDate,
      category: 'Housing',
      recurring: true,
      frequency: 'monthly',
      status: 'upcoming',
      autoPay: true,
    });
    showNotification('success', `Saved ${formatCurrency(emiResults.monthlyEmi, currency)}/mo EMI as a recurring bill reminder.`);
  };

  const handleSaveSipAsGoal = () => {
    if (sipResults.maturityValue <= 0) return;
    const years = Number(sipYears) || 5;
    const targetDate = new Date(Date.now() + years * 365 * 86400000).toISOString().split('T')[0];
    addSavingsGoal({
      title: `SIP Target (${years}Y Horizon)`,
      targetAmount: sipResults.maturityValue,
      currentAmount: 0,
      targetDate,
      category: 'Investments',
      color: '#059669',
      notes: `Targeting ${formatCurrency(sipResults.maturityValue, currency)} through ${formatCurrency(Number(sipMonthly) || 0, currency)}/mo SIP.`,
    });
    showNotification('success', `Created savings goal targeting ${formatCurrency(sipResults.maturityValue, currency)}.`);
  };

  // EMI Calculations
  const emiResults = useMemo(() => {
    const P = Number(loanAmount) || 0;
    const annualR = Number(interestRate) || 0;
    const years = Number(tenureYears) || 0;

    if (P <= 0 || annualR <= 0 || years <= 0) {
      return {
        monthlyEmi: 0,
        totalInterest: 0,
        totalPayment: 0,
        principalPct: 100,
        interestPct: 0,
        amortization: [],
      };
    }

    const n = years * 12; // Total months
    const r = annualR / (12 * 100); // Monthly interest rate

    // EMI formula: P * r * (1+r)^n / ((1+r)^n - 1)
    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = emi * n;
    const totalInterest = totalPayment - P;

    const principalPct = (P / totalPayment) * 100;
    const interestPct = (totalInterest / totalPayment) * 100;

    // Amortization yearly breakdown
    let balance = P;
    const amortization: Array<{
      year: number;
      principalPaid: number;
      interestPaid: number;
      endingBalance: number;
    }> = [];

    for (let y = 1; y <= years; y++) {
      let yearlyInterest = 0;
      let yearlyPrincipal = 0;

      for (let m = 1; m <= 12; m++) {
        const interestForMonth = balance * r;
        const principalForMonth = emi - interestForMonth;
        yearlyInterest += interestForMonth;
        yearlyPrincipal += principalForMonth;
        balance = Math.max(0, balance - principalForMonth);
      }

      amortization.push({
        year: y,
        principalPaid: yearlyPrincipal,
        interestPaid: yearlyInterest,
        endingBalance: balance,
      });
    }

    return {
      monthlyEmi: Math.round(emi),
      totalInterest: Math.round(totalInterest),
      totalPayment: Math.round(totalPayment),
      principalPct: Math.round(principalPct),
      interestPct: Math.round(interestPct),
      amortization,
    };
  }, [loanAmount, interestRate, tenureYears]);

  // SIP Calculations
  const sipResults = useMemo(() => {
    const P = Number(sipMonthly) || 0;
    const annualR = Number(sipReturnRate) || 0;
    const years = Number(sipYears) || 0;

    if (P <= 0 || annualR <= 0 || years <= 0) {
      return {
        totalInvested: 0,
        estReturns: 0,
        maturityValue: 0,
        investedPct: 100,
        gainPct: 0,
      };
    }

    const n = years * 12;
    const i = annualR / (12 * 100);

    // SIP formula: M = P * [((1 + i)^n - 1) / i] * (1 + i)
    const maturityValue = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    const totalInvested = P * n;
    const estReturns = maturityValue - totalInvested;

    const investedPct = (totalInvested / maturityValue) * 100;
    const gainPct = (estReturns / maturityValue) * 100;

    return {
      totalInvested: Math.round(totalInvested),
      estReturns: Math.round(estReturns),
      maturityValue: Math.round(maturityValue),
      investedPct: Math.round(investedPct),
      gainPct: Math.round(gainPct),
    };
  }, [sipMonthly, sipReturnRate, sipYears]);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Calculator className="w-5 h-5" />
            </span>
            <span>EMI & Wealth Calculators</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Plan loan repayments, visualize principal vs interest ratios, and compute compound wealth creation.
          </p>
        </div>

        {/* Tool Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs self-start sm:self-auto">
          <button
            onClick={() => setActiveTool('emi')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTool === 'emi'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Loan EMI Calculator
          </button>
          <button
            onClick={() => setActiveTool('sip')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTool === 'sip'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            SIP Compound Calculator
          </button>
        </div>
      </div>

      {activeTool === 'emi' ? (
        /* LOAN EMI SECTION */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Controls */}
            <div className="lg:col-span-5 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Coins className="w-4 h-4 text-emerald-600" />
                <span>Loan Parameters</span>
              </h2>

              {/* Loan Amount */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <label className="text-slate-700 dark:text-slate-300">Loan Amount</label>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    {loanAmount ? formatCurrency(Number(loanAmount) || 0, currency) : '—'}
                  </span>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="10000000"
                  step="10000"
                  value={loanAmount || '0'}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="w-full accent-emerald-600"
                />
                <input
                  type="number"
                  placeholder="e.g. 500000"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              {/* Interest Rate */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <label className="text-slate-700 dark:text-slate-300">Interest Rate (% p.a.)</label>
                  <span className="font-mono text-slate-900 dark:text-slate-100">
                    {interestRate ? `${interestRate}%` : '—'}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="25"
                  step="0.1"
                  value={interestRate || '0'}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className="w-full accent-emerald-600"
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 8.5"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              {/* Tenure Years */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <label className="text-slate-700 dark:text-slate-300">Loan Tenure</label>
                  <span className="font-mono text-slate-900 dark:text-slate-100">
                    {tenureYears ? `${tenureYears} Years (${Number(tenureYears) * 12} Mos)` : '—'}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={tenureYears || '0'}
                  onChange={(e) => setTenureYears(e.target.value)}
                  className="w-full accent-emerald-600"
                />
                <input
                  type="number"
                  placeholder="e.g. 5"
                  value={tenureYears}
                  onChange={(e) => setTenureYears(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
            </div>

            {/* Results Display */}
            <div className="lg:col-span-7 space-y-4">
              {emiResults.monthlyEmi === 0 ? (
                <div className="p-8 sm:p-14 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <Calculator className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Enter Loan Parameters
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Enter your loan amount, annual interest rate, and tenure on the left to calculate your monthly EMI, total interest, and amortization schedule.
                  </p>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60">
                    <div>
                      <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                        Monthly Equated Installment (EMI)
                      </span>
                      <p className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
                        {formatCurrency(emiResults.monthlyEmi, currency)}
                      </p>
                    </div>
                    <button
                      onClick={handleSaveEmiAsBill}
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      Save as Bill Reminder
                    </button>
                  </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-xs text-slate-400">Total Interest Payable</span>
                    <p className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums mt-1">
                      {formatCurrency(emiResults.totalInterest, currency)}
                    </p>
                    <span className="text-[11px] text-slate-400">{emiResults.interestPct}% of repayment</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-xs text-slate-400">Total Amount Payable</span>
                    <p className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums mt-1">
                      {formatCurrency(emiResults.totalPayment, currency)}
                    </p>
                    <span className="text-[11px] text-slate-400">Principal + Total Interest</span>
                  </div>
                </div>

                {/* Principal vs Interest Ratio Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                      Principal: {emiResults.principalPct}%
                    </span>
                    <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                      Interest: {emiResults.interestPct}%
                    </span>
                  </div>

                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden">
                    <div
                      style={{ width: `${emiResults.principalPct}%` }}
                      className="bg-emerald-500 h-full transition-all duration-300"
                    />
                    <div
                      style={{ width: `${emiResults.interestPct}%` }}
                      className="bg-rose-500 h-full transition-all duration-300"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

          {/* Yearly Amortization Schedule */}
          {emiResults.amortization.length > 0 && (
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Yearly Loan Amortization Schedule
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-sans">
                      <th className="pb-2">Year</th>
                      <th className="pb-2 text-right">Principal Paid</th>
                      <th className="pb-2 text-right">Interest Paid</th>
                      <th className="pb-2 text-right">Year-End Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {emiResults.amortization.map((row) => (
                      <tr key={row.year} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 font-sans font-medium text-slate-900 dark:text-slate-100">
                          Year {row.year}
                        </td>
                        <td className="py-2.5 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                          {formatCurrency(Math.round(row.principalPaid), currency)}
                        </td>
                        <td className="py-2.5 text-right text-rose-600 dark:text-rose-400">
                          {formatCurrency(Math.round(row.interestPaid), currency)}
                        </td>
                        <td className="py-2.5 text-right text-slate-900 dark:text-slate-100">
                          {formatCurrency(Math.round(row.endingBalance), currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* SIP COMPOUND WEALTH SECTION */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* SIP Inputs */}
          <div className="lg:col-span-5 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>SIP Investment Parameters</span>
            </h2>

            {/* Monthly Investment */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <label className="text-slate-700 dark:text-slate-300">Monthly Contribution</label>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  {sipMonthly ? formatCurrency(Number(sipMonthly) || 0, currency) : '—'}
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="200000"
                step="500"
                value={sipMonthly || '0'}
                onChange={(e) => setSipMonthly(e.target.value)}
                className="w-full accent-emerald-600"
              />
              <input
                type="number"
                placeholder="e.g. 5000"
                value={sipMonthly}
                onChange={(e) => setSipMonthly(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>

            {/* Expected Return Rate */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <label className="text-slate-700 dark:text-slate-300">Expected Annual Return (%)</label>
                <span className="font-mono text-slate-900 dark:text-slate-100">
                  {sipReturnRate ? `${sipReturnRate}%` : '—'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="0.5"
                value={sipReturnRate || '0'}
                onChange={(e) => setSipReturnRate(e.target.value)}
                className="w-full accent-emerald-600"
              />
              <input
                type="number"
                step="0.5"
                placeholder="e.g. 12"
                value={sipReturnRate}
                onChange={(e) => setSipReturnRate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>

            {/* Years */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <label className="text-slate-700 dark:text-slate-300">Investment Horizon</label>
                <span className="font-mono text-slate-900 dark:text-slate-100">
                  {sipYears ? `${sipYears} Years` : '—'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="40"
                step="1"
                value={sipYears || '0'}
                onChange={(e) => setSipYears(e.target.value)}
                className="w-full accent-emerald-600"
              />
              <input
                type="number"
                placeholder="e.g. 10"
                value={sipYears}
                onChange={(e) => setSipYears(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
          </div>

          {/* SIP Results Display */}
          <div className="lg:col-span-7 space-y-4">
            {sipResults.maturityValue === 0 ? (
              <div className="p-8 sm:p-14 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Enter SIP Investment Parameters
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Enter your monthly contribution amount, expected annual return rate, and investment horizon on the left to project your future compound wealth.
                </p>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60">
                  <div>
                    <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      Expected Maturity Corpus
                    </span>
                    <p className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
                      {formatCurrency(sipResults.maturityValue, currency)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      At {sipReturnRate}% CAGR
                    </span>
                    <button
                      onClick={handleSaveSipAsGoal}
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      Save as Savings Goal
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-xs text-slate-400">Total Capital Invested</span>
                    <p className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums mt-1">
                      {formatCurrency(sipResults.totalInvested, currency)}
                    </p>
                    <span className="text-[11px] text-slate-400">{sipResults.investedPct}% principal</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-xs text-slate-400">Estimated Wealth Gain</span>
                    <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
                      {formatCurrency(sipResults.estReturns, currency)}
                    </p>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      +{sipResults.gainPct}% wealth multiplication
                    </span>
                  </div>
                </div>

                {/* Corpus Ratio Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-slate-400" />
                      Invested: {sipResults.investedPct}%
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                      Returns: {sipResults.gainPct}%
                    </span>
                  </div>

                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden">
                    <div
                      style={{ width: `${sipResults.investedPct}%` }}
                      className="bg-slate-400 h-full transition-all duration-300"
                    />
                    <div
                      style={{ width: `${sipResults.gainPct}%` }}
                      className="bg-emerald-500 h-full transition-all duration-300"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
