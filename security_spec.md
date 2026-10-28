# Security Specification: ExpenseFlow Firestore Rules

## 1. Data Invariants
1. **User Isolation (Master Gate)**: All transactions reside under `/users/{userId}/transactions/{transactionId}`. Only the authenticated owner matching `{userId} == request.auth.uid` can access, query, create, or mutate transactions.
2. **Schema & Field Guard**: A transaction must strictly contain allowed keys: `id`, `userId`, `description`, `amount`, `type`, `category`, `date`, `createdAt`. No ghost or shadow fields are permitted.
3. **Monetary Value Integrity**: `amount` must be a positive number (`amount > 0`).
4. **Description Bounds**: `description` must be between 1 and 50 characters.
5. **Type & Category Allowlist**: `type` must be `'income'` or `'expense'`. `category` must match valid defined categories.
6. **Date Pattern**: `date` must conform to `YYYY-MM-DD`.
7. **Identity Immutability**: Neither `userId` nor `id` can be modified after creation.

## 2. The Dirty Dozen Payloads (Targeting Rejection)
1. **Unauthenticated Read**: Attempting to read `/users/{victimId}/transactions` without `request.auth`. -> *PERMISSION_DENIED*
2. **Cross-Tenant List**: User `attacker` querying `/users/victim/transactions`. -> *PERMISSION_DENIED*
3. **Spoofed Owner in Document**: User `attacker` writing `userId: 'victim'` in data payload. -> *PERMISSION_DENIED*
4. **Ghost Field Shadow Injection**: Writing `{ id, userId, description, amount, type, category, date, isAdmin: true }`. -> *PERMISSION_DENIED*
5. **Negative Amount**: Writing `{ amount: -150 }`. -> *PERMISSION_DENIED*
6. **Zero Amount**: Writing `{ amount: 0 }`. -> *PERMISSION_DENIED*
7. **Oversized Description (>50 chars)**: Writing a description of 51 characters. -> *PERMISSION_DENIED*
8. **Invalid Category**: Writing `{ category: 'Gambling' }`. -> *PERMISSION_DENIED*
9. **Invalid Type**: Writing `{ type: 'refund' }`. -> *PERMISSION_DENIED*
10. **Corrupted Date Format**: Writing `{ date: '10-10-2026' }`. -> *PERMISSION_DENIED*
11. **Id Poisoning**: Writing with document path ID of 200 characters containing shell symbols `../`. -> *PERMISSION_DENIED*
12. **Owner ID Mutation on Update**: Trying to alter `userId` on existing transaction. -> *PERMISSION_DENIED*
