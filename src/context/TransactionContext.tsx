import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import type {
  Transaction,
  ThemeMode,
  ToastNotification,
  TransactionType,
  Category,
  Budget,
  SavingsGoal,
  Bill,
  Subscription,
  PaymentMethod,
  NavigationTab,
} from '../types';
import {
  loadTransactionsFromStorage,
  saveTransactionsToStorage,
  clearTransactionsFromStorage,
  loadBudgetsFromStorage,
  saveBudgetsToStorage,
  loadSavingsGoalsFromStorage,
  saveSavingsGoalsToStorage,
  loadBillsFromStorage,
  saveBillsToStorage,
  loadSubscriptionsFromStorage,
  saveSubscriptionsToStorage,
  loadThemeFromStorage,
  saveThemeToStorage,
  loadCurrencyFromStorage,
  saveCurrencyToStorage,
} from '../utils/storage';
import { calculateTotals, type FinancialTotals } from '../utils/calculations';
import { exportTransactionsToCSV } from '../utils/csvExport';
import {
  exportTransactionLedgerToPDF,
  exportFinancialReportToPDF,
} from '../utils/pdfExport';
import {
  auth,
  db,
  googleProvider,
  testConnection,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';

export type RealtimeStatus = 'connected' | 'connecting' | 'disconnected';

export interface BudgetStatus {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
  isWarning: boolean; // >= 80%
  isOver: boolean; // >= 100%
}

interface TransactionContextType {
  // Navigation
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;

  // Transactions
  transactions: Transaction[];
  totals: FinancialTotals;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  editingTransaction: Transaction | null;
  setEditingTransaction: (tx: Transaction | null) => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<boolean>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  clearAllData: () => Promise<void>;
  resetSampleData: () => void;

  // Budgets
  budgets: Budget[];
  addBudget: (budget: Omit<Budget, 'id'>) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  budgetStatuses: BudgetStatus[];
  budgetAlertsCount: number;

  // Savings Goals
  savingsGoals: SavingsGoal[];
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  deleteSavingsGoal: (id: string) => void;
  adjustGoalAmount: (id: string, delta: number) => void;

  // Bills & Reminders
  bills: Bill[];
  addBill: (bill: Omit<Bill, 'id'>) => void;
  updateBill: (id: string, updates: Partial<Bill>) => void;
  deleteBill: (id: string) => void;
  toggleBillPaid: (id: string) => void;
  upcomingBillsCount: number;

  // Subscriptions
  subscriptions: Subscription[];
  addSubscription: (sub: Omit<Subscription, 'id'>) => void;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  toggleSubscriptionStatus: (id: string) => void;
  totalMonthlySubscriptions: number;

  // Configuration & Auth
  currency: string;
  setCurrency: (code: string) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  currentUser: User | null;
  isAuthLoading: boolean;
  isSyncing: boolean;
  realtimeStatus: RealtimeStatus;
  activeClientsCount: number;
  lastPingMs: number | null;
  pingBackend: () => Promise<number | null>;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;

  // Utilities
  notifications: ToastNotification[];
  showNotification: (type: 'success' | 'error' | 'info', message: string) => void;
  dismissNotification: (id: string) => void;
  exportCSV: (customList?: Transaction[], isFiltered?: boolean) => void;
  exportPDFLedger: (
    customList?: Transaction[],
    isFiltered?: boolean,
    filterSummary?: string
  ) => void;
  exportPDFReport: (options?: {
    timeframe?: '6months' | '12months' | 'all';
  }) => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(
  undefined
);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Navigation tab
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');

  // Transactions state
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadTransactionsFromStorage()
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Budgets state
  const [budgets, setBudgets] = useState<Budget[]>(() =>
    loadBudgetsFromStorage()
  );

  // Savings Goals state
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() =>
    loadSavingsGoalsFromStorage()
  );

  // Bills state
  const [bills, setBills] = useState<Bill[]>(() =>
    loadBillsFromStorage()
  );

  // Subscriptions state
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() =>
    loadSubscriptionsFromStorage()
  );

  // Preferences
  const [currency, setCurrencyState] = useState<string>(() =>
    loadCurrencyFromStorage()
  );
  const [theme, setThemeState] = useState<ThemeMode>(() =>
    loadThemeFromStorage()
  );
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  // Firebase Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Real-time backend state
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('connecting');
  const [activeClientsCount, setActiveClientsCount] = useState<number>(1);
  const [lastPingMs, setLastPingMs] = useState<number | null>(null);

  // Notifications
  const showNotification = useCallback(
    (type: 'success' | 'error' | 'info', message: string) => {
      const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      setNotifications((prev) => [...prev, { id, type, message }]);
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 4000);
    },
    []
  );

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Sync theme to root element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveThemeToStorage(theme);
  }, [theme]);

  // Persist to storage
  useEffect(() => {
    saveTransactionsToStorage(transactions);
  }, [transactions]);

  useEffect(() => {
    saveBudgetsToStorage(budgets);
  }, [budgets]);

  useEffect(() => {
    saveSavingsGoalsToStorage(savingsGoals);
  }, [savingsGoals]);

  useEffect(() => {
    saveBillsToStorage(bills);
  }, [bills]);

  useEffect(() => {
    saveSubscriptionsToStorage(subscriptions);
  }, [subscriptions]);

  // Derived financial totals
  const totals = useMemo(() => calculateTotals(transactions), [transactions]);

  // Budget calculations and status evaluation (80% warning and 100% alert)
  const budgetStatuses = useMemo<BudgetStatus[]>(() => {
    const currentMonthKey = new Date().toISOString().substring(0, 7);

    return budgets.map((b) => {
      const targetPeriod = b.period || currentMonthKey;
      const spent = transactions
        .filter(
          (t) =>
            t.type === 'expense' &&
            t.category === b.category &&
            t.date.startsWith(targetPeriod)
        )
        .reduce((sum, t) => sum + t.amount, 0);

      const remaining = Math.max(0, b.monthlyLimit - spent);
      const percentage = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
      const threshold = b.alertThreshold || 80;

      return {
        budget: b,
        spent: Math.round(spent * 100) / 100,
        remaining: Math.round(remaining * 100) / 100,
        percentage: Math.round(percentage * 10) / 10,
        isWarning: percentage >= threshold && percentage < 100,
        isOver: percentage >= 100,
      };
    });
  }, [budgets, transactions]);

  const budgetAlertsCount = useMemo(
    () => budgetStatuses.filter((bs) => bs.isWarning || bs.isOver).length,
    [budgetStatuses]
  );

  // Upcoming bills count (due within 7 days or overdue)
  const upcomingBillsCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return bills.filter((b) => b.status === 'upcoming' || b.status === 'overdue' || (b.status !== 'paid' && b.dueDate <= today)).length;
  }, [bills]);

  // Subscriptions total monthly cost
  const totalMonthlySubscriptions = useMemo(() => {
    return subscriptions
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => {
        return sum + (s.billingCycle === 'yearly' ? s.amount / 12 : s.amount);
      }, 0);
  }, [subscriptions]);

  // Initial Backend Sync & SSE Stream
  useEffect(() => {
    async function fetchBackendTransactions() {
      try {
        const res = await fetch('/api/transactions');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            const cleanServerData = json.data.filter(
              (t: Transaction) => !t.id.startsWith('tx_init_') && !t.id.startsWith('tx_prev_')
            );
            setTransactions((local) => {
              const cleanLocal = local.filter(
                (t: Transaction) => !t.id.startsWith('tx_init_') && !t.id.startsWith('tx_prev_')
              );
              const map = new Map<string, Transaction>();
              cleanServerData.forEach((t: Transaction) => map.set(t.id, t));
              cleanLocal.forEach((t: Transaction) => {
                if (!map.has(t.id)) map.set(t.id, t);
              });
              return Array.from(map.values()).sort(
                (a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt
              );
            });
          }
        }
      } catch (err) {}
    }
    fetchBackendTransactions();
  }, []);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    function connectSSE() {
      setRealtimeStatus('connecting');
      try {
        eventSource = new EventSource('/api/realtime');

        eventSource.addEventListener('connected', (e: MessageEvent) => {
          setRealtimeStatus('connected');
          try {
            const data = JSON.parse(e.data);
            if (data.activeClients) setActiveClientsCount(data.activeClients);
          } catch (err) {}
        });

        eventSource.addEventListener('ping', () => {
          setRealtimeStatus('connected');
        });

        eventSource.addEventListener('transaction:created', (e: MessageEvent) => {
          try {
            const newTx: Transaction = JSON.parse(e.data);
            setTransactions((prev) => {
              if (prev.some((t) => t.id === newTx.id)) return prev;
              return [newTx, ...prev];
            });
          } catch (err) {}
        });

        eventSource.addEventListener('transaction:updated', (e: MessageEvent) => {
          try {
            const updatedTx: Transaction = JSON.parse(e.data);
            setTransactions((prev) =>
              prev.map((t) => (t.id === updatedTx.id ? updatedTx : t))
            );
          } catch (err) {}
        });

        eventSource.addEventListener('transaction:deleted', (e: MessageEvent) => {
          try {
            const { id } = JSON.parse(e.data);
            setTransactions((prev) => prev.filter((t) => t.id !== id));
          } catch (err) {}
        });

        eventSource.addEventListener('transactions:cleared', () => {
          setTransactions([]);
        });

        eventSource.onerror = () => {
          setRealtimeStatus('disconnected');
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          reconnectTimeout = setTimeout(connectSSE, 3500);
        };
      } catch (err) {
        setRealtimeStatus('disconnected');
        reconnectTimeout = setTimeout(connectSSE, 5000);
      }
    }

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  // Firebase connection test
  useEffect(() => {
    testConnection();
  }, []);

  // Ping backend roundtrip latency
  const pingBackend = useCallback(async (): Promise<number | null> => {
    const start = performance.now();
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const latency = Math.round(performance.now() - start);
        setLastPingMs(latency);
        setRealtimeStatus('connected');
        return latency;
      }
    } catch (err) {
      setRealtimeStatus('disconnected');
    }
    return null;
  }, []);

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);

      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          await setDoc(
            userDocRef,
            {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'ExpenseFlow User',
              photoURL: user.photoURL || '',
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (err) {
          console.warn('Could not update user profile in Firestore:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Firebase Firestore realtime sync for authenticated user
  useEffect(() => {
    if (!currentUser) return;

    setIsSyncing(true);
    const txCollectionRef = collection(db, 'users', currentUser.uid, 'transactions');
    const path = `users/${currentUser.uid}/transactions`;

    const unsubscribe = onSnapshot(
      txCollectionRef,
      (snapshot) => {
        setIsSyncing(false);
        if (!snapshot.empty) {
          const remoteTxList: Transaction[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            remoteTxList.push({
              id: data.id || docSnap.id,
              description: data.description,
              amount: Number(data.amount),
              type: data.type,
              category: data.category,
              date: data.date,
              paymentMethod: data.paymentMethod || 'UPI',
              recurring: Boolean(data.recurring),
              recurringFrequency: data.recurringFrequency,
              receipt: data.receipt,
              notes: data.notes,
              createdAt: data.createdAt ? new Date(data.createdAt).getTime() : Date.now(),
            });
          });
          remoteTxList.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
          setTransactions(remoteTxList);
        } else {
          // If remote is empty, migrate current local transactions
          const currentLocal = loadTransactionsFromStorage();
          if (currentLocal.length > 0) {
            Promise.all(
              currentLocal.map((t) =>
                setDoc(doc(db, 'users', currentUser.uid, 'transactions', t.id), {
                  id: t.id,
                  userId: currentUser.uid,
                  description: t.description,
                  amount: t.amount,
                  type: t.type,
                  category: t.category,
                  date: t.date,
                  paymentMethod: t.paymentMethod || 'UPI',
                  createdAt: new Date(t.createdAt).toISOString(),
                })
              )
            ).catch(() => {});
          }
        }
      },
      (error) => {
        setIsSyncing(false);
        try {
          handleFirestoreError(error, OperationType.LIST, path);
        } catch (syncErr) {
          console.warn('Real-time sync error encountered:', syncErr);
        }
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Auth Actions
  const signInWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showNotification('success', 'Signed in with Google. Real-time Cloud Sync active.');
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to sign in with Google.');
    }
  }, [showNotification]);

  const logOut = useCallback(async () => {
    try {
      await signOut(auth);
      showNotification('info', 'Signed out. Operating in local mode.');
    } catch (err: any) {
      showNotification('error', 'Failed to sign out.');
    }
  }, [showNotification]);

  // Add Transaction
  const addTransaction = useCallback(
    async (tx: Omit<Transaction, 'id' | 'createdAt'>): Promise<boolean> => {
      try {
        const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const newRecord: Transaction = {
          ...tx,
          id,
          description: tx.description.trim(),
          amount: Math.round(tx.amount * 100) / 100,
          createdAt: Date.now(),
        };

        setTransactions((prev) => [newRecord, ...prev]);

        // Post to backend
        try {
          await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRecord),
          });
        } catch (backendErr) {}

        // Persist to Cloud Firestore if logged in
        if (currentUser) {
          const path = `users/${currentUser.uid}/transactions/${id}`;
          try {
            await setDoc(doc(db, 'users', currentUser.uid, 'transactions', id), {
              ...newRecord,
              userId: currentUser.uid,
              createdAt: new Date(newRecord.createdAt).toISOString(),
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, path);
          }
        }

        showNotification(
          'success',
          `${tx.type === 'income' ? 'Income' : 'Expense'} record logged successfully.`
        );
        return true;
      } catch (err) {
        showNotification('error', 'Failed to save transaction.');
        return false;
      }
    },
    [currentUser, showNotification]
  );

  // Update Transaction
  const updateTransaction = useCallback(
    async (id: string, updates: Partial<Transaction>): Promise<boolean> => {
      try {
        setTransactions((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
        );

        // Put to backend
        try {
          await fetch(`/api/transactions/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
        } catch (e) {}

        if (currentUser) {
          const path = `users/${currentUser.uid}/transactions/${id}`;
          try {
            await setDoc(
              doc(db, 'users', currentUser.uid, 'transactions', id),
              updates,
              { merge: true }
            );
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, path);
          }
        }

        showNotification('success', 'Transaction updated successfully.');
        return true;
      } catch {
        showNotification('error', 'Failed to update transaction.');
        return false;
      }
    },
    [currentUser, showNotification]
  );

  // Delete Transaction
  const deleteTransaction = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const found = transactions.find((t) => t.id === id);
        if (!found) {
          showNotification('error', 'Transaction not found.');
          return false;
        }

        setTransactions((prev) => prev.filter((t) => t.id !== id));

        try {
          await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
        } catch (backendErr) {}

        if (currentUser) {
          const path = `users/${currentUser.uid}/transactions/${id}`;
          try {
            await deleteDoc(doc(db, 'users', currentUser.uid, 'transactions', id));
          } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, path);
          }
        }

        showNotification('success', 'Transaction deleted successfully.');
        return true;
      } catch (err) {
        showNotification('error', 'Failed to delete transaction.');
        return false;
      }
    },
    [currentUser, transactions, showNotification]
  );

  // Clear all data
  const clearAllData = useCallback(async () => {
    try {
      clearTransactionsFromStorage();
      const currentList = [...transactions];
      setTransactions([]);

      try {
        await fetch('/api/transactions', { method: 'DELETE' });
      } catch (backendErr) {}

      if (currentUser) {
        await Promise.all(
          currentList.map((t) =>
            deleteDoc(doc(db, 'users', currentUser.uid, 'transactions', t.id))
          )
        );
      }

      showNotification('success', 'All financial transactions cleared.');
    } catch (err) {
      showNotification('error', 'Failed to clear data from storage.');
    }
  }, [currentUser, transactions, showNotification]);

  // Reset sample data to clean state
  const resetSampleData = useCallback(() => {
    setTransactions([]);
    clearTransactionsFromStorage();
    showNotification('info', 'Ledger reset to clean state.');
  }, [showNotification]);

  // Budgets CRUD
  const addBudget = useCallback(
    (b: Omit<Budget, 'id'>) => {
      const newBudget: Budget = {
        ...b,
        id: `b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      };
      setBudgets((prev) => [...prev, newBudget]);
      showNotification('success', `Budget limit set for ${b.category}.`);
    },
    [showNotification]
  );

  const updateBudget = useCallback(
    (id: string, updates: Partial<Budget>) => {
      setBudgets((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
      );
      showNotification('success', 'Budget updated.');
    },
    [showNotification]
  );

  const deleteBudget = useCallback(
    (id: string) => {
      setBudgets((prev) => prev.filter((b) => b.id !== id));
      showNotification('info', 'Budget removed.');
    },
    [showNotification]
  );

  // Savings Goals CRUD
  const addSavingsGoal = useCallback(
    (g: Omit<SavingsGoal, 'id'>) => {
      const newGoal: SavingsGoal = {
        ...g,
        id: `sg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      };
      setSavingsGoals((prev) => [...prev, newGoal]);
      showNotification('success', `Savings goal "${g.title}" created.`);
    },
    [showNotification]
  );

  const updateSavingsGoal = useCallback(
    (id: string, updates: Partial<SavingsGoal>) => {
      setSavingsGoals((prev) =>
        prev.map((g) => (g.id === id ? { ...g, ...updates } : g))
      );
      showNotification('success', 'Savings goal updated.');
    },
    [showNotification]
  );

  const deleteSavingsGoal = useCallback(
    (id: string) => {
      setSavingsGoals((prev) => prev.filter((g) => g.id !== id));
      showNotification('info', 'Savings goal removed.');
    },
    [showNotification]
  );

  const adjustGoalAmount = useCallback(
    (id: string, delta: number) => {
      setSavingsGoals((prev) =>
        prev.map((g) => {
          if (g.id === id) {
            const nextAmt = Math.max(0, g.currentAmount + delta);
            return { ...g, currentAmount: nextAmt };
          }
          return g;
        })
      );
      showNotification(
        'success',
        delta > 0
          ? `Added funds to savings goal.`
          : `Withdrew funds from savings goal.`
      );
    },
    [showNotification]
  );

  // Bills CRUD
  const addBill = useCallback(
    (bill: Omit<Bill, 'id'>) => {
      const newBill: Bill = {
        ...bill,
        id: `bill_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      };
      setBills((prev) => [...prev, newBill]);
      showNotification('success', `Bill reminder for "${bill.title}" logged.`);
    },
    [showNotification]
  );

  const updateBill = useCallback(
    (id: string, updates: Partial<Bill>) => {
      setBills((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
      );
      showNotification('success', 'Bill updated.');
    },
    [showNotification]
  );

  const deleteBill = useCallback(
    (id: string) => {
      setBills((prev) => prev.filter((b) => b.id !== id));
      showNotification('info', 'Bill reminder removed.');
    },
    [showNotification]
  );

  const toggleBillPaid = useCallback(
    (id: string) => {
      const today = new Date().toISOString().split('T')[0];
      setBills((prev) =>
        prev.map((b) => {
          if (b.id === id) {
            const nextStatus = b.status === 'paid' ? 'upcoming' : 'paid';
            return {
              ...b,
              status: nextStatus,
              paidDate: nextStatus === 'paid' ? today : undefined,
            };
          }
          return b;
        })
      );
      showNotification('success', 'Bill payment status updated.');
    },
    [showNotification]
  );

  // Subscriptions CRUD
  const addSubscription = useCallback(
    (sub: Omit<Subscription, 'id'>) => {
      const newSub: Subscription = {
        ...sub,
        id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      };
      setSubscriptions((prev) => [...prev, newSub]);
      showNotification('success', `Subscription "${sub.name}" registered.`);
    },
    [showNotification]
  );

  const updateSubscription = useCallback(
    (id: string, updates: Partial<Subscription>) => {
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      );
      showNotification('success', 'Subscription updated.');
    },
    [showNotification]
  );

  const deleteSubscription = useCallback(
    (id: string) => {
      setSubscriptions((prev) => prev.filter((s) => s.id !== id));
      showNotification('info', 'Subscription removed.');
    },
    [showNotification]
  );

  const toggleSubscriptionStatus = useCallback(
    (id: string) => {
      setSubscriptions((prev) =>
        prev.map((s) => {
          if (s.id === id) {
            const nextStatus = s.status === 'active' ? 'cancelled' : 'active';
            return { ...s, status: nextStatus };
          }
          return s;
        })
      );
      showNotification('info', 'Subscription status changed.');
    },
    [showNotification]
  );

  const setCurrency = useCallback((code: string) => {
    setCurrencyState(code);
    saveCurrencyToStorage(code);
  }, []);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const exportCSV = useCallback(
    (customList?: Transaction[], isFiltered: boolean = false) => {
      const listToExport = customList || transactions;
      if (listToExport.length === 0) {
        showNotification('info', 'No transactions available to export.');
        return;
      }
      const res = exportTransactionsToCSV(listToExport, isFiltered);
      if (res.success) {
        showNotification('success', res.message);
      } else {
        showNotification('error', res.message);
      }
    },
    [transactions, showNotification]
  );

  const exportPDFLedger = useCallback(
    (
      customList?: Transaction[],
      isFiltered: boolean = false,
      filterSummary?: string
    ) => {
      const listToExport = customList || transactions;
      if (listToExport.length === 0) {
        showNotification('info', 'No transactions available to export to PDF.');
        return;
      }
      const res = exportTransactionLedgerToPDF(listToExport, {
        isFiltered,
        filterSummary,
        currency,
        userEmail: currentUser?.email || 'Personal Account',
      });
      if (res.success) {
        showNotification('success', res.message);
      } else {
        showNotification('error', res.message);
      }
    },
    [transactions, currency, currentUser, showNotification]
  );

  const exportPDFReport = useCallback(
    (options?: { timeframe?: '6months' | '12months' | 'all' }) => {
      if (transactions.length === 0) {
        showNotification(
          'info',
          'No transactions available to generate financial report.'
        );
        return;
      }
      const res = exportFinancialReportToPDF(transactions, budgets, {
        timeframe: options?.timeframe || '6months',
        currency,
        userEmail: currentUser?.email || 'Personal Account',
      });
      if (res.success) {
        showNotification('success', res.message);
      } else {
        showNotification('error', res.message);
      }
    },
    [transactions, budgets, currency, currentUser, showNotification]
  );

  return (
    <TransactionContext.Provider
      value={{
        activeTab,
        setActiveTab,
        transactions,
        totals,
        isAddModalOpen,
        setIsAddModalOpen,
        editingTransaction,
        setEditingTransaction,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        clearAllData,
        resetSampleData,
        budgets,
        addBudget,
        updateBudget,
        deleteBudget,
        budgetStatuses,
        budgetAlertsCount,
        savingsGoals,
        addSavingsGoal,
        updateSavingsGoal,
        deleteSavingsGoal,
        adjustGoalAmount,
        bills,
        addBill,
        updateBill,
        deleteBill,
        toggleBillPaid,
        upcomingBillsCount,
        subscriptions,
        addSubscription,
        updateSubscription,
        deleteSubscription,
        toggleSubscriptionStatus,
        totalMonthlySubscriptions,
        currency,
        setCurrency,
        theme,
        setTheme,
        toggleTheme,
        currentUser,
        isAuthLoading,
        isSyncing,
        realtimeStatus,
        activeClientsCount,
        lastPingMs,
        pingBackend,
        signInWithGoogle,
        logOut,
        notifications,
        showNotification,
        dismissNotification,
        exportCSV,
        exportPDFLedger,
        exportPDFReport,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error(
      'useTransactions must be used within a TransactionProvider'
    );
  }
  return context;
};
