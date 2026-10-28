import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from './categories';
import type { TransactionType } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: {
    description?: string;
    amount?: string;
    category?: string;
    date?: string;
  };
}

export function validateTransactionInput(
  description: string,
  amountInput: string | number,
  type: TransactionType,
  category: string,
  date: string
): ValidationResult {
  const errors: ValidationResult['errors'] = {};

  // Description validation
  const trimmedDesc = typeof description === 'string' ? description.trim() : '';
  if (!trimmedDesc) {
    errors.description = 'Description is required.';
  } else if (trimmedDesc.length > 50) {
    errors.description = 'Description cannot exceed 50 characters.';
  }

  // Amount validation
  if (
    amountInput === '' ||
    amountInput === null ||
    amountInput === undefined ||
    (typeof amountInput === 'string' && amountInput.trim() === '')
  ) {
    errors.amount = 'Amount is required.';
  } else {
    const numAmount = Number(amountInput);
    if (isNaN(numAmount) || !isFinite(numAmount)) {
      errors.amount = 'Please enter a valid numeric amount.';
    } else if (numAmount <= 0) {
      errors.amount = 'Amount must be strictly greater than zero.';
    } else {
      // Check decimal places: up to 2 decimal places allowed
      const strVal = String(amountInput).trim();
      const decimalMatch = strVal.split('.');
      if (decimalMatch.length === 2 && decimalMatch[1].length > 2) {
        errors.amount = 'Amount cannot have more than two decimal places.';
      }
    }
  }

  // Category validation
  const validCategories =
    type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  if (!category || !validCategories.includes(category as any)) {
    errors.category = `Please select a valid ${type} category.`;
  }

  // Date validation
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.date = 'A valid date (YYYY-MM-DD) is required.';
  } else {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      errors.date = 'The specified date is invalid.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
