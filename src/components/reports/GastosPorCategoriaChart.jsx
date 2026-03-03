import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '../ui/Card';
import { useBudget } from '../../hooks/useBudget';
import { useMasterData } from '../../hooks/useMasterData';
import { Skeleton } from '../ui/Skeleton';

const COLORS = ['#ef4444', '#f59e0b', '#8b5cf6', '#3b82f6', '#10b981', '#ec4899', '#14b8a6', '#f97316'];
const fmtFull = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const { name, value, percent } = payload[0];
    return (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 shadow-xl text-sm">
            <p className="font-semibold mb-1">{name}</p>
            <p className="font-mono">{fmtFull(value)}</p>
            <p className="text-[var(--text-secondary)] text-xs">{(percent * 100).toFixed(1)}% do total</p>
        </div>
    );
};

export function GastosPorCategoriaChart({ selectedDate }) {
    const { transactions, loading: loadingBudget } = useBudget(selectedDate);
    const { categories, loading: loadingCats } = useMasterData();

    const loading = loadingBudget || loadingCats;

    const data = useMemo(() => {
        if (!transactions || !categories) return [];
        const catMap = {};
        categories.forEach(c => { catMap[String(c.id)] = c.name; });

        const totals = {};
        transactions.forEach(t => {
            if (t.type !== 'despesa') return;
            const catId = String(t.categoryId || t.category_id || '');
            const name = catMap[catId] || 'Sem categoria';
            totals[name] = (totals[name] || 0) + Number(t.amount);
        });

        return Object.entries(totals)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8); // Top 8
    }, [transactions, categories]);

    const totalDespesa = data.reduce((s, d) => s + d.value, 0);

    if (loading) {
        return (
            <Card className="p-6">
                <Skeleton className="h-6 w-48 mb-4" />
                <Skeleton className="h-[280px] w-full" />
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <div className="mb-4">
                <h3 className="text-lg font-semibold">Gastos por Categoria</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                    Total: <span className="font-semibold text-red-500">{fmtFull(totalDespesa)}</span>
                </p>
            </div>

            {data.length === 0 ? (
                <div className="h-[280px] flex items-center justify-center text-[var(--text-secondary)] text-sm">
                    Sem despesas neste período.
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row items-center gap-4">
                    {/* Donut */}
                    <div className="w-full lg:w-[220px] h-[220px] flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                                    {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Lista */}
                    <div className="flex-1 w-full space-y-2">
                        {data.map((item, i) => (
                            <div key={item.name}>
                                <div className="flex justify-between items-center mb-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                        <span className="text-sm truncate max-w-[130px]">{item.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-mono font-medium">{fmtFull(item.value)}</span>
                                        <span className="text-xs text-[var(--text-secondary)] ml-2">{totalDespesa > 0 ? ((item.value / totalDespesa) * 100).toFixed(0) : 0}%</span>
                                    </div>
                                </div>
                                <div className="h-1 bg-[var(--bg-input)] rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${totalDespesa > 0 ? (item.value / totalDespesa) * 100 : 0}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
}
