import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  RotateCcw,
  Bot,
  User,
  Lightbulb,
  ShieldAlert,
  TrendingUp,
  PieChart,
  Target,
  ArrowRight,
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { calculateCategoryBreakdown } from '../utils/calculations';
import type { ChatMessage } from '../types';

export const AIAssistantView: React.FC = () => {
  const {
    transactions,
    totals,
    budgets,
    savingsGoals,
    bills,
    subscriptions,
    currency,
  } = useTransactions();

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content:
        transactions.length === 0
          ? `Hello! I'm your **ExpenseFlow AI Personal Finance Advisor**.\n\nYour ledger currently has **0 transactions**.\n\nTo get started, click **+ Add Transaction** in the top bar to record your actual income and expenses. Once added, I will analyze your cash flows, category spending, and budgets without inventing data.`
          : `Hello! I'm your **ExpenseFlow AI Personal Finance Advisor**.\n\nI have real-time access to your **${transactions.length} recorded transactions**, budget ceilings, savings milestones, and upcoming bills. I analyze your actual numbers without inventing data.\n\nHow can I help you optimize your personal finances today?`,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Suggested prompt chips
  const suggestedPrompts = [
    'Where is most of my money going this month?',
    'Suggest a realistic 50/30/20 budget based on my income',
    'How can I save an extra 15% on discretionary spending?',
    'Audit my recurring subscriptions and upcoming bills',
  ];

  const handleSend = async (messageText?: string) => {
    const text = (messageText || input).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare rich, verified financial context
      const expenseBreakdown = calculateCategoryBreakdown(transactions, 'expense');
      const incomeBreakdown = calculateCategoryBreakdown(transactions, 'income');

      const contextPayload = {
        currencySymbol: currency,
        transactionCount: transactions.length,
        totalIncome: totals.totalIncome,
        totalExpenses: totals.totalExpenses,
        netBalance: totals.totalBalance,
        percentageSpent: totals.percentageSpent,
        topCategories: expenseBreakdown.slice(0, 5),
        incomeSources: incomeBreakdown.slice(0, 5),
        budgets: budgets.map((b) => ({
          category: b.category,
          monthlyLimit: b.monthlyLimit,
        })),
        savingsGoals: savingsGoals.map((g) => ({
          title: g.title,
          target: g.targetAmount,
          current: g.currentAmount,
        })),
        billsCount: bills.length,
        unpaidBillsSum: bills.filter((b) => b.status !== 'paid').reduce((sum, b) => sum + b.amount, 0),
        subscriptionsCount: subscriptions.length,
        activeSubscriptionsMonthlyTotal: subscriptions
          .filter((s) => s.status === 'active')
          .reduce((sum, s) => sum + (s.billingCycle === 'yearly' ? s.amount / 12 : s.amount), 0),
      };

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: contextPayload,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMessage: ChatMessage = {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: data.reply || 'I analyzed your financials, but encountered an empty response.',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error('API server returned error');
      }
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content:
          transactions.length === 0
            ? `Your ledger currently has **0 transactions**. Click **+ Add Transaction** in the top bar to record your first income or expense entry.`
            : `I analyzed your actual records locally: Total Income is **${currency}${totals.totalIncome.toLocaleString()}**, Total Outflows are **${currency}${totals.totalExpenses.toLocaleString()}**, and Net Surplus is **${currency}${totals.totalBalance.toLocaleString()}**. Your current savings rate is **${totals.totalIncome > 0 ? (((totals.totalIncome - totals.totalExpenses) / totals.totalIncome) * 100).toFixed(1) : '0'}%**.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome_reset',
        role: 'assistant',
        content: `Chat history reset. Ask me anything about your **${transactions.length} transactions** and wealth goals.`,
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <span>AI Personal Finance Assistant</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Grounded directly on your real ledger. Tailored budget rules, cash flow diagnosis, and spending insights.
          </p>
        </div>

        <button
          onClick={handleClearChat}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear Chat</span>
        </button>
      </div>

      {/* Main Chat Interface Box */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col h-[600px] overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((m) => {
            const isAI = m.role === 'assistant';

            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-3xl ${
                  isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isAI
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  }`}
                >
                  {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isAI
                      ? 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-slate-800 dark:text-slate-200'
                      : 'bg-emerald-600 text-white rounded-br-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap space-y-2">
                    {m.content}
                  </div>
                  <span
                    className={`block text-[10px] mt-2 ${
                      isAI ? 'text-slate-400' : 'text-emerald-200'
                    }`}
                  >
                    {new Date(m.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 max-w-2xl mr-auto">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-slate-500 text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Auditing ledger and analyzing financial metrics...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Strip */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
          <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            Suggested:
          </span>
          {suggestedPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              disabled={isLoading}
              className="px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 text-[11px] whitespace-nowrap transition-colors cursor-pointer shrink-0"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 flex gap-2 bg-white dark:bg-slate-900"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about spending patterns, budget limits, or savings targets..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
