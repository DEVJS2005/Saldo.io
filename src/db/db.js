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

// Helper to check if DB is empty and seed initial data
db.on('populate', () => {
  db.categories.bulkAdd([
    { name: 'Salário', type: 'receita' },
    { name: 'Extra', type: 'receita' },
    { name: 'Alimentação', type: 'despesa' },
    { name: 'Moradia', type: 'despesa' },
    { name: 'Transporte', type: 'despesa' },
    { name: 'Lazer', type: 'despesa' },
    { name: 'Saúde', type: 'despesa' },
    { name: 'Educação', type: 'despesa' },
    { name: 'Assinaturas', type: 'despesa' },
  ]);

  db.accounts.bulkAdd([
    { name: 'Conta Salário', type: 'bank', limit: 0 },
    { name: 'Ticket Alimentação', type: 'ticket', limit: 0 },
    { name: 'Cartão de Crédito', type: 'credit', limit: 2000 },
  ]);
});
