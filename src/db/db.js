import Dexie from 'dexie';

export const db = new Dexie('FinanceAppDB');

// Version 3: Force update for indices
db.version(3).stores({
  // Accounts: Wallet, Bank, Credit Card
  // Indexed: name, type
  accounts: '++id, name, type', 

  // Categories: Food, Housing, etc.
  // Indexed: name, type (income/expense)
  categories: '++id, name, type', 

  // Transactions
  // Indexed fields for filtering/sorting:
  // date: timeline
  // [month+year]: for monthly queries
  // type: income/expense/transfer
  // categoryId, accountId: relationships
  // paymentStatus: paid/pending
  // installmentId: grouping installments
  // isRecurring: for auto-copy
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
    isRecurring
  `
});

import { initialCategories, initialAccounts } from './initialData';

// Helper to check if DB is empty and seed initial data
db.on('populate', () => {
  db.categories.bulkAdd(initialCategories);
  db.accounts.bulkAdd(initialAccounts);
});
