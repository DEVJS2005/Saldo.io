import {
    ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid, Legend, ReferenceLine
} from 'recharts';
import { Card } from '../ui/Card';
import { useMonthlyComparison } from '../../hooks/useMonthlyComparison';
import { Skeleton } from '../ui/Skeleton';
import { useTranslation } from 'react-i18next';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(v);
const fmtFull = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 shadow-xl text-sm space-y-1 min-w-[180px]">
            <p className="font-semibold text-[var(--text-secondary)] mb-2">{label}</p>
            {payload.map(p => (
                <div key={p.dataKey} className="flex justify-between gap-4">
                    <span style={{ color: p.color }}>{p.name}</span>
                    <span className="font-mono font-medium">{fmtFull(p.value)}</span>
                </div>
            ))}
        </div>
    );
};

export function FluxoMensalChart({ selectedDate }) {
    const { t } = useTranslation();
    const { data, loading } = useMonthlyComparison(selectedDate, 12);

    const totalReceita = data.reduce((s, d) => s + d.receita, 0);
    const totalDespesa = data.reduce((s, d) => s + d.despesa, 0);
    const saldoFinal = data.length ? data[data.length - 1].saldo_acumulado : 0;

    if (loading) {
        return (
            <Card className="p-6">
                <Skeleton className="h-6 w-48 mb-4" />
                <Skeleton className="h-[320px] w-full" />
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-semibold">{t('reports.monthly_flow_title', 'Fluxo Mensal (12 meses)')}</h3>
                    <p className="text-sm text-[var(--text-secondary)]">{t('reports.monthly_flow_subtitle', 'Receitas, despesas e saldo acumulado')}</p>
                </div>
                <div className="flex gap-4 text-right">
                    <div>
                        <p className="text-xs text-[var(--text-secondary)]">{t('reports.total_incomes', 'Total Receitas')}</p>
                        <p className="text-base font-bold text-emerald-500">{fmtFull(totalReceita)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-[var(--text-secondary)]">{t('reports.total_expenses', 'Total Despesas')}</p>
                        <p className="text-base font-bold text-red-500">{fmtFull(totalDespesa)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-[var(--text-secondary)]">{t('reports.accumulated_balance', 'Saldo Acumulado')}</p>
                        <p className={`text-base font-bold ${saldoFinal >= 0 ? 'text-[var(--primary)]' : 'text-red-500'}`}>{fmtFull(saldoFinal)}</p>
                    </div>
                </div>
            </div>

            <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.3} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickFormatter={fmt} width={70} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }} />
                        <ReferenceLine y={0} stroke="var(--border-color)" strokeDasharray="4 4" />
                        <Bar name={t('common.income', 'Receitas')} dataKey="receita" fill="#10b981" radius={[3, 3, 0, 0]} barSize={16} />
                        <Bar name={t('common.expense', 'Despesas')} dataKey="despesa" fill="#ef4444" radius={[3, 3, 0, 0]} barSize={16} />
                        <Line name={t('reports.accumulated_balance', 'Saldo Acumulado')} dataKey="saldo_acumulado" type="monotone" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--primary)' }} activeDot={{ r: 5 }} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
