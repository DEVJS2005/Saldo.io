import { db } from '../db/db';
import { supabase } from './supabase';

export async function migrateLocalData(userId) {
  if (!userId) throw new Error('User not logged in');

  const result = {
    categories: 0,
    accounts: 0,
    transactions: 0,
    errors: []
  };

  try {
    // 1. Fetch Local Data
    const localCategories = await db.categories.toArray();
    const localAccounts = await db.accounts.toArray();
    const localTransactions = await db.transactions.toArray();

    if (localCategories.length === 0 && localAccounts.length === 0 && localTransactions.length === 0) {
      return { ...result, message: 'No local data to migrate.' };
    }

    // --- MAP BUILDERS ---
    const categoryMap = {}; // oldId -> newUUID
    const accountMap = {}; // oldId -> newUUID

    // 0. Pre-fetch EXISTING identifiers from Cloud to avoid duplicates
    // Normalize names (trim + lower) to ensure matching
    const normalize = (str) => str?.trim().toLowerCase();

    const { data: cloudCats } = await supabase.from('categories').select('id, name').eq('user_id', userId);
    const existingCatMap = new Map(cloudCats?.map(c => [normalize(c.name), c.id]));

    const { data: cloudAccs } = await supabase.from('accounts').select('id, name').eq('user_id', userId);
    const existingAccMap = new Map(cloudAccs?.map(c => [normalize(c.name), c.id]));

    // ...

    // 2. Migrate Categories
    for (const cat of localCategories) {
      const normName = normalize(cat.name);
      if (existingCatMap.has(normName)) {
          // Already exists locally? Use its ID.
          categoryMap[cat.id] = existingCatMap.get(normName);
      } else {
          const { data, error } = await supabase
            .from('categories')
            .insert({ user_id: userId, name: cat.name, type: cat.type })
            .select()
            .single();
          
          if (error) {
            console.error('Category Migration Error:', error);
            result.errors.push(`Category ${cat.name}: ${error.message}`);
          } else {
            categoryMap[cat.id] = data.id;
            existingCatMap.set(normName, data.id); // Update local map
            result.categories++;
          }
      }
    }

    // 3. Migrate Accounts
    for (const acc of localAccounts) {
      const normName = normalize(acc.name);
      if (existingAccMap.has(normName)) {
          accountMap[acc.id] = existingAccMap.get(normName);
      } else {
          const { data, error } = await supabase
            .from('accounts')
            .insert({ 
                user_id: userId, 
                name: acc.name, 
                type: acc.type,
                limit: acc.limit || 0 
            })
            .select()
            .single();

          if (error) {
            console.error('Account Migration Error:', error);
            result.errors.push(`Account ${acc.name}: ${error.message}`);
          } else {
            accountMap[acc.id] = data.id;
            existingAccMap.set(normName, data.id);
            result.accounts++;
          }
      }
    }

    // 4. Migrate Transactions
    const transactionsToInsert = localTransactions.map(t => {
      // Resolve new Foreign Keys
      const newCategoryId = categoryMap[t.categoryId]; // Might be from existing map or new insert
      const newAccountId = accountMap[t.accountId];

      // Robust Check: If we failed to get ID (e.g. category not migrated AND didn't exist), skip.
      if (!newCategoryId) {
         console.warn(`Skipping Transaction "${t.description}": Category ID ${t.categoryId} (Name: ${localCategories.find(c=>c.id===t.categoryId)?.name}) not mapped.`);
         result.errors.push(`Skipped Tx "${t.description}": Category not found.`);
         return null;
      }
      if (!newAccountId) {
         console.warn(`Skipping Transaction "${t.description}": Account ID ${t.accountId} not mapped.`);
         result.errors.push(`Skipped Tx "${t.description}": Account not found.`);
         return null; 
      }

      // Date Check
      let parsedDate = new Date(t.date);
      if (isNaN(parsedDate.getTime())) {
          // If invalid date (e.g. 'Fechamento de Mês'), assume it's a recent system transaction or skip.
          // For 'Fechamento de Mês', it's usually the last day of a month. 
          // Let's log it but try to save if possible? No, 'Invalid Date' cannot be saved to timestamp column.
          // If description contains 'Fechamento', maybe use today or created_at?
          // Safeguard: Skip for now to avoid DB error.
          console.warn('Skipping transaction with invalid date:', t);
          result.errors.push(`Skipped Tx "${t.description}": Invalid Date (${t.date})`);
          return null;
      }

      return {
        user_id: userId,
        description: t.description,
        amount: parseFloat(t.amount),
        date: parsedDate.toISOString(), 
        type: t.type,
        category_id: newCategoryId,
        account_id: newAccountId,
        payment_status: t.paymentStatus || 'pending',
        
        // Correct Column Names matching update_schema.sql
        installment_number: t.currentInstallment || 1, 
        total_installments: t.installments || 1,
        
        is_recurring: t.isRecurring || false,
      };
    }).filter(t => t !== null);

    if (transactionsToInsert.length > 0) {
      // Insert in chunks of 50
      const chunkSize = 50;
      for (let i = 0; i < transactionsToInsert.length; i += chunkSize) {
        const chunk = transactionsToInsert.slice(i, i + chunkSize);
        const { error } = await supabase.from('transactions').insert(chunk);
        if (error) {
          console.error('Transaction Batch Error:', error);
          result.errors.push(`Batch ${i}: ${error.message}`); // Still could be duplicates if constraints exist
        } else {
          result.transactions += chunk.length;
        }
      }
    }

    return result;

  } catch (err) {
    console.error('Fatal Migration Error:', err);
    throw err;
  }
}
