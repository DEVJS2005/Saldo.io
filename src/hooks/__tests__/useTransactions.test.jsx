import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTransactions } from '../useTransactions';
import { db } from '../../db/db';

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
        // 1 original + 12 futures? No, logic says "if recurring... generate 12".
        // Let's check logic: "if (isRecurring && installments === 1) { ... for(let i=0; i<12; i++) ... }"
        // It generates 12 transactions total starting from start date.
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
                amount: 100, // Total amount
                type: 'despesa',
                date: '2023-01-01',
                categoryId: 1,
                accountId: 1,
                installments: 3
            });
        });

        const all = await db.transactions.toArray();
        expect(all).toHaveLength(3);

        // Base value = 100 / 3 = 33.33
        // Last one fixes rounding = 100 - 33.33 - 33.33 = 100 - 66.66 = 33.34
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

        const afterDelete = await db.transactions.toArray();
        expect(afterDelete).toHaveLength(0);
    });

    it('updates a specific installment value', async () => {
        const { result } = renderHook(() => useTransactions());

        // 1. Create installments
        await act(async () => {
            await result.current.addTransaction({
                description: 'House Entry',
                amount: 400, // 100 per parcel
                type: 'despesa',
                date: '2026-01-01',
                categoryId: 1,
                accountId: 1,
                installments: 4
            });
        });

        const all = await db.transactions.toArray();
        expect(all).toHaveLength(4);

        // 2. Find parcel 4
        const parcel4 = all.find(t => t.installmentNumber === 4);
        expect(parcel4).toBeDefined();

        // 3. Update parcel 4 to 301.84
        await act(async () => {
            await result.current.updateTransaction(parcel4.id, {
                ...parcel4,
                amount: 301.84,
                description: 'House Entry Updated'
            });
        });

        // 4. Verify
        const updatedParcel4 = await db.transactions.get(parcel4.id);
        expect(updatedParcel4.amount).toBe(301.84);
        expect(updatedParcel4.description).toBe('House Entry Updated');

        // 5. Verify others remained untouched
        const parcel1 = await db.transactions.get(all.find(t => t.installmentNumber === 1).id);
        expect(parcel1.amount).toBe(100);
    });

    it('updates transaction with string date (simulating form behavior) and preserves visibility', async () => {
        const { result } = renderHook(() => useTransactions());

        // 1. Create a transaction (stored with Date object)
        const initialDate = new Date('2024-05-15T12:00:00');
        await act(async () => {
            await result.current.addTransaction({
                description: 'Original',
                amount: 100,
                type: 'despesa',
                date: initialDate,
                categoryId: 1,
                accountId: 1,
            });
        });

        const all = await db.transactions.toArray();
        const original = all[0];
        expect(original.date).toBeInstanceOf(Date);
        expect(original.month).toBe(4); // May (0-indexed)

        // 2. Update with date as STRING (Form behavior)
        // Even if we don't change the date, the form usually holds it as 'YYYY-MM-DD' string
        const updates = {
            ...original,
            date: '2024-05-15', // STRING!
            amount: 200
        };

        await act(async () => {
            await result.current.updateTransaction(original.id, updates);
        });

        // 3. Verify storage
        const updated = await db.transactions.get(original.id);

        // The bug: If it saved as string, queries expecting Date might fail, 
        // OR month/year might be wrong/missing if we didn't recalc.

        // Let's verify if `getTransactionsByMonth` finds it.
        // We can't easily run useLiveQuery in this test environment without more setup,
        // but we can check the raw data type in DB.

        // If logic is correct, it SHOULD be a Date object.
        expect(updated.date).toBeInstanceOf(Date);
    });

    it('repairs corrupted transactions', async () => {
        const { result } = renderHook(() => useTransactions());

        // 1. Manually insert a "broken" transaction (String date, Invalid Month)
        const brokenId = await db.transactions.add({
            description: 'Broken Transaction',
            amount: 50,
            type: 'despesa',
            date: '2025-12-25', // String!
            month: NaN, // Broken index
            year: NaN, // Broken index
            categoryId: 1,
            accountId: 1,
            paymentStatus: 'pending',
            isRecurring: false
        });

        // Verify it is indeed broken
        let broken = await db.transactions.get(brokenId);
        expect(typeof broken.date).toBe('string');
        expect(broken.month).toBeNaN();

        // 2. Run Repair
        await act(async () => {
            const report = await result.current.validateAndRepairTransactions();
            expect(report.count).toBe(1);
        });

        // 3. Verify Fix
        const fixed = await db.transactions.get(brokenId);
        expect(fixed.date).toBeInstanceOf(Date);
        expect(fixed.month).toBe(11); // December
        expect(fixed.year).toBe(2025);
    });
});
