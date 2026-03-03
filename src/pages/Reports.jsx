import { useDate } from '../contexts/DateContext';
import { useBudget } from '../hooks/useBudget';
import { MonthYearSelector } from '../components/ui/MonthYearSelector';
import { MonthlyComparisonChart } from '../components/reports/MonthlyComparisonChart';
import { FluxoMensalChart } from '../components/reports/FluxoMensalChart';
import { GastosPorCategoriaChart } from '../components/reports/GastosPorCategoriaChart';
import { BudgetProgress } from '../components/reports/BudgetProgress';
import { TrendingUp, BarChart2, Target } from 'lucide-react';

function SectionTitle({ icon: Icon, title, subtitle }) {
    return (
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20">
                <Icon size={18} className="text-[var(--primary)]" />
            </div>
            <div>
                <h2 className="text-lg font-bold">{title}</h2>
                {subtitle && <p className="text-xs text-[var(--text-secondary)]">{subtitle}</p>}
            </div>
        </div>
    );
}

export default function Reports() {
    const { selectedDate, setSelectedDate } = useDate();
    const { income, expense } = useBudget(selectedDate);

    const formatCurrency = (v) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Relatórios</h1>
                    <p className="text-[var(--text-secondary)]">Análise detalhada das suas finanças</p>
                </div>
                <MonthYearSelector selectedDate={selectedDate} onChange={setSelectedDate} />
            </div>

            {/* Resumo rápido do mês */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                    <p className="text-xs text-[var(--text-secondary)] mb-1">Receitas do mês</p>
                    <p className="text-xl font-bold text-emerald-500">{formatCurrency(income)}</p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                    <p className="text-xs text-[var(--text-secondary)] mb-1">Despesas do mês</p>
                    <p className="text-xl font-bold text-red-500">{formatCurrency(expense)}</p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] col-span-2 sm:col-span-1">
                    <p className="text-xs text-[var(--text-secondary)] mb-1">Saldo do mês</p>
                    <p className={`text-xl font-bold ${(income - expense) >= 0 ? 'text-[var(--primary)]' : 'text-red-500'}`}>
                        {formatCurrency(income - expense)}
                    </p>
                </div>
            </div>

            {/* ── Seção 1: Visão Geral do Mês ── */}
            <section>
                <SectionTitle icon={BarChart2} title="Visão Geral do Mês" subtitle="Distribuição de gastos por categoria" />
                <GastosPorCategoriaChart selectedDate={selectedDate} />
            </section>

            {/* ── Seção 2: Evolução Histórica ── */}
            <section>
                <SectionTitle icon={TrendingUp} title="Evolução Histórica" subtitle="Fluxo dos últimos 12 meses e comparativo semestral" />
                <div className="space-y-6">
                    <FluxoMensalChart selectedDate={selectedDate} />
                    <MonthlyComparisonChart selectedDate={selectedDate} />
                </div>
            </section>

            {/* ── Seção 3: Orçamentos ── */}
            <section>
                <SectionTitle icon={Target} title="Orçamentos" subtitle="Limites mensais de gastos por categoria" />
                <BudgetProgress selectedDate={selectedDate} />
            </section>
        </div>
    );
}
