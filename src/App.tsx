import React, { useState } from 'react';
import {
  TransactionProvider,
  useTransactions,
} from './context/TransactionContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { TransactionList } from './components/TransactionList';
import { IncomeView } from './components/IncomeView';
import { ExpensesView } from './components/ExpensesView';
import { CategoriesView } from './components/CategoriesView';
import { BudgetsView } from './components/BudgetsView';
import { SavingsGoalsView } from './components/SavingsGoalsView';
import { BillsView } from './components/BillsView';
import { SubscriptionsView } from './components/SubscriptionsView';
import { ReportsView } from './components/ReportsView';
import { AIAssistantView } from './components/AIAssistantView';
import { EmiCalculatorView } from './components/EmiCalculatorView';
import { SettingsView } from './components/SettingsView';
import { ProfileSecurityView } from './components/ProfileSecurityView';
import { TransactionModal } from './components/TransactionModal';
import { NotificationToast } from './components/NotificationToast';

const MainLayout: React.FC = () => {
  const { activeTab } = useTransactions();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Header with Top Bar Contract */}
      <Header onOpenMobileNav={() => setIsMobileNavOpen(true)} />

      {/* Main Workspace with Sidebar & Viewport */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Sidebar */}
        <Sidebar
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />

        {/* Viewport Content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && <DashboardView />}

          {activeTab === 'transactions' && (
            <div className="space-y-6 max-w-6xl">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Transaction Ledger
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Search, filter, categorize, and manage your complete financial history.
                </p>
              </div>
              <TransactionList showFilters={true} />
            </div>
          )}

          {activeTab === 'income' && <IncomeView />}

          {activeTab === 'expenses' && <ExpensesView />}

          {activeTab === 'categories' && <CategoriesView />}

          {activeTab === 'budgets' && <BudgetsView />}

          {activeTab === 'savings_goals' && <SavingsGoalsView />}

          {activeTab === 'bills' && <BillsView />}

          {activeTab === 'subscriptions' && <SubscriptionsView />}

          {(activeTab === 'reports' || (activeTab as string) === 'analytics') && (
            <ReportsView />
          )}

          {activeTab === 'ai_assistant' && <AIAssistantView />}

          {activeTab === 'emi_calculator' && <EmiCalculatorView />}

          {activeTab === 'settings' && <SettingsView />}

          {activeTab === 'profile' && <ProfileSecurityView />}
        </main>
      </div>

      {/* Modals & Live Notification Toasts */}
      <TransactionModal />
      <NotificationToast />
    </div>
  );
};

export default function App() {
  return (
    <TransactionProvider>
      <MainLayout />
    </TransactionProvider>
  );
}
