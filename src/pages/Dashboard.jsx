import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, WalletMinimal, CheckCircle, Sparkles } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { useBudget } from '../hooks/useBudget';
import { Charts } from '../components/dashboard/Charts';
import { AccountsList } from '../components/dashboard/AccountsList';
import { MonthYearSelector } from '../components/ui/MonthYearSelector';
import { CloseMonthModal } from '../components/dashboard/CloseMonthModal';
import { useDate } from '../contexts/DateContext';
import { Skeleton } from '../components/ui/Skeleton';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const ONBOARDING_GOAL_KEY = 'saldo_onboarding_goal';

const GOAL_OPTIONS = [
  'Quitar dívidas',
  'Economizar para emergência',
  'Organizar gastos do mês',
  'Juntar para uma viagem'
];

const toNoonISOString = (date) => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0)).toISOString();
};

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { selectedDate, setSelectedDate } = useDate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [closeMonthOpen, setCloseMonthOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);

  const [goal, setGoal] = useState(localStorage.getItem(ONBOARDING_GOAL_KEY) || GOAL_OPTIONS[0]);
  const [bankAccountName, setBankAccountName] = useState('Conta Principal');
  const [cardName, setCardName] = useState('Cartão Principal');

  const { income, expense, balanceProjected, balanceReal, transactions, accountBalances, loading, refresh } = useBudget(selectedDate);

  const hasDashboardData = transactions.length > 0 || Object.keys(accountBalances || {}).length > 0;

  const objectiveLabel = localStorage.getItem(ONBOARDING_GOAL_KEY);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleCreateDemoData = async () => {
    if (!user) return;
    if (!bankAccountName.trim() || !cardName.trim()) {
      window.alert('Informe o nome da conta e do cartão para continuar.');
      return;
    }

    try {
      setIsCreatingDemo(true);
      localStorage.setItem(ONBOARDING_GOAL_KEY, goal);

      const { data: existingCategories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name, type')
        .eq('user_id', user.id);

      if (categoriesError) throw categoriesError;

      const requiredCategories = [
        { name: 'Salário', type: 'receita' },
        { name: 'Alimentação', type: 'despesa' },
        { name: 'Moradia', type: 'despesa' },
        { name: 'Transporte', type: 'despesa' }
      ];

      const existingCatByKey = new Map((existingCategories || []).map((cat) => [`${cat.name}-${cat.type}`, cat]));
      const categoriesToInsert = requiredCategories.filter((cat) => !existingCatByKey.has(`${cat.name}-${cat.type}`));

      if (categoriesToInsert.length) {
        const { error: insertCategoriesError } = await supabase.from('categories').insert(
          categoriesToInsert.map((cat) => ({ ...cat, user_id: user.id }))
        );
        if (insertCategoriesError) throw insertCategoriesError;
      }

      const { data: allCategories, error: allCategoriesError } = await supabase
        .from('categories')
        .select('id, name, type')
        .eq('user_id', user.id);

      if (allCategoriesError) throw allCategoriesError;
      let createdBankId = null;
      let createdCardId = null;

      try {
        const { data: allCategories, error: allCategoriesError } = await supabase
          .from('categories')
          .select('id, name, type')
          .eq('user_id', user.id);

        if (allCategoriesError) throw allCategoriesError;

        const incomeCategory = allCategories.find((cat) => cat.type === 'receita');
        const expenseCategory = allCategories.find((cat) => cat.type === 'despesa');

        if (!incomeCategory || !expenseCategory) {
          throw new Error('Não foi possível preparar as categorias para o exemplo.');
        }

        const { data: createdBank, error: bankError } = await supabase
          .from('accounts')
          .insert({ user_id: user.id, name: bankAccountName.trim(), type: 'bank', limit: 0 })
          .select('id')
          .single();

        if (bankError) throw bankError;

        createdBankId = createdBank.id;

        const { data: createdCard, error: cardError } = await supabase
          .from('accounts')
          .insert({
            user_id: user.id,
            name: cardName.trim(),
            type: 'credit',
            limit: 3000,
            linked_account_id: createdBank.id,
            closing_day: 8,
            due_day: 15
          })
          .select('id')
          .single();

        if (cardError) throw cardError;

        createdCardId = createdCard.id;
      } catch (error) {
        if (createdCardId) {
          await supabase
            .from('accounts')
            .delete()
            .eq('id', createdCardId)
            .eq('user_id', user.id);
        }

        if (createdBankId) {
          await supabase
            .from('accounts')
            .delete()
            .eq('id', createdBankId)
            .eq('user_id', user.id);
        }

        throw error;
      }
      const now = new Date();
      const createSampleTransaction = (day, transaction) => {
        const transactionDate = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          day,
          12
        ));

        return {
          ...transaction,
          date: toNoonISOString(transactionDate),
          month: transactionDate.getUTCMonth(),
          year: transactionDate.getUTCFullYear(),
          is_recurring: false
        };
      };

      const sampleTransactions = [
        createSampleTransaction(5, {
          user_id: user.id,
          type: 'receita',
          category_id: incomeCategory.id,
          account_id: createdBank.id,
          amount: 5200,
          description: 'Salário',
          payment_status: 'paid'
        }),
        createSampleTransaction(10, {
          user_id: user.id,
          type: 'despesa',
          category_id: expenseCategory.id,
          account_id: createdBank.id,
          amount: 1650,
          description: 'Aluguel',
          payment_status: 'paid'
        }),
        createSampleTransaction(12, {
          user_id: user.id,
          type: 'despesa',
          category_id: expenseCategory.id,
          account_id: createdCard.id,
          amount: 420,
          description: 'Supermercado',
          payment_status: 'pending'
        }),
        createSampleTransaction(16, {
          user_id: user.id,
          type: 'despesa',
          category_id: expenseCategory.id,
          account_id: createdCard.id,
          amount: 180,
          description: 'Combustível',
          payment_status: 'pending'
        })
      ];

      const { error: txError } = await supabase.from('transactions').insert(sampleTransactions);
      if (txError) throw txError;

      await refresh();
      setSelectedDate(new Date());
      setOnboardingOpen(false);
    } catch (error) {
      console.error(error);
      window.alert('Não foi possível criar o dashboard de exemplo. Tente novamente.');
    } finally {
      setIsCreatingDemo(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            {t('dashboard.title', 'Dashboard')}
            <span className="bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-bold px-2 py-1 rounded-md border border-[var(--primary)]/20">BETA</span>
          </h1>
          <p className="text-[var(--text-secondary)]">{t('dashboard.overview', 'Visão geral das suas finanças')}</p>
          {objectiveLabel && (
            <p className="text-xs mt-2 inline-flex items-center gap-1 bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-1 rounded-full border border-[var(--primary)]/20">
              <Sparkles size={12} /> Objetivo: {objectiveLabel}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <MonthYearSelector selectedDate={selectedDate} onChange={setSelectedDate} />

          <div className="flex gap-2">
            {!hasDashboardData && (
              <Button onClick={() => setOnboardingOpen(true)} size="sm" variant="secondary" className="flex items-center">
                <Sparkles size={16} className="mr-1" /> Setup guiado
              </Button>
            )}
            {transactions.some(t => t.description.includes('Fechamento de Mês')) ? (
              <div className="flex items-center text-[var(--success)] bg-[var(--success)]/10 px-3 py-1.5 rounded-lg text-sm font-medium border border-[var(--success)]/20">
                <CheckCircle size={16} className="mr-2" />
                {t('dashboard.month_closed', 'Mês Fechado')}
              </div>
            ) : (
              <Button onClick={() => setCloseMonthOpen(true)} size="sm" variant="secondary" title={t('dashboard.reset_real_balance', 'Zerar Saldo Real')} className="flex items-center">
                <WalletMinimal size={18} className="mr-1" />
                {t('dashboard.close_month', 'Fechar Mês')}
              </Button>
            )}
            <Button onClick={() => setIsModalOpen(true)} size="sm" data-testid="btn-add-transaction" className="flex items-center">
              <Plus size={18} className="mr-1" />
              {t('common.new', 'Nova')}
            </Button>
          </div>
        </div>
      </div>

      {!loading && !hasDashboardData && (
        <Card title="Comece com dashboard pronto" className="border-dashed">
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Escolha um objetivo, cadastre 1 conta e 1 cartão, e lançamos transações de exemplo para você já visualizar o painel preenchido.
          </p>
          <Button onClick={() => setOnboardingOpen(true)}>
            Iniciar configuração guiada
          </Button>
        </Card>
      )}

      {
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-color)] space-y-3">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card title={t('dashboard.forecast')}>
              <div className={`text-3xl font-bold ${balanceProjected >= 0 ? 'text-[var(--text-primary)]' : 'text-[var(--danger)]'}`}>
                {formatCurrency(balanceProjected)}
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">{t('dashboard.forecast_desc')}</p>
            </Card>

            <Card title={t('dashboard.total_balance')}>
              <div className={`text-3xl font-bold ${balanceReal >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`} data-testid="balance-display">
                {formatCurrency(balanceReal)}
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">{t('dashboard.cash_in_hand')}</p>
            </Card>

            <Card title={t('dashboard.incomes', 'Receitas')}>
              <div className="text-2xl font-semibold text-[var(--primary)]">{formatCurrency(income)}</div>
            </Card>
            <Card title={t('dashboard.expenses', 'Despesas')}>
              <div className="text-2xl font-semibold text-[var(--danger)]">{formatCurrency(expense)}</div>
            </Card>
          </div>
        )
      }

      {
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-color)] h-[300px]">
                <Skeleton className="h-full w-full" />
              </div>
            </div>
            <div>
              <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-color)] h-[300px] space-y-4">
                <Skeleton className="h-6 w-1/2 mb-4" />
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {income + expense > 0 && (
                <div>
                  <Charts transactions={transactions} />
                </div>
              )}
            </div>
            <div>
              <div>
                <AccountsList transactions={transactions} globalBalances={accountBalances || {}} />
              </div>
            </div>
          </div>
        )
      }

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('dashboard.new_transaction_title', 'Nova Transação')}
      >
        <TransactionForm
          onClose={() => setIsModalOpen(false)}
          defaultDate={selectedDate}
          onSuccess={refresh}
        />
      </Modal>

      <Modal
        isOpen={closeMonthOpen}
        onClose={() => setCloseMonthOpen(false)}
        title={t('dashboard.close_month_modal_title', 'Fechar Mês / Zerar Saldo')}
      >
        <CloseMonthModal onClose={() => setCloseMonthOpen(false)} selectedDate={selectedDate} />
      </Modal>

      <Modal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        title="Configuração guiada inicial"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wide opacity-70 font-semibold">Escolher objetivo</label>
            <select
              className="w-full mt-1 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            >
              {GOAL_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide opacity-70 font-semibold">Cadastrar 1 conta</label>
            <Input value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} placeholder="Ex.: Nubank Conta" />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide opacity-70 font-semibold">Cadastrar 1 cartão</label>
            <Input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Ex.: Cartão Nubank" />
          </div>

          <div className="rounded-lg border border-[var(--border-color)] p-3 text-xs text-[var(--text-secondary)] bg-[var(--bg-input)]/40">
            Vamos lançar transações de exemplo para mostrar o dashboard já preenchido.
          </div>

          <Button onClick={handleCreateDemoData} disabled={isCreatingDemo} className="w-full">
            {isCreatingDemo ? 'Criando...' : 'Concluir e preencher dashboard'}
          </Button>
        </div>
      </Modal>
    </div >
  );
}
