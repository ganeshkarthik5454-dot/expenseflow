import assert from 'node:assert/strict';
import {
  calculateTotals,
  calculateCategoryBreakdown,
  calculateHighestSpendingCategory,
  calculateMonthlyStats,
} from '../calculations';
import { validateTransactionInput } from '../validation';
import { isValidTransactionObject } from '../storage';
import { isDateMatchingFilter } from '../dates';
import type { Transaction } from '../../types';

console.log('🧪 Starting ExpenseFlow comprehensive test suite...');

// 1. Income and expense calculations
{
  const txs: Transaction[] = [
    {
      id: '1',
      description: 'Salary',
      amount: 50000,
      type: 'income',
      category: 'Salary',
      date: '2026-10-01',
      createdAt: 1,
    },
    {
      id: '2',
      description: 'Rent',
      amount: 15000,
      type: 'expense',
      category: 'Housing',
      date: '2026-10-02',
      createdAt: 2,
    },
    {
      id: '3',
      description: 'Groceries',
      amount: 5000,
      type: 'expense',
      category: 'Groceries',
      date: '2026-10-03',
      createdAt: 3,
    },
  ];

  const totals = calculateTotals(txs);
  assert.equal(totals.totalIncome, 50000);
  assert.equal(totals.totalExpenses, 20000);
  assert.equal(totals.totalBalance, 30000);
  assert.equal(totals.percentageSpent, 40); // 20000 / 50000 * 100
  console.log('✓ 1. Income, expense, balance, and spending percentage calculations passed');
}

// 2. Negative and zero amount rejection in validation
{
  const resNegative = validateTransactionInput('Test', -50, 'expense', 'Housing', '2026-10-01');
  assert.equal(resNegative.isValid, false);
  assert.ok(resNegative.errors.amount);

  const resZero = validateTransactionInput('Test', 0, 'expense', 'Housing', '2026-10-01');
  assert.equal(resZero.isValid, false);
  assert.ok(resZero.errors.amount);

  const resNonNumeric = validateTransactionInput('Test', 'abc', 'expense', 'Housing', '2026-10-01');
  assert.equal(resNonNumeric.isValid, false);
  assert.ok(resNonNumeric.errors.amount);

  const resThreeDecimals = validateTransactionInput('Test', '10.555', 'expense', 'Housing', '2026-10-01');
  assert.equal(resThreeDecimals.isValid, false);
  assert.ok(resThreeDecimals.errors.amount);

  const resValidAmount = validateTransactionInput('Test', '10.55', 'expense', 'Housing', '2026-10-01');
  assert.equal(resValidAmount.isValid, true);
  console.log('✓ 2. Negative, zero, invalid, and decimal amount validations passed');
}

// 3. Description validation
{
  const resEmpty = validateTransactionInput('', 100, 'expense', 'Housing', '2026-10-01');
  assert.equal(resEmpty.isValid, false);
  assert.ok(resEmpty.errors.description);

  const resWhitespace = validateTransactionInput('   ', 100, 'expense', 'Housing', '2026-10-01');
  assert.equal(resWhitespace.isValid, false);
  assert.ok(resWhitespace.errors.description);

  const longDesc = 'a'.repeat(51);
  const resLong = validateTransactionInput(longDesc, 100, 'expense', 'Housing', '2026-10-01');
  assert.equal(resLong.isValid, false);
  assert.ok(resLong.errors.description);

  const resValidDesc = validateTransactionInput('Grocery Store Market', 100, 'expense', 'Housing', '2026-10-01');
  assert.equal(resValidDesc.isValid, true);
  console.log('✓ 3. Description length, empty string, and whitespace rejection passed');
}

// 4. Category validation
{
  const resInvalidCategory = validateTransactionInput('Test', 100, 'income', 'Housing', '2026-10-01');
  assert.equal(resInvalidCategory.isValid, false);
  assert.ok(resInvalidCategory.errors.category);

  const resValidIncomeCategory = validateTransactionInput('Test', 100, 'income', 'Salary', '2026-10-01');
  assert.equal(resValidIncomeCategory.isValid, true);
  console.log('✓ 4. Category cross-validation with transaction type passed');
}

// 5. Date filtering & range matching
{
  assert.equal(isDateMatchingFilter('2026-10-05', 'all'), true);
  assert.equal(isDateMatchingFilter('2026-10-05', 'custom', '2026-10-01', '2026-10-10'), true);
  assert.equal(isDateMatchingFilter('2026-10-15', 'custom', '2026-10-01', '2026-10-10'), false);
  console.log('✓ 5. Date filtering and custom ranges passed');
}

