import { useState, useEffect } from 'react';
import { useBudget } from '../../hooks/useBudget';
import { useTransactions } from '../../hooks/useTransactions';
import { useMasterData } from '../../hooks/useMasterData';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export const CloseMonthModal = ({ onClose, selectedDate }) => {
    const { accountBalances } = useBudget(selectedDate);
    const { addTransaction } = useTransactions();
    const { accounts, categories } = useMasterData();

    // State for selected accounts (Array of IDs)
    const [selectedAccounts, setSelectedAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Filter accounts that have non-zero balance
    const activeAccounts = accounts?.filter(acc => {
        const bal = accountBalances?.[acc.id] || 0;
        return Math.abs(bal) > 0.01;
    }) || [];

    // Auto-select all accounts with balance initially
    useEffect(() => {
        if (activeAccounts.length > 0 && selectedAccounts.length === 0) {
            setSelectedAccounts(activeAccounts.map(a => a.id));
        }
    }, [accounts, accountBalances]);

    const toggleAccount = (id) => {
        setSelectedAccounts(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleCloseMonth = async () => {
        if (selectedAccounts.length === 0) return;

        // Find a fallback category for adjustment
        // Try 'Ajustes', 'Outros', or just the first one.
        const adjustmentCategory = categories?.find(c => c.name === 'Ajustes' || c.name === 'Outros') || categories?.[0];

        if (!adjustmentCategory) {
            alert('Erro: Nenhuma categoria encontrada para lançar o ajuste. Crie uma categoria primeiro.');
            return;
        }

        setIsLoading(true);

        try {
            let processedCount = 0;

            for (const accountId of selectedAccounts) {
                const balance = accountBalances?.[accountId] || 0;
                if (Math.abs(balance) < 0.01) continue;

                const amount = Math.abs(balance);
                const isSurplus = balance > 0;
                const type = isSurplus ? 'despesa' : 'receita'; // Invert to zero out
                const description = `Fechamento de Mês - Ajuste de Saldo`;

                await addTransaction({
                    description,
                    amount,
                    date: new Date(), // Current date
                    type,
                    categoryId: adjustmentCategory.id,
                    accountId: accountId,
                    paymentStatus: 'paid', // Must be paid to affect real balance
                    installments: 1,
                    isRecurring: false
                });
                processedCount++;
            }

            onClose();
            alert(`Mês fechado! ${processedCount} contas zeradas com sucesso.`);
        } catch (err) {
            console.error(err);
            alert('Erro ao fechar mês');
        } finally {
            setIsLoading(false);
        }
    };

    if (activeAccounts.length === 0) {
        return (
            <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-6 text-center text-[var(--success)]">
                    <CheckCircle size={48} className="mb-2" />
                    <h3 className="text-xl font-bold">Tudo Zerado!</h3>
                    <p className="text-[var(--text-secondary)]">Todas as suas contas já estão com saldo zero.</p>
                </div>
                <Button onClick={onClose} className="w-full">Voltar</Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="bg-[var(--bg-input)]/50 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" />
                <div className="text-sm text-[var(--text-secondary)]">
                    <p className="font-medium text-[var(--text-primary)] mb-1">Selecione as contas para zerar</p>
                    Será criada uma transação de ajuste para cada conta selecionada, zerando seu saldo atual.
                </div>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {activeAccounts.map(acc => {
                    const balance = accountBalances?.[acc.id] || 0;
                    const isSelected = selectedAccounts.includes(acc.id);

                    return (
                        <div
                            key={acc.id}
                            onClick={() => toggleAccount(acc.id)}
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${isSelected
                                ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                                : 'border-[var(--border-color)] hover:bg-[var(--bg-input)]'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => { }} // Handled by div click
                                    className="accent-[var(--primary)] w-4 h-4 pointer-events-none"
                                />
                                <span className="font-medium">{acc.name}</span>
                            </div>
                            <span className={balance >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}>
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="flex gap-3 pt-2">
                <Button variant="ghost" className="flex-1" onClick={onClose}>Cancelar</Button>
                <Button
                    className="flex-1"
                    onClick={handleCloseMonth}
                    isLoading={isLoading}
                    disabled={selectedAccounts.length === 0}
                >
                    Zerar Selecionadas ({selectedAccounts.length})
                </Button>
            </div>
        </div>
    );
};
