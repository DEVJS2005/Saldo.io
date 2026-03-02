import { describe, it, expect, vi, beforeEach } from 'vitest';
import { migrateLocalData } from '../lib/migration';
import { db } from '../db/db';

// -----------------------------------------------
// Mocks de chamadas do Supabase
// -----------------------------------------------
const mocks = vi.hoisted(() => ({
  insert: vi.fn(),
  select: vi.fn(),
  delete: vi.fn(),
  eq: vi.fn(),
  neq: vi.fn(),
  single: vi.fn(),
  toArray: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table) => ({
      select: mocks.select,
      insert: mocks.insert,
      delete: mocks.delete,
    })),
  },
}));

// Mock Dexie
vi.mock('../db/db', () => ({
  db: {
    categories: { toArray: mocks.toArray },
    accounts: { toArray: mocks.toArray },
    transactions: { toArray: mocks.toArray },
  },
}));

/**
 * Helper: configura o mock para um cenário de permissão concedida.
 * A migration.js chama .select('can_upload_local_data').eq('id', userId).single()
 * e depois .select('id, name').eq('user_id', userId) para categories e accounts.
 */
function setupPermissionGranted() {
  // 1ª chamada: profiles.select().eq().single() → permissão concedida
  mocks.select.mockReturnValueOnce({
    eq: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: { can_upload_local_data: true },
        error: null,
      }),
    }),
  });
}

function setupCloudCatsAndAccs({ cats = [], accs = [] } = {}) {
  // 2ª chamada: categories.select('id, name').eq('user_id', userId)
  mocks.select.mockReturnValueOnce({
    eq: vi.fn().mockResolvedValue({ data: cats, error: null }),
  });
  // 3ª chamada: accounts.select('id, name').eq('user_id', userId)
  mocks.select.mockReturnValueOnce({
    eq: vi.fn().mockResolvedValue({ data: accs, error: null }),
  });
}

describe('Migration Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Padrão para insert: retorna sucesso com um ID novo
    mocks.insert.mockReturnValue({
      select: () => ({
        single: vi.fn().mockResolvedValue({ data: { id: 'new-uuid-123' }, error: null }),
      }),
      error: null,
    });
  });

  it('should migrate data when cloud is empty', async () => {
    setupPermissionGranted();
    setupCloudCatsAndAccs({ cats: [], accs: [] });

    // Dados Locais
    mocks.toArray
      .mockResolvedValueOnce([{ id: 1, name: 'Food', type: 'despesa' }])  // Categories
      .mockResolvedValueOnce([{ id: 1, name: 'Bank', type: 'bank' }])    // Accounts
      .mockResolvedValueOnce([                                             // Transactions
        { description: 'Lunch', amount: 10, date: new Date().toISOString(), categoryId: 1, accountId: 1 }
      ]);

    // Insert de transactions retorna sucesso direto (sem .select().single())
    mocks.insert.mockReturnValueOnce({ // categories insert
      select: () => ({ single: vi.fn().mockResolvedValue({ data: { id: 'cat-uuid' }, error: null }) }),
    });
    mocks.insert.mockReturnValueOnce({ // accounts insert
      select: () => ({ single: vi.fn().mockResolvedValue({ data: { id: 'acc-uuid' }, error: null }) }),
    });
    mocks.insert.mockResolvedValueOnce({ error: null }); // transactions bulk insert

    const result = await migrateLocalData('user-123');

    expect(result.categories).toBe(1);
    expect(result.accounts).toBe(1);
    expect(result.transactions).toBe(1);
    expect(result.errors).toHaveLength(0);
  });

  it('should handle existing cloud categories (The Duplicate Issue)', async () => {
    setupPermissionGranted();
    setupCloudCatsAndAccs({
      cats: [{ id: 'existing-food-uuid', name: 'Food' }],
      accs: [{ id: 'existing-bank-uuid', name: 'Bank' }],
    });

    mocks.toArray
      .mockResolvedValueOnce([{ id: 10, name: 'Food', type: 'despesa' }])
      .mockResolvedValueOnce([{ id: 20, name: 'Bank', type: 'bank' }])
      .mockResolvedValueOnce([
        { description: 'Dinner', amount: 50, date: new Date().toISOString(), categoryId: 10, accountId: 20 }
      ]);

    mocks.insert.mockResolvedValueOnce({ error: null }); // transactions bulk insert

    const result = await migrateLocalData('user-123');

    expect(result.categories).toBe(0); // nenhuma nova
    expect(result.accounts).toBe(0);   // nenhuma nova
    expect(result.transactions).toBe(1);

    // Verifica que o insert da transação usou os IDs existentes da nuvem
    const insertCall = mocks.insert.mock.calls[0]; // 1ª chamada de insert = transactions chunk
    const insertedTx = insertCall[0][0]; // chunk[0]
    expect(insertedTx.category_id).toBe('existing-food-uuid');
    expect(insertedTx.account_id).toBe('existing-bank-uuid');
  });

  it('should NOT create duplicates when migrating data that matches Seeded data (Accents check)', async () => {
    setupPermissionGranted();
    setupCloudCatsAndAccs({
      cats: [{ id: 'seeded-uuid-1', name: 'Alimentação' }],
      accs: [],
    });

    mocks.toArray
      .mockResolvedValueOnce([{ id: 99, name: 'Alimentação', type: 'despesa' }])
      .mockResolvedValueOnce([]) // Accounts
      .mockResolvedValueOnce([]); // Transactions

    const result = await migrateLocalData('user-123');

    expect(result.categories).toBe(0);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('should skip transactions with Invalid Date', async () => {
    setupPermissionGranted();
    setupCloudCatsAndAccs({ cats: [], accs: [] });

    mocks.toArray
      .mockResolvedValueOnce([{ id: 10, name: 'Food', type: 'despesa' }])
      .mockResolvedValueOnce([{ id: 20, name: 'Bank', type: 'bank' }])
      .mockResolvedValueOnce([
        { description: 'Valid Tx', amount: 50, date: new Date().toISOString(), categoryId: 10, accountId: 20 },
        { description: 'Invalid Tx', amount: 99, date: 'Invalid Date', categoryId: 10, accountId: 20 }
      ]);

    mocks.insert.mockReturnValueOnce({ // categories
      select: () => ({ single: vi.fn().mockResolvedValue({ data: { id: 'cat-uuid' }, error: null }) }),
    });
    mocks.insert.mockReturnValueOnce({ // accounts
      select: () => ({ single: vi.fn().mockResolvedValue({ data: { id: 'acc-uuid' }, error: null }) }),
    });
    mocks.insert.mockResolvedValueOnce({ error: null }); // transactions

    const result = await migrateLocalData('user-123');

    expect(result.transactions).toBe(1); // somente a transação válida
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Invalid Date');
  });
});
