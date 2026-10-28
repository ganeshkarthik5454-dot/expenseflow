import assert from 'node:assert/strict';
import {
  formatPdfNumber,
  getCurrencyLabel,
  exportTransactionLedgerToPDF,
  exportFinancialReportToPDF,
} from '../pdfExport';
import type { Transaction, Budget } from '../../types';

console.log('🧪 Starting PDF Export test suite...');

// 1. Format number formatting
{
  assert.equal(formatPdfNumber(150000, 'INR'), '1,50,000.00');
  assert.equal(formatPdfNumber(150000, 'USD'), '150,000.00');
  assert.equal(formatPdfNumber(0, 'INR'), '0.00');
  assert.equal(formatPdfNumber(-4500.5, 'INR'), '4,500.50');
  console.log('✓ 1. Number formatting for PDF tables verified');
}

// 2. Currency label mapping
{
  assert.equal(getCurrencyLabel('INR'), 'INR (Indian Rupee - Rs)');
  assert.equal(getCurrencyLabel('USD'), 'USD (US Dollar - $)');
  assert.equal(getCurrencyLabel('EUR'), 'EUR (Euro - EUR)');
  console.log('✓ 2. Currency label mapping verified');
}

// 3. Test Ledger PDF Generation with mock environment
{
  // Provide basic DOM mock for Node test environment
  if (typeof globalThis.document === 'undefined') {
    (globalThis as any).document = {
      createElement: () => ({
        style: {},
        click: () => {},
        setAttribute: () => {},
      }),
      body: {
        appendChild: () => {},
        removeChild: () => {},
      },
    };
  }
  if (typeof globalThis.URL === 'undefined' || !globalThis.URL.createObjectURL) {
    (globalThis as any).URL = {
      createObjectURL: () => 'blob:mock-url',
      revokeObjectURL: () => {},
    };
  }

  const sampleTxs: Transaction[] = [
    {
      id: 'tx_1',
      description: 'Consulting Retainer',
      amount: 45000,
      type: 'income',
      category: 'Freelance',
      date: '2026-10-05',
      paymentMethod: 'Bank Transfer',
      createdAt: Date.now(),
    },
    {
      id: 'tx_2',
      description: 'Office Workspace Rent',
      amount: 12000,
      type: 'expense',
      category: 'Housing',
      date: '2026-10-06',
      paymentMethod: 'UPI',
      createdAt: Date.now(),
    },
  ];

  const resLedger = exportTransactionLedgerToPDF(sampleTxs, {
    currency: 'INR',
    isFiltered: false,
    userEmail: 'user@example.com',
  });

  assert.equal(resLedger.success, true);
  assert.equal(resLedger.count, 2);
  console.log('✓ 3. Transaction Ledger PDF generation passed');

  // 4. Test Financial Report PDF Generation
  const sampleBudgets: Budget[] = [
    {
      id: 'b_1',
      category: 'Housing',
      monthlyLimit: 15000,
      period: '2026-10',
    },
  ];

  const resReport = exportFinancialReportToPDF(sampleTxs, sampleBudgets, {
    timeframe: '6months',
    currency: 'INR',
    userEmail: 'user@example.com',
  });

  assert.equal(resReport.success, true);
  console.log('✓ 4. Financial Report PDF generation passed');
}

console.log('🎉 All PDF Export test cases passed successfully!');
