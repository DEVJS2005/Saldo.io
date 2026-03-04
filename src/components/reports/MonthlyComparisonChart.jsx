import { useMemo } from 'react';
import { Card } from '../ui/Card';
import { useMonthlyComparison } from '../../hooks/useMonthlyComparison';
import { Skeleton } from '../ui/Skeleton';
import {
    BarChart, Bar, Line, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid, Legend, ComposedChart
} from 'recharts';
import { useTranslation } from 'react-i18next';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(v);
const fmtFull = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 shadow-xl text-sm space-y-1 min-w-[170px]">
            <p className="font-semibold text-[var(--text-secondary)] mb-1">{label}</p>
            {payload.map(p => (
                <div key={p.dataKey} className="flex justify-between gap-3">
                    <span style={{ color: p.color }}>{p.name}</span>
                    <span className="font-mono">{fmtFull(p.value)}</span>
                </div>
            ))}
        </div>
    );
};

export const MonthlyComparisonChart = ({ selectedDate }) => {
    const { t } = useTranslation();
    const { data, loading } = useMonthlyComparison(selectedDate, 6);

    const summary = useMemo(() => {
        if (!data.length) return null;
        const best = data.reduce((a, b) => b.saldo > a.saldo ? b : a, data[0]);
        const worst = data.reduce((a, b) => b.saldo < a.saldo ? b : a, data[0]);
        const avg = data.reduce((s, d) => s + d.saldo, 0) / data.length;
        const trend = data.length >= 2 ? data[data.length - 1].saldo - data[0].saldo : 0;
        return { best, worst, avg, trend };
    }, [data]);

    if (loading) {
        return (
            <Card className="p-6">
                <Skeleton className="h-6 w-56 mb-4" />
                <Skeleton className="h-[300px] w-full" />
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <div className="mb-5">
                <h3 className="text-lg font-semibold">{t('reports.monthly_comparison_title', 'Comparativo Mensal (6 meses)')}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{t('reports.monthly_comparison_subtitle', 'Receitas vs Despesas e saldo do mês')}</p>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.3} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickFormatter={fmt} width={70} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }} />
                        <Bar name={t('common.income', 'Receitas')} dataKey="receita" fill="#10b981" radius={[3, 3, 0, 0]} barSize={20} />
                        <Bar name={t('common.expense', 'Despesas')} dataKey="despesa" fill="#ef4444" radius={[3, 3, 0, 0]} barSize={20} />
                        <Line name={t('reports.monthly_balance', 'Saldo do mês')} dataKey="saldo" type="monotone" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[var(--border-color)]">
                    <div className="text-center">
                        <p className="text-xs text-[var(--text-secondary)]">{t('reports.best_month', 'Melhor mês')}</p>
                        <p className="text-sm font-semibold text-emerald-500">{summary.best.name}</p>
                        <p className="text-xs font-mono text-emerald-500">{fmtFull(summary.best.saldo)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-[var(--text-secondary)]">{t('reports.worst_month', 'Pior mês')}</p>
                        <p className="text-sm font-semibold text-red-500">{summary.worst.name}</p>
                        <p className="text-xs font-mono text-red-500">{fmtFull(summary.worst.saldo)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-[var(--text-secondary)]">{t('reports.average_balance', 'Saldo médio')}</p>
                        <p className={`text-sm font-semibold ${summary.avg >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{fmtFull(summary.avg)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-[var(--text-secondary)]">{t('reports.trend', 'Tendência')}</p>
                        <p className={`text-sm font-semibold ${summary.trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {summary.trend >= 0 ? '↗' : '↘'} {fmtFull(Math.abs(summary.trend))}
                        </p>
                    </div>
                </div>
            )}
        </Card>
    );
};
