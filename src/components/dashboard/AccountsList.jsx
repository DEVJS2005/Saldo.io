import { useMemo } from 'react';
import { Card } from '../ui/Card';
import { useMasterData } from '../../hooks/useMasterData';
import { Wallet, CreditCard, Building2, Utensils, PiggyBank } from 'lucide-react';

export const AccountsList = ({ transactions, globalBalances }) => {
    const { accounts } = useMasterData();

    // Calculate Monthly Balances (Specifically for Credit Cards "Invoice")
    const monthlyBalances = useMemo(() => {
        if (!transactions) return {};
        const balances = {};

        transactions.forEach(t => {
            const val = Number(t.amount);
            if (!balances[t.accountId]) balances[t.accountId] = 0;
            if (t.type === 'receita') balances[t.accountId] += val;
            else if (t.type === 'despesa') balances[t.accountId] -= val;
        });

        return balances;
    }, [transactions]);

    const getIcon = (type) => {
        switch (type) {
            case 'credit': return <CreditCard size={20} className="text-purple-500" />;
            case 'ticket': return <Utensils size={20} className="text-orange-500" />;
            case 'bank': return <Building2 size={20} className="text-blue-500" />;
            case 'invest': return <PiggyBank size={20} className="text-yellow-500" />;
            default: return <Wallet size={20} className="text-emerald-500" />;
        }
    };

    if (!accounts) return null;

    return (
        <Card title="Resumo por Conta (Mês)">
            <div className="space-y-4">
                {accounts.map(acc => {
                    const isCredit = acc.type === 'credit';

                    // For Credit: Use Monthly Balance (Invoice Projection)
                    // For Others: Use Global Real Balance
                    const rawBalance = isCredit
                        ? (monthlyBalances[acc.id] || 0)
                        : (globalBalances[acc.id] || 0);

                    const displayBalance = isCredit ? Math.abs(rawBalance) : rawBalance;

                    const usagePercent = isCredit && acc.limit > 0
                        ? Math.min(displayBalance / acc.limit * 100, 100)
                        : 0;

                    return (
                        <div key={acc.id} className="p-2 rounded-lg hover:bg-[var(--bg-input)]/30 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-[var(--bg-input)] rounded-lg">
                                    {getIcon(acc.type)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-medium">{acc.name}</span>
                                        <div className="flex items-center gap-3">
                                            <span className={!isCredit && rawBalance >= 0 ? 'text-[var(--success)]' : isCredit ? 'text-[var(--text-primary)]' : 'text-[var(--danger)]'}>
                                                {isCredit ? 'Fatura: ' : ''}
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(displayBalance)}
                                            </span>
                                        </div>
                                    </div>
                                    {isCredit && (
                                        <div className="w-full bg-[var(--bg-input)] h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${usagePercent > 90 ? 'bg-red-500' : 'bg-purple-500'}`}
                                                style={{ width: `${usagePercent}%` }}
                                            />
                                        </div>
                                    )}
                                    {isCredit && (
                                        <div className="text-xs text-[var(--text-secondary)] mt-1 flex justify-between">
                                            <span>{usagePercent.toFixed(1)}% do limite</span>
                                            <span>Limite: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(acc.limit)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};
