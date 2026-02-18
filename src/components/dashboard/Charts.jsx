import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Card } from '../ui/Card';
import { useMasterData } from '../../hooks/useMasterData';
import { format } from 'date-fns';

const COLORS = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#6366f1', '#14b8a6'];

export const Charts = ({ transactions }) => {
    const { categories } = useMasterData();

    const categoryData = useMemo(() => {
        if (!transactions || !categories) return [];

        const expenses = transactions.filter(t => t.type === 'despesa');
        const grouped = expenses.reduce((acc, curr) => {
            const catName = categories.find(c => c.id === curr.categoryId)?.name || 'Outros';
            acc[catName] = (acc[catName] || 0) + Number(curr.amount);
            return acc;
        }, {});

        return Object.entries(grouped)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [transactions, categories]);

    const dailyData = useMemo(() => {
        if (!transactions) return [];

        // Group by day
        const grouped = transactions.reduce((acc, curr) => {
            const dateObj = new Date(curr.date);
            if (isNaN(dateObj.getTime())) return acc; // Skip invalid dates

            const day = format(dateObj, 'dd/MM');
            if (!acc[day]) acc[day] = { name: day, receita: 0, despesa: 0 };

            if (curr.type === 'receita') acc[day].receita += Number(curr.amount);
            else if (curr.type === 'despesa') acc[day].despesa += Number(curr.amount);

            return acc;
        }, {});

        // Sort by day (needs proper date sorting logic if crossing months, but within month is fine)
        // Actually, Object.values might not be sorted.
        // Better to init array of days in month? MVP: just sorting by date string works for same month days.
        return Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name));
    }, [transactions]);

    if (!transactions?.length) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card title="Despesas por Categoria">
                <div className="h-[300px] w-full">
                    {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">Sem despesas</div>
                    )}
                </div>
            </Card>

            <Card title="Fluxo Diário">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyData}>
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val}`} />
                            <Tooltip formatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                                contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                            />
                            <Legend />
                            <Bar dataKey="receita" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="despesa" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
};
