import { db } from '../db/db';
import { supabase } from './supabase';

/**
 * Downloads all data from Cloud (Supabase) and replaces Local (Dexie) data.
 * Used when a user downgrades from Premium to Free (Local) mode,
 * ensuring they have the latest backup.
 */
export async function syncCloudToLocal(userId) {
    if (!userId) throw new Error('User ID required for sync');

    const result = {
        categories: 0,
        accounts: 0,
        transactions: 0,
        errors: []
    };

    try {
        // 1. Fetch ALL Cloud Data
        const { data: categories, error: catError } = await supabase.from('categories').select('*').eq('user_id', userId);
        if (catError) throw catError;

        const { data: accounts, error: accError } = await supabase.from('accounts').select('*').eq('user_id', userId);
        if (accError) throw accError;

        const { data: transactions, error: txError } = await supabase.from('transactions').select('*').eq('user_id', userId);
        if (txError) throw txError;

        // 2. Clear Local DB (Safety: Transaction to ensure atomicity?)
        // Dexie transaction 'rw' on all tables
        await db.transaction('rw', db.categories, db.accounts, db.transactions, async () => {
            
            // Clear current local data
            await db.categories.clear();
            await db.accounts.clear();
            await db.transactions.clear();

            // 3. Insert Categories
            if (categories?.length) {
                const localCats = categories.map(c => ({
                    // id: c.id, // Should we keep UUIDs? Dexie IDs are auto-increment integers in current schema usually?
                    // Let's check db.js schema: '++id, name, type'
                    // If we pass 'id', Dexie uses it. But Supabase IDs are UUIDs.
                    // Dexie '++id' implies auto-increment number.
                    // IMPORTANT: If we use Supabase UUIDs as keys locally, schema might need update or we rely on non-indexed keys?
                    // Dexie handles string keys if defined?
                    // db.js: `categories: '++id, ...'` -> Auto-increment Integer.
                    // If we put UUID string into 'id', Dexie might error or accept it.
                    // However, relationships (transactions.categoryId) depend on it.
                    // If we keep Supabase UUIDs, we break the "++id" integer assumption if code expects numbers.
                    // But wait, our 'addTransaction' logic in Cloud Mode uses UUIDs.
                    // Our 'useMasterData' in Cloud Mode uses UUIDs.
                    // So the APP currently handles UUIDs fine.
                    // The LOCAL db schema '++id' might be legacy.
                    // Use 'id' from Supabase implies we change PK type in Dexie or just insert it?
                    // Dexie: If you provide an ID, it uses it. If it's '++id', it expects numbers but might accept strings?
                    // Let's try mapping Supabase ID to 'id'.
                    // If it matches, great. If not, we might need to map IDs.
                    // REFACTOR: Ideally local DB should also use UUIDs to match Cloud.
                    // For now, let's assume we can store UUID in 'id'.
                    ...c,
                    id: c.id // Keep UUID
                }));
                await db.categories.bulkAdd(localCats);
                result.categories = localCats.length;
            }

            // 4. Insert Accounts
            if (accounts?.length) {
                const localAccs = accounts.map(a => ({
                    ...a,
                    id: a.id // Keep UUID
                }));
                await db.accounts.bulkAdd(localAccs);
                result.accounts = localAccs.length;
            }

            // 5. Insert Transactions
            if (transactions?.length) {
                const localTxs = transactions.map(t => ({
                    userId: t.user_id,
                    type: t.type,
                    categoryId: t.category_id,
                    accountId: t.account_id,
                    amount: Number(t.amount),
                    description: t.description,
                    paymentStatus: t.payment_status,
                    date: t.date,
                    month: t.month,
                    year: t.year,
                    recurrenceId: t.recurrence_id,
                    isRecurring: t.is_recurring,
                    installmentId: t.installment_id,
                    installmentNumber: t.installment_number,
                    totalInstallments: t.total_installments,
                    createdAt: t.created_at,
                    id: t.id // Keep UUID
                }));
                await db.transactions.bulkAdd(localTxs);
                result.transactions = localTxs.length;
            }
        });

        return { success: true, ...result };

    } catch (err) {
        console.error('Sync Error:', err);
        return { success: false, error: err.message };
    }
}
