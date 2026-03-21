import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTransactions } from '../useTransactions';

// ─── Mocks ───────────────────────────────────────────────────────────────────

// Mock do Supabase — modo cloud (único modo disponível agora)
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockEq = vi.fn();
const mockGte = vi.fn();

vi.mock('../../lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            insert: mockInsert,
            update: mockUpdate,
            select: mockSelect,
        })),
    },
}));

// Mock do AuthContext — app é online-only: canSync sempre true
vi.mock('../../contexts/AuthContext', () => ({
    useAuth: () => ({
        user: {
            id: 'test-user-id',
            email: 'test@example.com',
            canSync: true, // Online-only mode
        },
    }),
}));

// ─── Helpers de Mock ─────────────────────────────────────────────────────────

/** Configura insert para retornar sucesso */
function mockInsertSuccess() {
    mockInsert.mockResolvedValue({ error: null });
}

/** Configura insert para retornar erro */
function mockInsertError(message = 'DB Error') {
    mockInsert.mockResolvedValue({ error: { message } });
}

/** Configura update para retornar sucesso */
function mockUpdateSuccess() {
    mockUpdate.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
    });
}

// ─── Testes ──────────────────────────────────────────────────────────────────

describe('useTransactions Hook (Cloud Mode)', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── addTransaction ────────────────────────────────────────────────────────

    describe('addTransaction', () => {
        it('insere uma transação simples via Supabase', async () => {
            mockInsertSuccess();
            const { result } = renderHook(() => useTransactions());

            await act(async () => {
                await result.current.addTransaction({
                    description: 'Almoço',
                    amount: 50,
                    type: 'despesa',
                    date: '2024-05-15',
                    categoryId: 'cat-uuid-1',
                    accountId: 'acc-uuid-1',
                });
            });

            expect(mockInsert).toHaveBeenCalledTimes(1);
            const payload = mockInsert.mock.calls[0][0];
            expect(payload).toHaveLength(1);
            expect(payload[0].description).toBe('Almoço');
            expect(payload[0].amount).toBe(50);
            expect(payload[0].user_id).toBe('test-user-id');
            expect(payload[0].category_id).toBe('cat-uuid-1');
            expect(payload[0].account_id).toBe('acc-uuid-1');
            expect(payload[0].is_recurring).toBe(false);
        });

        it('insere 12 transações para recorrência', async () => {
            mockInsertSuccess();
            const { result } = renderHook(() => useTransactions());

            await act(async () => {
                await result.current.addTransaction({
                    description: 'Assinatura Netflix',
                    amount: 40,
                    type: 'despesa',
                    date: '2024-01-10',
                    categoryId: 'cat-uuid-1',
                    accountId: 'acc-uuid-1',
                    isRecurring: true,
                });
            });

            expect(mockInsert).toHaveBeenCalledTimes(1);
            const payload = mockInsert.mock.calls[0][0];
            expect(payload).toHaveLength(12);
            expect(payload[0].is_recurring).toBe(true);
            // Todas devem compartilhar o mesmo recurrence_id
            const recurrenceId = payload[0].recurrence_id;
            expect(recurrenceId).toBeDefined();
            payload.forEach(tx => expect(tx.recurrence_id).toBe(recurrenceId));
        });

        it('insere X parcelas para transação parcelada com valores corretos', async () => {
            mockInsertSuccess();
            const { result } = renderHook(() => useTransactions());

            await act(async () => {
                await result.current.addTransaction({
                    description: 'Notebook',
                    amount: 100,
                    type: 'despesa',
                    date: '2024-01-01',
                    categoryId: 'cat-uuid-1',
                    accountId: 'acc-uuid-1',
                    installments: 3,
                });
            });

            expect(mockInsert).toHaveBeenCalledTimes(1);
            const payload = mockInsert.mock.calls[0][0];
            expect(payload).toHaveLength(3);

            // Arredondamento: 100/3 = 33.33 | último = 33.34
            const parcela1 = payload.find(t => t.installment_number === 1);
            const parcela2 = payload.find(t => t.installment_number === 2);
            const parcela3 = payload.find(t => t.installment_number === 3);

            expect(parcela1.amount).toBe(33.33);
            expect(parcela2.amount).toBe(33.33);
            expect(parcela3.amount).toBe(33.34);

            expect(parcela1.description).toContain('(1/3)');
            expect(parcela3.description).toContain('(3/3)');

            // Todas devem compartilhar o mesmo installment_id
            const installmentId = payload[0].installment_id;
            expect(installmentId).toBeDefined();
            payload.forEach(tx => expect(tx.installment_id).toBe(installmentId));
        });

        it('não chama insert se campos obrigatórios estiverem faltando', async () => {
            const { result } = renderHook(() => useTransactions());

            // categoryId ausente — handleError vai re-lançar o erro de validação,
            // então capturamos via try/catch dentro do act
            await act(async () => {
                try {
                    await result.current.addTransaction({
                        description: 'Incompleto',
                        amount: 100,
                        type: 'despesa',
                        date: '2024-01-01',
                        accountId: 'acc-uuid-1',
                        // categoryId: ausente
                    });
                } catch (err) {
                    // Esperado: 'Campos obrigatórios faltando.'
                    expect(err.message).toContain('Campos obrigatórios');
                }
            });

            // Insert nunca deve ser chamado
            expect(mockInsert).not.toHaveBeenCalled();
        });
    });

    // ── deleteTransaction ─────────────────────────────────────────────────────

    describe('deleteTransaction', () => {
        it('soft-delete de transação única via update com deleted_at', async () => {
            const mockEqChained = vi.fn().mockResolvedValue({ error: null });
            mockUpdate.mockReturnValue({ eq: mockEqChained });

            const { result } = renderHook(() => useTransactions());

            await act(async () => {
                await result.current.deleteTransaction('tx-id-123', 'single');
            });

            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({ deleted_at: expect.any(String), deleted_by: 'test-user-id' })
            );
            expect(mockEqChained).toHaveBeenCalledWith('id', 'tx-id-123');
        });
    });

    // ── updateTransaction ─────────────────────────────────────────────────────

    describe('updateTransaction', () => {
        it('atualiza uma transação simples (mode=single) via Supabase', async () => {
            const mockEqChained = vi.fn().mockResolvedValue({ error: null });
            mockUpdate.mockReturnValue({ eq: mockEqChained });

            const { result } = renderHook(() => useTransactions());

            await act(async () => {
                await result.current.updateTransaction('tx-id-123', {
                    amount: 200,
                    description: 'Atualizado',
                    categoryId: 'cat-uuid-1',
                    accountId: 'acc-uuid-1',
                    type: 'despesa',
                    paymentStatus: 'paid',
                    date: '2024-05-15',
                });
            });

            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    amount: 200,
                    description: 'Atualizado',
                    payment_status: 'paid',
                    category_id: 'cat-uuid-1',
                })
            );
            expect(mockEqChained).toHaveBeenCalledWith('id', 'tx-id-123');
        });
    });

    // ── Tratamento de Erros ───────────────────────────────────────────────────

    describe('Tratamento de erros', () => {
        it('exibe alert de sem conexão para erros de rede (Failed to fetch)', async () => {
            // Mocka insert para lançar erro de rede
            mockInsert.mockRejectedValue(new Error('Failed to fetch'));
            const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

            const { result } = renderHook(() => useTransactions());

            await act(async () => {
                await result.current.addTransaction({
                    description: 'Teste',
                    amount: 10,
                    type: 'despesa',
                    date: '2024-01-01',
                    categoryId: 'cat-1',
                    accountId: 'acc-1',
                });
            });

            expect(alertSpy).toHaveBeenCalledWith(
                'Sem conexão com a internet. Verifique sua rede e tente novamente.'
            );
            alertSpy.mockRestore();
        });
    });
});
