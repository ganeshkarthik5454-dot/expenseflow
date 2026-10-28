import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Transaction, Budget } from '../types';
import { getTodayDateString } from './dates';
import { calculateCategoryBreakdown, calculateTotals } from './calculations';
import { getCategoryMeta } from './categories';
import { formatDate } from './formatters';

export interface LedgerExportOptions {
  title?: string;
  isFiltered?: boolean;
  filterSummary?: string;
  currency?: string;
  userEmail?: string;
}

export interface ReportExportOptions {
  timeframe?: '6months' | '12months' | 'all';
  currency?: string;
  userEmail?: string;
}

/**
 * Format numeric amount into localized string for PDF tables without font encoding issues.
 */
export function formatPdfNumber(amount: number, currencyCode: string = 'INR'): string {
  if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
    amount = 0;
  }
  const abs = Math.abs(amount);
  const locale = currencyCode === 'INR' ? 'en-IN' : 'en-US';
  return abs.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Get human-readable currency label for PDF headers.
 */
export function getCurrencyLabel(currencyCode: string = 'INR'): string {
  switch (currencyCode.toUpperCase()) {
    case 'INR':
      return 'INR (Indian Rupee - Rs)';
    case 'USD':
      return 'USD (US Dollar - $)';
    case 'EUR':
      return 'EUR (Euro - EUR)';
    case 'GBP':
      return 'GBP (British Pound - GBP)';
    case 'JPY':
      return 'JPY (Japanese Yen - JPY)';
    case 'CAD':
      return 'CAD (Canadian Dollar - $)';
    case 'AUD':
      return 'AUD (Australian Dollar - $)';
    default:
      return `${currencyCode}`;
  }
}

/**
 * Add standard professional executive header to PDF document.
 */
function drawDocumentHeader(
  doc: jsPDF,
  title: string,
  subtitle: string,
  metaItems: { label: string; value: string }[]
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const startX = 14;
  let currentY = 14;

  // Navy Top Accent Bar
  doc.setFillColor(15, 23, 42); // #0f172a slate-900
  doc.rect(startX, currentY, pageWidth - startX * 2, 2.5, 'F');
  currentY += 8;

  // Brand Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('EXPENSEFLOW', startX, currentY);

  // Sub-brand / Tagline right beside or below
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('PERSONAL WEALTH & FINANCIAL PLATFORM', startX, currentY + 4.5);

  // Document Title on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(title.toUpperCase(), pageWidth - startX, currentY, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(subtitle, pageWidth - startX, currentY + 4.5, { align: 'right' });

  currentY += 10;

  // Divider Line
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(startX, currentY, pageWidth - startX, currentY);
  currentY += 5;

  // Metadata Grid (2-3 columns)
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(startX, currentY, pageWidth - startX * 2, 16, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(startX, currentY, pageWidth - startX * 2, 16, 2, 2, 'S');

  const colWidth = (pageWidth - startX * 2) / metaItems.length;
  metaItems.forEach((item, idx) => {
    const colX = startX + idx * colWidth + 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139); // label
    doc.text(item.label.toUpperCase(), colX, currentY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42); // value
    doc.text(item.value, colX, currentY + 11.5);
  });

  currentY += 21;
  return currentY;
}

/**
 * Apply two-pass footer with page numbers and confidentiality notice.
 */
function applyDocumentFooters(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Subtle divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400

    doc.text(
      'ExpenseFlow · Confidential Personal Financial Statement · Generated for account verification',
      margin,
      pageHeight - 7
    );

    doc.setFont('helvetica', 'bold');
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 7, {
      align: 'right',
    });
  }
}

/**
 * Export Transaction Ledger to a professionally formatted PDF.
 */
