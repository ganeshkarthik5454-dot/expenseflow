import React from 'react';
import {
  Briefcase,
  Laptop,
  TrendingUp,
  Tag,
  Home,
  ShoppingCart,
  Car,
  Zap,
  Film,
  HeartPulse,
  MoreHorizontal,
  CircleDollarSign,
  GraduationCap,
  ShoppingBag,
  Utensils,
  Sparkles,
  Plane,
  Building,
  Key,
  Smartphone,
  Banknote,
  CreditCard,
  Building2,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type {
  IncomeCategory,
  ExpenseCategory,
  Category,
  TransactionType,
  PaymentMethod,
} from '../types';

export interface CategoryMeta {
  label: Category;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  darkBgColor: string;
}

export const INCOME_CATEGORIES: IncomeCategory[] = [
  'Salary',
  'Freelance',
  'Investments',
  'Business',
  'Rental',
  'Others',
];

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Housing',
  'Groceries',
  'Transport',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Education',
  'Shopping',
  'Dining Out',
  'Personal Care',
  'Travel',
  'Others',
];

export const PAYMENT_METHODS: {
  method: PaymentMethod;
  icon: LucideIcon;
  color: string;
}[] = [
  { method: 'UPI', icon: Smartphone, color: '#059669' },
  { method: 'Cash', icon: Banknote, color: '#10b981' },
  { method: 'Debit Card', icon: CreditCard, color: '#0284c7' },
  { method: 'Credit Card', icon: CreditCard, color: '#6366f1' },
  { method: 'Bank Transfer', icon: Building2, color: '#8b5cf6' },
  { method: 'Other', icon: Wallet, color: '#64748b' },
];

export const CATEGORY_META: Record<string, CategoryMeta> = {
  Salary: {
    label: 'Salary',
    icon: Briefcase,
    color: '#059669', // emerald-600
    bgColor: '#ecfdf5',
    darkBgColor: 'rgba(5, 150, 105, 0.2)',
  },
  Freelance: {
    label: 'Freelance',
    icon: Laptop,
    color: '#0284c7', // sky-600
    bgColor: '#f0f9ff',
    darkBgColor: 'rgba(2, 132, 199, 0.2)',
  },
  Investments: {
    label: 'Investments',
    icon: TrendingUp,
    color: '#6366f1', // indigo-500
    bgColor: '#eef2ff',
    darkBgColor: 'rgba(99, 102, 241, 0.2)',
  },
  Business: {
    label: 'Business',
    icon: Building,
    color: '#d97706', // amber-600
    bgColor: '#fffbeb',
    darkBgColor: 'rgba(217, 119, 6, 0.2)',
  },
  Rental: {
    label: 'Rental',
    icon: Key,
    color: '#0d9488', // teal-600
    bgColor: '#f0fdfa',
    darkBgColor: 'rgba(13, 148, 136, 0.2)',
  },
  Housing: {
    label: 'Housing',
    icon: Home,
    color: '#e11d48', // rose-600
    bgColor: '#fff1f2',
    darkBgColor: 'rgba(225, 29, 72, 0.2)',
  },
  Groceries: {
    label: 'Groceries',
    icon: ShoppingCart,
    color: '#ea580c', // orange-600
    bgColor: '#fff7ed',
    darkBgColor: 'rgba(234, 88, 12, 0.2)',
  },
  Transport: {
    label: 'Transport',
    icon: Car,
    color: '#d97706', // amber-600
    bgColor: '#fffbeb',
    darkBgColor: 'rgba(217, 119, 6, 0.2)',
  },
  Utilities: {
    label: 'Utilities',
    icon: Zap,
    color: '#0891b2', // cyan-600
    bgColor: '#ecfeff',
    darkBgColor: 'rgba(8, 145, 178, 0.2)',
  },
  Entertainment: {
    label: 'Entertainment',
    icon: Film,
    color: '#9333ea', // purple-600
    bgColor: '#faf5ff',
    darkBgColor: 'rgba(147, 51, 234, 0.2)',
  },
  Healthcare: {
    label: 'Healthcare',
    icon: HeartPulse,
    color: '#db2777', // pink-600
    bgColor: '#fdf2f8',
    darkBgColor: 'rgba(219, 39, 119, 0.2)',
  },
  Education: {
    label: 'Education',
    icon: GraduationCap,
    color: '#2563eb', // blue-600
    bgColor: '#eff6ff',
    darkBgColor: 'rgba(37, 99, 235, 0.2)',
  },
  Shopping: {
    label: 'Shopping',
    icon: ShoppingBag,
    color: '#c026d3', // fuchsia-600
    bgColor: '#fdf4ff',
    darkBgColor: 'rgba(192, 38, 211, 0.2)',
  },
  'Dining Out': {
    label: 'Dining Out',
    icon: Utensils,
    color: '#f59e0b', // amber-500
    bgColor: '#fffbeb',
    darkBgColor: 'rgba(245, 158, 11, 0.2)',
  },
  'Personal Care': {
    label: 'Personal Care',
    icon: Sparkles,
    color: '#14b8a6', // teal-500
    bgColor: '#f0fdfa',
    darkBgColor: 'rgba(20, 184, 166, 0.2)',
  },
  Travel: {
    label: 'Travel',
    icon: Plane,
    color: '#0284c7', // sky-600
    bgColor: '#f0f9ff',
    darkBgColor: 'rgba(2, 132, 199, 0.2)',
  },
  Others: {
    label: 'Others',
    icon: MoreHorizontal,
    color: '#64748b', // slate-500
    bgColor: '#f8fafc',
    darkBgColor: 'rgba(100, 116, 139, 0.2)',
  },
};

export function getCategoryMeta(category: string): CategoryMeta {
  return (
    CATEGORY_META[category] || {
      label: 'Others',
      icon: Tag,
      color: '#64748b',
      bgColor: '#f8fafc',
      darkBgColor: 'rgba(100, 116, 139, 0.2)',
    }
  );
}

export function getDefaultCategory(type: TransactionType): Category {
  return type === 'income' ? 'Salary' : 'Groceries';
}
