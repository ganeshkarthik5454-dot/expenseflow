import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Google GenAI will be initialized on demand if GEMINI_API_KEY is configured

interface TransactionRecord {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  createdAt: number;
  paymentMethod?: string;
  recurring?: boolean;
  recurringFrequency?: string;
  receipt?: string;
  notes?: string;
}

// Persistent disk-backed ledger store
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'transactions.json');

function loadPersistedTransactions(): TransactionRecord[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (t) =>
            t &&
            typeof t.id === 'string' &&
            !t.id.startsWith('tx_init_') &&
            !t.id.startsWith('tx_prev_')
        );
      }
    }
  } catch (err) {
    console.error('Failed to load persisted transactions:', err);
  }
  return [];
}

function persistTransactions(records: TransactionRecord[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist transactions:', err);
  }
}

let transactionsDb: TransactionRecord[] = loadPersistedTransactions();

// Active SSE client subscriptions
interface SSEClient {
  id: string;
  res: Response;
}
let sseClients: SSEClient[] = [];

function broadcastRealtimeEvent(eventType: string, data: any) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.res.write(payload);
    } catch (e) {
      // Disconnected client will be cleaned up
    }
  });
}

function generateLocalFinanceInsights(userMsg: string, context: any): string {
  const currency = context?.currencySymbol || '₹';
  const totalIncome = context?.totalIncome || 0;
  const totalExpenses = context?.totalExpenses || 0;
  const netBalance = context?.netBalance || 0;
  const txCount = context?.transactionCount ?? transactionsDb.length;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
  const topCategories = context?.topCategories || [];

  if (txCount === 0) {
    return `### Welcome to ExpenseFlow AI
You have no saved transactions in your ledger yet.

To get started:
- Use the **+ Add Transaction** button in the top navigation bar to enter your actual income and expenses.
- Once you record transactions, I will automatically calculate your real cash flow, budget allocations, spending breakdown, and wealth recommendations without inventing data.`;
  }

  const lower = (userMsg || '').toLowerCase();

  if (lower.includes('budget') || lower.includes('limit') || lower.includes('plan')) {
    return `### Recommended Budget Allocation (50-30-20 Rule)
Based on your total income of **${currency}${totalIncome.toLocaleString()}**:
- **Needs (50%)**: ${currency}${Math.round(totalIncome * 0.5).toLocaleString()} (Housing, Groceries, Utilities, Healthcare)
- **Wants (30%)**: ${currency}${Math.round(totalIncome * 0.3).toLocaleString()} (Dining Out, Shopping, Entertainment)
- **Savings & Debt (20%)**: ${currency}${Math.round(totalIncome * 0.2).toLocaleString()} (Emergency Fund, SIP, Investments)

Your current savings rate is **${savingsRate.toFixed(1)}%**. To optimize, consider setting a spending ceiling on your top expense areas.`;
  }

  if (lower.includes('spend') || lower.includes('cut') || lower.includes('save') || lower.includes('reduce')) {
    const topCatText = topCategories.length > 0
      ? topCategories.slice(0, 3).map((c: any) => `- **${c.category}**: ${currency}${Number(c.amount).toLocaleString()} (${c.percentage}%)`).join('\n')
      : '- Review your frequent discretionary purchases';

    return `### Expense Optimization Insights
Your highest expenditure categories:
${topCatText}

**Actionable Recommendations:**
1. **Target Discretionary Spend**: Focus on dining out and impulse shopping to recover an estimated 10-15% monthly buffer.
2. **Review Recurring Subscriptions**: Audit all recurring memberships under the Subscriptions tab.
3. **Automate Savings**: Set up automated transfers immediately following payday to prevent lifestyle creep.`;
  }

  return `### Financial Overview Summary
- **Total Income**: ${currency}${totalIncome.toLocaleString()}
- **Total Expenses**: ${currency}${totalExpenses.toLocaleString()}
- **Net Surplus / Savings**: ${currency}${netBalance.toLocaleString()}
- **Savings Rate**: ${savingsRate.toFixed(1)}%

You have ${txCount} recorded transaction${txCount === 1 ? '' : 's'}. You can ask me specific questions like:
- *"Where is most of my money going?"*
- *"Can you suggest a realistic monthly budget?"*
- *"How can I improve my savings rate?"*`;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // 1. Health check & real-time connection info
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'ExpenseFlow Full-Stack Realtime API',
      realtimeActive: true,
      activeClients: sseClients.length,
      transactionsCount: transactionsDb.length,
      timestamp: new Date().toISOString(),
      firestoreDb: 'ai-studio-expenseflowperso-88ab2469-f43b-4159-a65d-ae9424b7f535',
      aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // 2. Server-Sent Events (SSE) Real-Time Stream Endpoint
  app.get('/api/realtime', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newClient: SSEClient = { id: clientId, res };
    sseClients.push(newClient);

    res.write(
      `event: connected\ndata: ${JSON.stringify({
        clientId,
        status: 'connected',
        activeClients: sseClients.length,
        timestamp: Date.now(),
      })}\n\n`
    );

    const pingInterval = setInterval(() => {
      try {
        res.write(`event: ping\ndata: ${Date.now()}\n\n`);
      } catch (err) {
        clearInterval(pingInterval);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(pingInterval);
      sseClients = sseClients.filter((c) => c.id !== clientId);
    });
  });

  // 3. GET /api/transactions
  app.get('/api/transactions', (req: Request, res: Response) => {
    const sorted = [...transactionsDb].sort(
      (a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt
    );
    res.json({
      success: true,
      data: sorted,
      count: sorted.length,
    });
  });

  // 4. POST /api/transactions
  app.post('/api/transactions', (req: Request, res: Response) => {
    const { id, description, amount, type, category, date, createdAt, paymentMethod, recurring, recurringFrequency, receipt, notes } = req.body;

    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({ success: false, error: 'Valid description is required' });
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || !isFinite(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Amount must be strictly greater than 0' });
    }
    if (type !== 'income' && type !== 'expense') {
      return res.status(400).json({ success: false, error: 'Type must be income or expense' });
    }

    const newRecord: TransactionRecord = {
      id: id || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      description: description.trim().substring(0, 50),
      amount: Math.round(numAmount * 100) / 100,
      type,
      category: category || 'Others',
      date: date || new Date().toISOString().split('T')[0],
      createdAt: typeof createdAt === 'number' ? createdAt : Date.now(),
      paymentMethod: paymentMethod || 'UPI',
      recurring: Boolean(recurring),
      recurringFrequency: recurringFrequency || 'monthly',
      receipt: receipt || undefined,
      notes: notes || undefined,
    };

    transactionsDb.unshift(newRecord);
    persistTransactions(transactionsDb);
    broadcastRealtimeEvent('transaction:created', newRecord);

    res.status(201).json({
      success: true,
      data: newRecord,
    });
  });

  // 5. PUT /api/transactions/:id (Edit Transaction)
  app.put('/api/transactions/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const index = transactionsDb.findIndex((t) => t.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    const { description, amount, type, category, date, paymentMethod, recurring, recurringFrequency, receipt, notes } = req.body;
    const existing = transactionsDb[index];

    const updated: TransactionRecord = {
      ...existing,
      description: description ? description.trim().substring(0, 50) : existing.description,
      amount: amount !== undefined ? Math.round(Number(amount) * 100) / 100 : existing.amount,
      type: type || existing.type,
      category: category || existing.category,
      date: date || existing.date,
      paymentMethod: paymentMethod !== undefined ? paymentMethod : existing.paymentMethod,
      recurring: recurring !== undefined ? Boolean(recurring) : existing.recurring,
      recurringFrequency: recurringFrequency || existing.recurringFrequency,
      receipt: receipt !== undefined ? receipt : existing.receipt,
      notes: notes !== undefined ? notes : existing.notes,
    };

    transactionsDb[index] = updated;
    persistTransactions(transactionsDb);
    broadcastRealtimeEvent('transaction:updated', updated);

    res.json({ success: true, data: updated });
  });

  // 6. DELETE /api/transactions/:id
  app.delete('/api/transactions/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const initialLen = transactionsDb.length;
    transactionsDb = transactionsDb.filter((t) => t.id !== id);

    if (transactionsDb.length === initialLen) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    persistTransactions(transactionsDb);
    broadcastRealtimeEvent('transaction:deleted', { id });
    res.json({ success: true, id });
  });

  // 7. DELETE /api/transactions (Clear All Data)
  app.delete('/api/transactions', (req: Request, res: Response) => {
    transactionsDb = [];
    persistTransactions(transactionsDb);
    broadcastRealtimeEvent('transactions:cleared', {});
    res.json({ success: true, message: 'All transactions cleared' });
  });

  // 8. AI Finance Assistant Endpoint
  app.post('/api/ai/chat', async (req: Request, res: Response) => {
    try {
      const { message, context } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.json({
          reply:
            `*(Note: GEMINI_API_KEY is not configured in .env. Showing insights computed from your actual ledger records.)*\n\n` +
            generateLocalFinanceInsights(message, context),
          source: 'local_finance_engine',
        });
      }

      if ((context?.transactionCount ?? 0) === 0) {
        return res.json({
          reply: generateLocalFinanceInsights(message, context),
          source: 'clean_state_guidance',
        });
      }

      const systemInstruction = `You are ExpenseFlow AI, an expert certified financial advisor and wealth coach.
Analyze the user's REAL financial data provided in the prompt context.
RULES:
1. Always base statements on the user's actual stored numbers (income, expenses, categories, savings goals, budgets).
2. Never hallucinate or invent fake figures.
3. Use the user's active currency symbol (${context?.currencySymbol || '₹'}).
4. Offer concise, constructive, actionable advice. Format nicely with markdown bolding and bullet points.`;

      const prompt = `Current Financial Data Context:
${JSON.stringify(context, null, 2)}

User Question: "${message}"`;

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });

      const reply = response.text || generateLocalFinanceInsights(message, context);
      res.json({ reply, source: 'gemini_3.8_flash' });
    } catch (err: any) {
      console.error('AI Assistant API error:', err);
      res.json({
        reply: generateLocalFinanceInsights(req.body.message, req.body.context),
        source: 'local_fallback',
      });
    }
  });

  // 9. Vite Dev Middleware / Static in Production
  if (isProd) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use(vite.middlewares);

    app.use('*', async (req: Request, res: Response, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`ExpenseFlow full-stack server running on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n⚠️  Port ${PORT} is already in use by another running instance.`);
      console.error(`👉 If ExpenseFlow is already running, you can open: http://localhost:${PORT}`);
      console.error(`👉 To terminate the running instance in PowerShell, run:`);
      console.error(`   Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force\n`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
