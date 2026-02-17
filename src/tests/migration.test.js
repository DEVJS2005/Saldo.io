import { describe, it, expect, vi, beforeEach } from 'vitest';
import { migrateLocalData } from '../lib/migration';
import { resetCloudData } from '../lib/reset';
import { db } from '../db/db';

const mocks = vi.hoisted(() => ({
  insert: vi.fn(),
  select: vi.fn(),
  delete: vi.fn(),
  eq: vi.fn(),
  neq: vi.fn(),
  single: vi.fn(),
  toArray: vi.fn(),
}));

// Chain setup
mocks.select.mockReturnValue({ eq: mocks.eq });
mocks.eq.mockResolvedValue({ data: [], error: null }); 
mocks.insert.mockReturnValue({ select: () => ({ single: mocks.single }), error: null });
mocks.single.mockResolvedValue({ data: { id: 'new-uuid-123' }, error: null });
mocks.delete.mockReturnValue({ neq: mocks.neq });
mocks.neq.mockResolvedValue({ error: null });

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mocks.select,
      insert: mocks.insert,
      delete: mocks.delete,
    })),
  }
}));

// Mock Dexie
vi.mock('../db/db', () => ({
  db: {
    categories: { toArray: mocks.toArray },
    accounts: { toArray: mocks.toArray },
    transactions: { toArray: mocks.toArray },
  }
}));

describe('Migration Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset chain defaults
        mocks.select.mockReturnValue({ eq: mocks.eq });
        mocks.eq.mockResolvedValue({ data: [] }); 
    });

    it('should migrate data when cloud is empty', async () => {
        // Setup Local Data
        mocks.toArray.mockResolvedValueOnce([{ id: 1, name: 'Food', type: 'despesa' }]); // Categories
        mocks.toArray.mockResolvedValueOnce([{ id: 1, name: 'Bank', type: 'bank' }]); // Accounts
        mocks.toArray.mockResolvedValueOnce([ // Transactions
            { description: 'Lunch', amount: 10, date: new Date().toISOString(), categoryId: 1, accountId: 1 }
        ]);

        // Setup Cloud Data (Empty)
        mocks.eq.mockResolvedValueOnce({ data: [] }); // Categories
        mocks.eq.mockResolvedValueOnce({ data: [] }); // Accounts

        // Run
        const result = await migrateLocalData('user-123');

        expect(result.categories).toBe(1);
        expect(result.accounts).toBe(1);
        expect(result.transactions).toBe(1);
        expect(result.errors).toHaveLength(0);
    });

    it('should handle existing cloud categories (The Duplicate Issue)', async () => {
        // Setup Local Data
        mocks.toArray.mockResolvedValueOnce([{ id: 10, name: 'Food', type: 'despesa' }]);
        mocks.toArray.mockResolvedValueOnce([{ id: 20, name: 'Bank', type: 'bank' }]);
        mocks.toArray.mockResolvedValueOnce([
            { description: 'Dinner', amount: 50, date: new Date().toISOString(), categoryId: 10, accountId: 20 }
        ]);

        // Setup Cloud Data (EXISTING)
        mocks.eq.mockResolvedValueOnce({ data: [{ id: 'existing-food-uuid', name: 'Food' }] }); 
        mocks.eq.mockResolvedValueOnce({ data: [{ id: 'existing-bank-uuid', name: 'Bank' }] });

        // Run
        const result = await migrateLocalData('user-123');

        expect(result.categories).toBe(0); // 0 new
        expect(result.accounts).toBe(0); // 0 new
        expect(result.transactions).toBe(1); // 1 transaction inserted
        
        // Verify transaction insert used the correct mapped IDs
        const insertCall = mocks.insert.mock.calls.find(call => call[0][0]?.description === 'Dinner' || call[0]?.description === 'Dinner');
        // insert receives chunk array
        const insertedTx = insertCall[0][0] || insertCall[0]; // chunk [0]
        expect(insertedTx.category_id).toBe('existing-food-uuid');
        expect(insertedTx.account_id).toBe('existing-bank-uuid');
    });

    it('should NOT create duplicates when migrating data that matches Seeded data (Accents check)', async () => {
        // 1. Simulate "Seeded" Cloud Data
        // 'Alimentação' is a common source of encoding issues
        const seededCategories = [{ id: 'seeded-uuid-1', name: 'Alimentação', type: 'despesa' }];
        mocks.eq.mockResolvedValueOnce({ data: seededCategories }); // Existing Cloud Cats
        mocks.eq.mockResolvedValueOnce({ data: [] }); // Existing Cloud Accounts

        // 2. Setup Local Data with SAME name
        mocks.toArray.mockResolvedValueOnce([{ id: 99, name: 'Alimentação', type: 'despesa' }]); // Local Cats
        mocks.toArray.mockResolvedValueOnce([]); // Local Accounts
        mocks.toArray.mockResolvedValueOnce([]); // Local Tx

        // Run
        const result = await migrateLocalData('user-123');

        // Should find match and NOT insert
        expect(result.categories).toBe(0); 
        expect(mocks.insert).not.toHaveBeenCalled();
    });

    it('should skip transactions with Invalid Date', async () => {
        // Setup Local Data
        mocks.toArray.mockResolvedValueOnce([{ id: 10, name: 'Food', type: 'despesa' }]); // Cats
        mocks.toArray.mockResolvedValueOnce([{ id: 20, name: 'Bank', type: 'bank' }]); // Accs
        mocks.toArray.mockResolvedValueOnce([
            { description: 'Valid Tx', amount: 50, date: new Date().toISOString(), categoryId: 10, accountId: 20 },
            { description: 'Invalid Tx', amount: 99, date: 'Invalid Date', categoryId: 10, accountId: 20 }
        ]);

        // Setup Cloud Data (Empty)
        mocks.eq.mockResolvedValueOnce({ data: [] }); 
        mocks.eq.mockResolvedValueOnce({ data: [] }); 

        // Run
        const result = await migrateLocalData('user-123');

        expect(result.transactions).toBe(1); // Only 1 valid tx
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toContain('Invalid Date'); // Check error message
    });
});