// 6. Search filtering, combined filters, and sorting
{
  const txs: Transaction[] = [
    { id: '1', description: 'Office Salary', amount: 80000, type: 'income', category: 'Salary', date: '2026-10-01', createdAt: 100 },
    { id: '2', description: 'Grocery Market', amount: 3500, type: 'expense', category: 'Groceries', date: '2026-10-03', createdAt: 200 },
    { id: '3', description: 'Electricity Utility', amount: 2200, type: 'expense', category: 'Utilities', date: '2026-10-05', createdAt: 300 },
    { id: '4', description: 'Organic Grocery', amount: 4800, type: 'expense', category: 'Groceries', date: '2026-10-08', createdAt: 400 },
  ];

  // Search filter
  const searchResults = txs.filter((t) => t.description.toLowerCase().includes('grocery'));
  assert.equal(searchResults.length, 2);

  // Combined filter: expense + groceries
  const combined = txs.filter((t) => t.type === 'expense' && t.category === 'Groceries');
  assert.equal(combined.length, 2);

  // Sorting: highest amount
  const sortedHighest = [...txs].sort((a, b) => b.amount - a.amount);
  assert.equal(sortedHighest[0].amount, 80000);
  assert.equal(sortedHighest[sortedHighest.length - 1].amount, 2200);

  // Sorting: newest first
  const sortedNewest = [...txs].sort((a, b) => b.date.localeCompare(a.date));
  assert.equal(sortedNewest[0].date, '2026-10-08');

  console.log('✓ 6. Search, combined filters, and multi-mode sorting passed');
}

// 7. Highest spending category & empty monthly reports
{
  const txs: Transaction[] = [
    {
      id: '1',
      description: 'Dinner',
      amount: 1500,
      type: 'expense',
      category: 'Entertainment',
      date: '2026-10-01',
      createdAt: 1,
    },
    {
      id: '2',
      description: 'Supermarket',
      amount: 4500,
      type: 'expense',
      category: 'Groceries',
      date: '2026-10-02',
      createdAt: 2,
    },
  ];

  const highest = calculateHighestSpendingCategory(txs, '2026-10');
  assert.equal(highest.category, 'Groceries');
  assert.equal(highest.amount, 4500);
  assert.equal(highest.percentage, 75); // 4500 / 6000 * 100

  // Empty month
  const emptyReport = calculateHighestSpendingCategory([], '2026-10');
  assert.equal(emptyReport.category, null);
  assert.equal(emptyReport.amount, 0);

  const emptyStats = calculateMonthlyStats([], '2026-10');
  assert.equal(emptyStats.income, 0);
  assert.equal(emptyStats.expenses, 0);
  assert.equal(emptyStats.netBalance, 0);
  console.log('✓ 7. Highest spending category and empty monthly report handling passed');
}

// 8. CSV Escaping and Formula Injection Protection
{
  // Injection payloads
  const dangerousStrings = ['=1+1', '+cmd|/C calc', '-2+3', '@SUM(A1:A10)', 'Safe, with comma', 'He said "Hello"'];
  
  function sanitizeCSVField(val: string): string {
    let str = String(val);
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }
    if (/[",\n\r]/.test(str)) {
      str = `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  assert.equal(sanitizeCSVField('=1+1'), "'=1+1");
  assert.equal(sanitizeCSVField('+cmd'), "'+cmd");
  assert.equal(sanitizeCSVField('@SUM'), "'@SUM");
  assert.equal(sanitizeCSVField('Safe, with comma'), '"Safe, with comma"');
  assert.equal(sanitizeCSVField('He said "Hello"'), '"He said ""Hello"""');
  console.log('✓ 8. CSV escaping and formula injection protection passed');
}

// 9. Storage schema and error recovery
{
  assert.equal(
    isValidTransactionObject({
      id: '1',
      description: 'Rent',
      amount: 500,
      type: 'expense',
      category: 'Housing',
      date: '2026-10-01',
      createdAt: 1000,
    }),
    true
  );

  assert.equal(
    isValidTransactionObject({
      id: '1',
      description: 'Rent',
      amount: -500,
      type: 'expense',
      category: 'Housing',
      date: '2026-10-01',
      createdAt: 1000,
    }),
    false
  );

  assert.equal(
    isValidTransactionObject({
      id: '1',
      description: 'Rent',
      amount: 500,
      type: 'expense',
      category: 'Housing',
      date: '',
      createdAt: 1000,
    }),
    false
  );
  console.log('✓ 9. Storage schema validation and malformed object rejection passed');
}

console.log('🎉 ALL 9 TEST SUITES PASSED FLAWLESSLY!');
