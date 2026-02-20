import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { Card } from '../ui/Card';
import { useMonthlyComparison } from '../../hooks/useMonthlyComparison';
import Loading from '../ui/Loading';

export const MonthlyComparisonChart = ({ selectedDate }) => {
    const { data, loading } = useMonthlyComparison(selectedDate);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    if (loading) {
        return (
            <Card title="Comparativo Mensal" className="min-h-[400px] flex items-center justify-center">
                <Loading />
            </Card>
        );
    }

    return (
        <Card title="Comparativo Mensal (Receitas vs Despesas)" className="min-h-[400px]">
            <div className="h-[350px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.3} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                            tickFormatter={(val) => `R$ ${val}`}
                        />
                        <Tooltip
                            cursor={{ fill: 'var(--bg-input)', opacity: 0.5 }}
                            contentStyle={{
                                backgroundColor: 'var(--bg-card)',
                                borderColor: 'var(--border-color)',
                                borderRadius: '8px',
                                color: 'var(--text-primary)'
                            }}
                            formatter={(value) => [formatCurrency(value), '']}
                            labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px' }}
                        />
                        <Legend
                            verticalAlign="top"
                            align="right"
                            iconType="circle"
                            wrapperStyle={{ paddingBottom: '20px' }}
                        />
                        <Bar
                            name="Receitas"
                            dataKey="receita"
                            fill="#10b981"
                            radius={[4, 4, 0, 0]}
                            barSize={30}
                        />
                        <Bar
                            name="Despesas"
                            dataKey="despesa"
                            fill="#ef4444"
                            radius={[4, 4, 0, 0]}
                            barSize={30}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};
