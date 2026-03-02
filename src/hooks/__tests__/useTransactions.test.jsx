import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTransactions } from '../useTransactions';
import { db } from '../../db/db';

// Mock do AuthContext para simular usuário local (sem sync com cloud)
vi.mock('../../contexts/AuthContext', () => ({
    useAuth: () => ({
        user: {
            id: 'test-user-id',
            email: 'test@example.com',
            canSync: false, // Força o caminho local (Dexie)
        },
    }),
}));

describe('useTransactions Hook', () => {
    beforeEach(async () => {
        await db.transactions.clear();
    });

    it('adds a simple transaction', async () => {
        const { result } = renderHook(() => useTransactions());

        await act(async () => {
            await result.current.addTransaction({
                description: 'Test Simple',
                amount: 100,
                type: 'despesa',
                date: '2023-10-10',
                categoryId: 1,
                accountId: 1
            });
        });

        const all = await db.transactions.toArray();
        expect(all).toHaveLength(1);
        expect(all[0].description).toBe('Test Simple');
        expect(all[0].amount).toBe(100);
    });

    it('adds recurring transactions (12 months)', async () => {
        const { result } = renderHook(() => useTransactions());

        await act(async () => {
            await result.current.addTransaction({
                description: 'Test Recurrence',
                amount: 50,
                type: 'despesa',
                date: '2023-01-01',
                categoryId: 1,
                accountId: 1,
                isRecurring: true,
                installments: 1
            });
        });

        const all = await db.transactions.toArray();
        // A lógica gera 12 transações para recorrências
        expect(all).toHaveLength(12);
        expect(all[0].isRecurring).toBe(true);
        expect(all[0].recurrenceId).toBeDefined();
        expect(all[11].recurrenceId).toBe(all[0].recurrenceId);
    });

    it('adds installment transactions', async () => {
        const { result } = renderHook(() => useTransactions());

        await act(async () => {
            await result.current.addTransaction({
                description: 'Test Installment',
                amount: 100, // Total
                type: 'despesa',
                date: '2023-01-01',
                categoryId: 1,
                accountId: 1,
                installments: 3
            });
        });

        const all = await db.transactions.toArray();
        expect(all).toHaveLength(3);

        // Arredondamento: 100 / 3 = 33.33 | último: 33.34
        const t1 = all.find(t => t.installmentNumber === 1);
        const t2 = all.find(t => t.installmentNumber === 2);
        const t3 = all.find(t => t.installmentNumber === 3);

        expect(t1.amount).toBe(33.33);
        expect(t2.amount).toBe(33.33);
        expect(t3.amount).toBe(33.34);

        expect(t1.description).toContain('(1/3)');
        expect(t3.description).toContain('(3/3)');
    });

    it('deletes a transaction', async () => {
        const { result } = renderHook(() => useTransactions());
        let id;

        await act(async () => {
            await result.current.addTransaction({
                description: 'To Delete',
                amount: 100,
                type: 'despesa',
                date: '2023-10-10',
                categoryId: 1,
                accountId: 1
            });
        });

        const all = await db.transactions.toArray();
        id = all[0].id;

        await act(async () => {
            await result.current.deleteTransaction(id);
        });

        // Delete no modo local marca deleted_at, não remove o registro
        const afterDelete = await db.transactions.get(id);
        expect(afterDelete.deleted_at).toBeDefined();
    });

    it('updates a specific installment value', async () => {
        const { result } = renderHook(() => useTransactions());

        await act(async () => {
            await result.current.addTransaction({
                description: 'House Entry',
                amount: 400, // 100 por parcela
                type: 'despesa',
                date: '2026-01-01',
                categoryId: 1,
                accountId: 1,
                installments: 4
            });
        });

        const all = await db.transactions.toArray();
        expect(all).toHaveLength(4);

        const parcel4 = all.find(t => t.installmentNumber === 4);
        expect(parcel4).toBeDefined();

        await act(async () => {
            await result.current.updateTransaction(parcel4.id, {
                ...parcel4,
                amount: 301.84,
                description: 'House Entry Updated'
            });
        });

        const updatedParcel4 = await db.transactions.get(parcel4.id);
        expect(updatedParcel4.amount).toBe(301.84);
        expect(updatedParcel4.description).toBe('House Entry Updated');

        // Verifica que as outras parcelas não foram modificadas
        const parcel1 = await db.transactions.get(all.find(t => t.installmentNumber === 1).id);
        expect(parcel1.amount).toBe(100);
    });

    it('updates transaction with string date and normalizes to Date object', async () => {
        const { result } = renderHook(() => useTransactions());

        await act(async () => {
            await result.current.addTransaction({
                description: 'Original',
                amount: 100,
                type: 'despesa',
                date: '2024-05-15',
                categoryId: 1,
                accountId: 1,
            });
        });

        const all = await db.transactions.toArray();
        const original = all[0];

        // Atualiza com data como STRING (comportamento de formulário)
        const updates = {
            ...original,
            date: '2024-05-15', // STRING
            amount: 200
        };

        await act(async () => {
            await result.current.updateTransaction(original.id, updates);
        });

        const updated = await db.transactions.get(original.id);
        expect(updated.amount).toBe(200);
        // A data deve ser armazenada como ISO string normalizada
        expect(updated.date).toBeDefined();
        expect(updated.month).toBe(4); // Maio (0-indexed)
        expect(updated.year).toBe(2024);
    });
});
