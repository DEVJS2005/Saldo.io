import { useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import { useBudgetLimits } from '../../hooks/useBudgetLimits';
import { useBudget } from '../../hooks/useBudget';
import { useMasterData } from '../../hooks/useMasterData';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { Skeleton } from '../ui/Skeleton';
import { useTranslation } from 'react-i18next';

const fmtFull = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

function BudgetRow({ budget, spent, categoryName, onEdit, onDelete, t }) {
    const pct = budget.limitAmount > 0 ? Math.min(100, (spent / budget.limitAmount) * 100) : 0;
    const color = pct >= 100 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
    const textColor = pct >= 100 ? 'text-red-500' : pct >= 70 ? 'text-amber-500' : 'text-emerald-500';

    return (
        <div className="p-4 rounded-xl bg-[var(--bg-input)]/40 border border-[var(--border-color)] space-y-2">
            <div className="flex justify-between items-center">
                <span className="font-medium text-sm">{categoryName}</span>
                <div className="flex items-center gap-3">
                    <span className={`text-xs font-mono font-bold ${textColor}`}>{fmtFull(spent)} / {fmtFull(budget.limitAmount)}</span>
                    <button onClick={() => onEdit(budget)} className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors" title={t('common.edit', 'Editar')}>
                        <Pencil size={13} />
                    </button>
                    <button onClick={() => onDelete(budget.id)} className="text-[var(--text-secondary)] hover:text-red-500 transition-colors" title={t('common.remove', 'Remover')}>
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>
            <div className="h-2 bg-[var(--bg-input)] rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                <span>{pct.toFixed(0)}% {t('reports.used', 'utilizado')}</span>
                <span>{t('reports.remaining', 'Restante:')} {fmtFull(Math.max(0, budget.limitAmount - spent))}</span>
            </div>
        </div>
    );
}

function AddEditForm({ categories, usedCategoryIds, initial, onSave, onCancel, t }) {
    const [categoryId, setCategoryId] = useState(initial?.categoryId || '');
    const [amount, setAmount] = useState(initial?.limitAmount?.toString() || '');
    const [saving, setSaving] = useState(false);

    const availableCats = categories.filter(c =>
        c.type === 'despesa' && (!usedCategoryIds.has(String(c.id)) || String(c.id) === String(initial?.categoryId))
    );

    const handleSave = async () => {
        if (!categoryId || !amount || Number(amount) <= 0) return;
        setSaving(true);
        try { await onSave(categoryId, Number(amount)); }
        finally { setSaving(false); }
    };

    return (
        <div className="p-4 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 space-y-3">
            <p className="text-sm font-semibold">{initial ? t('reports.edit_budget', 'Editar Orçamento') : t('reports.new_budget', 'Novo Orçamento')}</p>
            <div className="flex flex-col sm:flex-row gap-2">
                {!initial && (
                    <select
                        value={categoryId}
                        onChange={e => setCategoryId(e.target.value)}
                        className="flex-1 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm outline-none"
                    >
                        <option value="">{t('reports.select_category', 'Selecione uma categoria...')}</option>
                        {availableCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                )}
                {initial && <p className="flex-1 text-sm py-2 font-medium">{initial.name}</p>}
                <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder={t('reports.limit', 'Limite (R$)')}
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full sm:w-36 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm outline-none"
                />
                <div className="flex gap-2">
                    <button onClick={handleSave} disabled={saving} className="px-3 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1">
                        <Check size={14} /> {saving ? '...' : t('common.save', 'Salvar')}
                    </button>
                    <button onClick={onCancel} className="px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm hover:bg-[var(--bg-input)] transition-colors">
                        <X size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export function BudgetProgress({ selectedDate }) {
    const { t } = useTranslation();
    const { budgets, loading: loadingBudgets, setBudgetLimit, deleteBudgetLimit } = useBudgetLimits(selectedDate);
    const { transactions, loading: loadingTx } = useBudget(selectedDate);
    const { categories, loading: loadingCats } = useMasterData();

    const [showAdd, setShowAdd] = useState(false);
    const [editing, setEditing] = useState(null);

    const loading = loadingBudgets || loadingTx || loadingCats;

    // Calcular gasto atual por categoria
    const spentByCategory = useMemo(() => {
        const map = {};
        (transactions || []).forEach(t => {
            if (t.type !== 'despesa') return;
            const cId = String(t.categoryId || t.category_id || '');
            map[cId] = (map[cId] || 0) + Number(t.amount);
        });
        return map;
    }, [transactions]);

    const catMap = useMemo(() => {
        const m = {};
        (categories || []).forEach(c => { m[String(c.id)] = c; });
        return m;
    }, [categories]);

    const usedCategoryIds = useMemo(() => new Set(budgets.map(b => String(b.categoryId))), [budgets]);

    const handleSave = async (categoryId, amount) => {
        await setBudgetLimit(categoryId, amount);
        setShowAdd(false);
        setEditing(null);
    };

    const handleDelete = async (id) => {
        await deleteBudgetLimit(id);
    };

    if (loading) {
        return (
            <Card className="p-6 space-y-3">
                <Skeleton className="h-6 w-40 mb-2" />
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="text-lg font-semibold">{t('reports.budgets_by_category', 'Orçamentos por Categoria')}</h3>
                    <p className="text-sm text-[var(--text-secondary)]">{t('reports.budgets_by_category_subtitle', 'Limites mensais de gastos')}</p>
                </div>
                {!showAdd && (
                    <button
                        onClick={() => setShowAdd(true)}
                        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 hover:bg-[var(--primary)]/20 transition-colors"
                    >
                        <Plus size={14} /> {t('common.new', 'Novo')}
                    </button>
                )}
            </div>

            {showAdd && (
                <div className="mb-4">
                    <AddEditForm
                        categories={categories}
                        usedCategoryIds={usedCategoryIds}
                        onSave={handleSave}
                        onCancel={() => setShowAdd(false)}
                        t={t}
                    />
                </div>
            )}

            {budgets.length === 0 && !showAdd ? (
                <div className="text-center py-10 text-[var(--text-secondary)] text-sm">
                    <p className="text-3xl mb-2">🎯</p>
                    <p className="font-medium">{t('reports.no_budgets', 'Nenhum orçamento definido')}</p>
                    <p className="text-xs mt-1 opacity-60">{t('reports.no_budgets_hint', 'Clique em "Novo" para definir um limite de gastos por categoria.')}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {budgets.map(budget => {
                        const cat = catMap[String(budget.categoryId)];
                        const spent = spentByCategory[String(budget.categoryId)] || 0;
                        if (editing?.id === budget.id) {
                            return (
                                <AddEditForm
                                    key={budget.id}
                                    categories={categories}
                                    usedCategoryIds={usedCategoryIds}
                                    initial={{ ...budget, name: cat?.name }}
                                    onSave={(_, amount) => handleSave(budget.categoryId, amount)}
                                    onCancel={() => setEditing(null)}
                                    t={t}
                                />
                            );
                        }
                        return (
                            <BudgetRow
                                key={budget.id}
                                budget={budget}
                                spent={spent}
                                categoryName={cat?.name || 'Categoria'}
                                onEdit={setEditing}
                                onDelete={handleDelete}
                                t={t}
                            />
                        );
                    })}
                </div>
            )}
        </Card>
    );
}
