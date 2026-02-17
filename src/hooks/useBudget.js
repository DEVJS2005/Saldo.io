import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { startOfMonth, endOfMonth } from 'date-fns';

export function useBudget(monthDate = new Date()) {
  const stats = useLiveQuery(async () => {
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);

    // 1. Monthly Data (For Projection, Income, Expense of the month)
    const transactions = await db.transactions
      .where('date')
      .between(start, end, true, true)
      .toArray();

    // 2. Global Data (For Real Balance & Account Balances)
    // We fetch ALL PAID transactions to know the actual money in accounts
    const allPaidTransactions = await db.transactions
        .where('paymentStatus')
        .equals('paid')
        .toArray();

    // Monthly Stats
    let income = 0;
    let expense = 0;
    // let incomePaid = 0; // No longer used for "Real Balance" (which is now global)
    // let expensePaid = 0;

    transactions.forEach(t => {
      const val = Number(t.amount);
      if (t.type === 'receita') {
        income += val;
      } else if (t.type === 'despesa') {
        expense += val;
      }
    });

    // Global Stats
    let globalRealBalance = 0;
    const accountBalances = {}; 

    allPaidTransactions.forEach(t => {
        const val = Number(t.amount);
        
        // Global Balance
        if (t.type === 'receita') globalRealBalance += val;
        else if (t.type === 'despesa') globalRealBalance -= val;

        // Account Balances
        if (!accountBalances[t.accountId]) accountBalances[t.accountId] = 0;
        
        if (t.type === 'receita') accountBalances[t.accountId] += val;
        else if (t.type === 'despesa') accountBalances[t.accountId] -= val;
    });

    return {
      income,
      expense,
      balanceProjected: income - expense,
      balanceReal: globalRealBalance, // Now Global
      accountBalances, // New: Global Balance per Account
      transactions
    };
  }, [monthDate], { income: 0, expense: 0, balanceProjected: 0, balanceReal: 0, accountBalances: {}, transactions: [] });

  return stats;
}
