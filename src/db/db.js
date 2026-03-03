import Dexie from 'dexie';

export const db = new Dexie('FinanceAppDB');

// Version 4: Add soft delete
// Version 5: Add linkedAccountId
db.version(5).stores({
  accounts: '++id, name, type, linkedAccountId',
  categories: '++id, name, type',
  transactions: `
    ++id,
    date,
    month,
    year,
    [month+year],
    type,
    categoryId,
    accountId,
    paymentStatus,
    installmentId,
    recurrenceId,
    isRecurring,
    deleted_at
  `
});

// Version 6: Add budgets store for local offline budget limits
db.version(6).stores({
  accounts: '++id, name, type, linkedAccountId',
  categories: '++id, name, type',
  transactions: `
    ++id,
    date,
    month,
    year,
    [month+year],
    type,
    categoryId,
    accountId,
    paymentStatus,
    installmentId,
    recurrenceId,
    isRecurring,
    deleted_at
  `,
  budgets: '++id, categoryId, monthYear, [categoryId+monthYear]'
});


import { initialCategories, initialAccounts } from './initialData';

// Helper to check if DB is empty and seed initial data
db.on('populate', () => {
  db.categories.bulkAdd(initialCategories);
  db.accounts.bulkAdd(initialAccounts);
});