export function exportTransactionLedgerToPDF(
  transactions: Transaction[],
  options: LedgerExportOptions = {}
): { success: boolean; message: string; count: number } {
  if (!transactions || transactions.length === 0) {
    return {
      success: false,
      message: 'No transactions available to export to PDF.',
      count: 0,
    };
  }

  try {
    const currency = options.currency || 'INR';
    const isFiltered = !!options.isFiltered;
    const filterSummary = options.filterSummary || (isFiltered ? 'Filtered Selection' : 'Complete Ledger');
    const userEmail = options.userEmail || 'Personal Account';
    const today = getTodayDateString();

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // Financial totals for the exported set
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);

    const netBalance = totalIncome - totalExpense;

    // Header Metadata
    let currentY = drawDocumentHeader(
      doc,
      'Transaction Ledger Statement',
      'Official Record of Inflows and Outflows',
      [
        { label: 'Statement Date', value: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
        { label: 'Scope', value: `${transactions.length} Entries (${isFiltered ? 'Filtered' : 'All'})` },
        { label: 'Currency', value: currency.toUpperCase() },
        { label: 'Account Profile', value: userEmail.length > 20 ? userEmail.substring(0, 18) + '...' : userEmail },
      ]
    );

    // Filter Summary Note if applied
    if (isFiltered && options.filterSummary) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Active Filters: ${options.filterSummary}`, margin, currentY);
      currentY += 5;
    }

    // Summary KPI Summary Band
    const cardWidth = (pageWidth - margin * 2 - 8) / 3;
    const cardHeight = 16;

    // 1. Total Income
    doc.setFillColor(240, 253, 244); // emerald-50
    doc.roundedRect(margin, currentY, cardWidth, cardHeight, 1.5, 1.5, 'F');
    doc.setDrawColor(187, 247, 208); // emerald-200
    doc.roundedRect(margin, currentY, cardWidth, cardHeight, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(22, 101, 52); // emerald-800
    doc.text('TOTAL INFLOW (INCOME)', margin + 3.5, currentY + 5);

    doc.setFontSize(10.5);
    doc.text(`+ ${formatPdfNumber(totalIncome, currency)}`, margin + 3.5, currentY + 11.5);

    // 2. Total Expense
    const card2X = margin + cardWidth + 4;
    doc.setFillColor(254, 242, 242); // rose-50
    doc.roundedRect(card2X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'F');
    doc.setDrawColor(254, 202, 202); // rose-200
    doc.roundedRect(card2X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(153, 27, 27); // rose-800
    doc.text('TOTAL OUTFLOW (EXPENSES)', card2X + 3.5, currentY + 5);

    doc.setFontSize(10.5);
    doc.text(`- ${formatPdfNumber(totalExpense, currency)}`, card2X + 3.5, currentY + 11.5);

    // 3. Net Flow
    const card3X = card2X + cardWidth + 4;
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(card3X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(card3X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('NET PERIOD BALANCE', card3X + 3.5, currentY + 5);

    doc.setFontSize(10.5);
    if (netBalance >= 0) {
      doc.setTextColor(5, 150, 105);
      doc.text(`+ ${formatPdfNumber(netBalance, currency)}`, card3X + 3.5, currentY + 11.5);
    } else {
      doc.setTextColor(225, 29, 72);
      doc.text(`- ${formatPdfNumber(Math.abs(netBalance), currency)}`, card3X + 3.5, currentY + 11.5);
    }

    currentY += cardHeight + 7;

    // Table of Transactions
    const tableHeaders = [
      '#',
      'Date',
      'Description / Memo',
      'Category',
      'Method',
      'Type',
      `Amount (${currency})`,
    ];

    const tableRows = transactions.map((tx, idx) => {
      const isIncome = tx.type === 'income';
      const formattedAmt = isIncome
        ? `+ ${formatPdfNumber(tx.amount, currency)}`
        : `- ${formatPdfNumber(tx.amount, currency)}`;

      return [
        (idx + 1).toString(),
        tx.date,
        tx.description || '-',
        tx.category,
        tx.paymentMethod || 'Other',
        isIncome ? 'Income' : 'Expense',
        formattedAmt,
      ];
    });

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin, bottom: 16 },
      head: [tableHeaders],
      body: tableRows,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 2.8,
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [15, 23, 42], // slate-900
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // slate-50
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 22 },
        2: { halign: 'left' },
        3: { halign: 'left', cellWidth: 28 },
        4: { halign: 'left', cellWidth: 24 },
        5: { halign: 'center', cellWidth: 20 },
        6: { halign: 'right', cellWidth: 32, fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        // Style amount column and type column conditionally
        if (data.section === 'body') {
          const rowData = tableRows[data.row.index];
          const isIncome = rowData && rowData[5] === 'Income';

          if (data.column.index === 5) {
            // Type column
            data.cell.styles.textColor = isIncome ? [22, 101, 52] : [153, 27, 27];
            data.cell.styles.fontStyle = 'bold';
          }
          if (data.column.index === 6) {
            // Amount column
            data.cell.styles.textColor = isIncome ? [5, 150, 105] : [225, 29, 72];
          }
        }
      },
      foot: [
        [
          '',
          '',
          `Net Balance (${transactions.length} items)`,
          '',
          '',
          netBalance >= 0 ? 'Surplus' : 'Deficit',
          (netBalance >= 0 ? '+ ' : '- ') + formatPdfNumber(Math.abs(netBalance), currency),
        ],
      ],
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontStyle: 'bold',
        halign: 'left',
      },
    });

    // Apply clean footer with page numbering to all pages
    applyDocumentFooters(doc);

    // Save PDF
    const filename = `expenseflow-ledger-${isFiltered ? 'filtered-' : ''}${today}.pdf`;
    doc.save(filename);

    return {
      success: true,
      message: `Exported ${transactions.length} transactions to PDF successfully.`,
      count: transactions.length,
    };
  } catch (error) {
    console.error('Failed to generate Transaction Ledger PDF:', error);
    return {
      success: false,
      message: 'Failed to create PDF document. Please try again.',
      count: 0,
    };
  }
}

/**
 * Export Comprehensive Financial Report to a professionally formatted PDF.
 */
export function exportFinancialReportToPDF(
  transactions: Transaction[],
  budgets: Budget[] = [],
  options: ReportExportOptions = {}
): { success: boolean; message: string } {
  try {
    const currency = options.currency || 'INR';
    const timeframe = options.timeframe || '6months';
    const userEmail = options.userEmail || 'Personal Account';
    const today = getTodayDateString();

    const timeframeLabel =
      timeframe === '6months'
        ? 'Last 6 Months'
        : timeframe === '12months'
        ? 'Last 12 Months'
        : 'All-Time Financial History';

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // Calculate monthly multi-period breakdown
    const map = new Map<string, { income: number; expense: number; month: string }>();
    const count = timeframe === '6months' ? 6 : timeframe === '12months' ? 12 : 24;
    const now = new Date();

    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('default', { month: 'short', year: 'numeric' });
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

    const monthlyData = Array.from(map.entries()).map(([key, val]) => ({
      key,
      ...val,
      net: val.income - val.expense,
      savingsRate: val.income > 0 ? ((val.income - val.expense) / val.income) * 100 : 0,
    }));

    const totalPeriodIncome = monthlyData.reduce((acc, m) => acc + m.income, 0);
    const totalPeriodExpense = monthlyData.reduce((acc, m) => acc + m.expense, 0);
    const netPeriodSavings = totalPeriodIncome - totalPeriodExpense;
    const avgSavingsRate =
      totalPeriodIncome > 0 ? (netPeriodSavings / totalPeriodIncome) * 100 : 0;
    const avgMonthlyIncome = monthlyData.length > 0 ? totalPeriodIncome / monthlyData.length : 0;
    const avgMonthlyExpense = monthlyData.length > 0 ? totalPeriodExpense / monthlyData.length : 0;

    // Category breakdown
    const categoryBreakdown = calculateCategoryBreakdown(transactions, 'expense');

    // Header
    let currentY = drawDocumentHeader(
      doc,
      'Financial Analytics Report',
      'Executive Cash Flow, Budget & Savings Audit',
      [
        { label: 'Reporting Period', value: timeframeLabel },
        { label: 'Statement Date', value: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
        { label: 'Currency Standard', value: currency.toUpperCase() },
        { label: 'Account Holder', value: userEmail.length > 20 ? userEmail.substring(0, 18) + '...' : userEmail },
      ]
    );

    // Section 1: Executive KPI Summary Cards
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('1. EXECUTIVE SUMMARY & KEY PERFORMANCE METRICS', margin, currentY);
    currentY += 4.5;

    const cardWidth = (pageWidth - margin * 2 - 12) / 4;
    const cardHeight = 16;

    const summaryCards = [
      {
        title: 'TOTAL INFLOW',
        value: `+ ${formatPdfNumber(totalPeriodIncome, currency)}`,
        subtitle: 'Accumulated Income',
        bgColor: [240, 253, 244],
        borderColor: [187, 247, 208],
        textColor: [22, 101, 52],
      },
      {
        title: 'TOTAL OUTFLOW',
        value: `- ${formatPdfNumber(totalPeriodExpense, currency)}`,
        subtitle: 'Accumulated Expenses',
        bgColor: [254, 242, 242],
        borderColor: [254, 202, 202],
        textColor: [153, 27, 27],
      },
      {
        title: 'NET SAVINGS',
        value: (netPeriodSavings >= 0 ? '+ ' : '- ') + formatPdfNumber(Math.abs(netPeriodSavings), currency),
        subtitle: 'Net Cash Reserve',
        bgColor: [248, 250, 252],
        borderColor: [226, 232, 240],
        textColor: netPeriodSavings >= 0 ? [5, 150, 105] : [225, 29, 72],
      },
      {
        title: 'SAVINGS RATE',
        value: `${avgSavingsRate.toFixed(1)}%`,
        subtitle: 'Avg of Gross Income',
        bgColor: [240, 249, 255],
        borderColor: [186, 230, 253],
        textColor: [3, 105, 161],
      },
    ];

    summaryCards.forEach((card, i) => {
      const cardX = margin + i * (cardWidth + 4);
      doc.setFillColor(card.bgColor[0], card.bgColor[1], card.bgColor[2]);
      doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'F');
      doc.setDrawColor(card.borderColor[0], card.borderColor[1], card.borderColor[2]);
      doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(card.textColor[0], card.textColor[1], card.textColor[2]);
      doc.text(card.title, cardX + 3, currentY + 4.5);

      doc.setFontSize(9);
      doc.text(card.value, cardX + 3, currentY + 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(card.subtitle, cardX + 3, currentY + 14);
    });

    currentY += cardHeight + 8;

    // Section 2: Multi-Month Cash Flow Statement
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('2. MULTI-MONTH CASH FLOW & LIQUIDITY STATEMENT', margin, currentY);
    currentY += 4;

    const monthlyHeaders = [
      'Period',
      `Income (${currency})`,
      `Expenses (${currency})`,
      `Net Cash Flow (${currency})`,
      'Savings Rate',
      'Health Status',
    ];

    const monthlyRows = monthlyData.map((m) => {
      const isSurplus = m.net >= 0;
      return [
        m.month,
        formatPdfNumber(m.income, currency),
        formatPdfNumber(m.expense, currency),
        (isSurplus ? '+ ' : '- ') + formatPdfNumber(Math.abs(m.net), currency),
        `${m.savingsRate.toFixed(1)}%`,
        isSurplus ? (m.savingsRate >= 20 ? 'Strong Surplus' : 'Moderate Surplus') : 'Deficit / Deflation',
      ];
    });

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [monthlyHeaders],
      body: monthlyRows,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 7.8,
        cellPadding: 2.4,
        lineColor: [226, 232, 240],
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'left',
      },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold' },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right', fontStyle: 'bold' },
        4: { halign: 'center' },
        5: { halign: 'center' },
      },
      didParseCell: (data) => {
        if (data.section === 'body') {
          const row = monthlyRows[data.row.index];
          if (data.column.index === 3) {
            const isSurplus = row && row[3].startsWith('+');
            data.cell.styles.textColor = isSurplus ? [5, 150, 105] : [225, 29, 72];
          }
          if (data.column.index === 5) {
            const isDeficit = row && row[5].includes('Deficit');
            data.cell.styles.textColor = isDeficit ? [225, 29, 72] : [22, 101, 52];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // Check if we need page break for Section 3
    if (currentY > 215) {
      doc.addPage();
      currentY = 20;
    }

    // Section 3: Expense Allocation by Category
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('3. CATEGORY-WISE EXPENSE ALLOCATION & CONCENTRATION', margin, currentY);
    currentY += 4;

    const categoryHeaders = [
      'Expense Category',
      `Amount Spent (${currency})`,
      'Share of Expenses',
      'Transaction Count',
      'Average Ticket Size',
    ];

    const categoryRows = categoryBreakdown.map((cat) => {
      const avgTicket =
        cat.transactionCount > 0 ? cat.amount / cat.transactionCount : 0;
      return [
        cat.category,
        formatPdfNumber(cat.amount, currency),
        `${cat.percentage.toFixed(1)}%`,
        cat.transactionCount.toString(),
        formatPdfNumber(avgTicket, currency),
      ];
    });

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [categoryHeaders],
      body: categoryRows.length > 0 ? categoryRows : [['No expense records found', '-', '-', '-', '-']],
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 7.8,
        cellPadding: 2.4,
        lineColor: [226, 232, 240],
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold' },
        1: { halign: 'right' },
        2: { halign: 'center', fontStyle: 'bold' },
        3: { halign: 'center' },
        4: { halign: 'right' },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // Check if we need page break for Section 4
    if (currentY > 215) {
      doc.addPage();
      currentY = 20;
    }

    // Section 4: Budget Discipline & Utilization
    if (budgets && budgets.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('4. BUDGET UTILIZATION & DISCIPLINE AUDIT', margin, currentY);
      currentY += 4;

      const budgetHeaders = [
        'Category Target',
        `Monthly Limit (${currency})`,
        `Actual Spent (${currency})`,
        'Utilization Rate',
        'Compliance Status',
      ];

      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const budgetRows = budgets.map((b) => {
        // Find spent for this category in current month
        const spent = transactions
          .filter(
            (tx) =>
              tx.type === 'expense' &&
              tx.category === b.category &&
              tx.date.startsWith(currentMonthKey)
          )
          .reduce((acc, tx) => acc + tx.amount, 0);

        const pct = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
        let status = 'Within Budget';
        if (pct >= 100) status = 'Over Budget (100%+)';
        else if (pct >= 80) status = 'Near Limit (80%+)';

        return [
          b.category,
          formatPdfNumber(b.monthlyLimit, currency),
          formatPdfNumber(spent, currency),
          `${pct.toFixed(1)}%`,
          status,
        ];
      });

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [budgetHeaders],
        body: budgetRows,
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 7.8,
          cellPadding: 2.4,
          lineColor: [226, 232, 240],
        },
        headStyles: {
          fillColor: [51, 65, 85],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { halign: 'left', fontStyle: 'bold' },
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'center', fontStyle: 'bold' },
          4: { halign: 'center' },
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 4) {
            const val = data.cell.text[0] || '';
            if (val.includes('Over Budget')) {
              data.cell.styles.textColor = [225, 29, 72];
              data.cell.styles.fontStyle = 'bold';
            } else if (val.includes('Near Limit')) {
              data.cell.styles.textColor = [217, 119, 6];
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.textColor = [22, 101, 52];
            }
          }
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;
    }

    // Section 5: Advisory & Summary Note
    if (currentY > 235) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 18, 1.5, 1.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 18, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('STATEMENT CERTIFICATION & ADVISORY NOTE', margin + 3.5, currentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'This report compiles financial activity recorded inside your ExpenseFlow platform instance. ' +
        'Average monthly run rate is evaluated based on normalized period entries. ' +
        'Preserve this document for personal tax audit, quarterly budgeting reconciliation, and wealth planning.',
      margin + 3.5,
      currentY + 10,
      { maxWidth: pageWidth - margin * 2 - 7 }
    );

    // Apply clean multi-page footers
    applyDocumentFooters(doc);

    // Save PDF
    const filename = `expenseflow-financial-report-${timeframe}-${today}.pdf`;
    doc.save(filename);

    return {
      success: true,
      message: 'Financial analytics report exported to PDF successfully.',
    };
  } catch (error) {
    console.error('Failed to generate Financial Report PDF:', error);
    return {
      success: false,
      message: 'Failed to create Financial Report PDF. Please try again.',
    };
  }
}
