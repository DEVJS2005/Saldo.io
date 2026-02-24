import Dexie from 'dexie';

export const db = new Dexie('FinanceAppDB');

// Version 4: Add soft delete
db.version(4).stores({
  accounts: '++id, name, type', 
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

import { initialCategories, initialAccounts } from './initialData';

// Helper to check if DB is empty and seed initial data
db.on('populate', () => {
  db.categories.bulkAdd(initialCategories);
  db.accounts.bulkAdd(initialAccounts);
});
