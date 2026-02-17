import { useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { useDate } from '../contexts/DateContext';
import { useBudget } from '../hooks/useBudget';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MonthYearSelector } from '../components/ui/MonthYearSelector';

export default function Reports() {
    const { selectedDate, setSelectedDate } = useDate();
    const { transactions } = useBudget(selectedDate);
    const accounts = useLiveQuery(() => db.accounts.toArray());

    const data = useMemo(() => {
        if (!transactions || !accounts) return [];

        // Map Account Name to Expense Total
        const expensesByAccount = {};

        // Initialize
        accounts.forEach(a => expensesByAccount[a.id] = { name: a.name, value: 0 });

        transactions.forEach(t => {
            if (t.type === 'despesa') {
                if (expensesByAccount[t.accountId]) {
                    expensesByAccount[t.accountId].value += Number(t.amount);
                }
            }
        });

        // Convert to Array and Filter Zeros
        return Object.values(expensesByAccount)
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value);

    }, [transactions, accounts]);

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Relatórios</h1>
                    <p className="text-[var(--text-secondary)]">Análise detalhada de suas finanças</p>
                </div>
                <MonthYearSelector selectedDate={selectedDate} onChange={setSelectedDate} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Gastos por Conta" className="min-h-[400px]">
                    {data.length > 0 ? (
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: 'var(--bg-input)', opacity: 0.5 }}
                                        contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-[var(--text-secondary)]">
                            Sem despesas neste período.
                        </div>
                    )}
                </Card>

                {/* Placeholder for future reports */}
                <Card title="Em breve" className="min-h-[400px] flex items-center justify-center opacity-50">
                    <p>Mais relatórios virão aqui...</p>
                </Card>
            </div>
        </div>
    );
}
