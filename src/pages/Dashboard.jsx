import { useEffect, useMemo, useState } from 'react';
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
import { useMasterData } from '../hooks/useMasterData';
import { Link } from 'react-router-dom';

const ONBOARDING_GOAL_KEY = 'saldo_onboarding_goal';
const ACTIVATION_METRICS_KEY = 'saldo_activation_metrics';
const IN_APP_FEEDBACK_KEY = 'saldo_in_app_feedback';

const GOAL_OPTIONS = [
  'CLT com cartão: organizar mês sem sustos',
  'CLT com cartão: quitar dívidas e recuperar controle',
  'CLT com cartão: reservar 15% da renda'
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
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackScore, setFeedbackScore] = useState(8);
  const [feedbackSaved, setFeedbackSaved] = useState(false);

  const { income, expense, balanceProjected, balanceReal, transactions, accountBalances, loading, refresh } = useBudget(selectedDate);
  const { accounts } = useMasterData();

  const hasDashboardData = transactions.length > 0 || Object.keys(accountBalances || {}).length > 0;

  const objectiveLabel = localStorage.getItem(ONBOARDING_GOAL_KEY);
  const firstReportDone = localStorage.getItem('saldo_first_report_seen') === '1';

  const activationMetrics = useMemo(() => {
    const stored = JSON.parse(localStorage.getItem(ACTIVATION_METRICS_KEY) || '{}');
    return {
      signup: !!user?.id || !!stored.signup,
      firstAccount: Object.keys(accountBalances || {}).length > 0 || !!stored.firstAccount,
      firstTransaction: (transactions?.length || 0) > 0 || !!stored.firstTransaction,
      firstReport: firstReportDone || !!stored.firstReport
    };
  }, [user?.id, accountBalances, transactions?.length, firstReportDone]);

  useEffect(() => {
    const now = new Date().toISOString();
    const previous = JSON.parse(localStorage.getItem(ACTIVATION_METRICS_KEY) || '{}');
    const merged = {
      signup: previous.signup || activationMetrics.signup ? (previous.signup || now) : null,
      firstAccount: previous.firstAccount || activationMetrics.firstAccount ? (previous.firstAccount || now) : null,
      firstTransaction: previous.firstTransaction || activationMetrics.firstTransaction ? (previous.firstTransaction || now) : null,
      firstReport: previous.firstReport || activationMetrics.firstReport ? (previous.firstReport || now) : null
    };
    localStorage.setItem(ACTIVATION_METRICS_KEY, JSON.stringify(merged));
  }, [activationMetrics]);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const dueAlerts = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDate();
    return (accounts || [])
      .filter((acc) => acc.type === 'credit' && Number.isFinite(Number(acc.due_day)))
      .map((acc) => {
        const dueDay = Number(acc.due_day);
        const daysLeft = dueDay - currentDay;
        return {
          id: acc.id,
          name: acc.name,
          dueDay,
          daysLeft
        };
      })
      .filter((alert) => alert.daysLeft >= 0 && alert.daysLeft <= 7)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [accounts]);

  const monthlyRoutine = useMemo(() => {
    const hasMonthCloseTx = transactions.some((tx) => tx.description?.includes('Fechamento de Mês'));
    const pendingExpenses = transactions.filter((tx) => tx.type === 'despesa' && tx.payment_status === 'pending');
    return {
      hasMonthCloseTx,
      pendingCount: pendingExpenses.length
    };
  }, [transactions]);

  const smartSummary = useMemo(() => {
    if (!transactions.length) {
      return 'Comece lançando 3 transações para receber um resumo inteligente do mês.';
    }
    const delta = income - expense;
    if (delta >= 0) {
      return `Você está fechando positivo em ${formatCurrency(delta)}. Mantenha a disciplina nas despesas variáveis.`;
    }
    return `Atenção: seu mês está negativo em ${formatCurrency(Math.abs(delta))}. Priorize cortar gastos não essenciais nesta semana.`;
  }, [income, expense, transactions.length]);

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

      const now = new Date();
      const month = now.getMonth();
      const year = now.getFullYear();

      const sampleTransactions = [
        {
          user_id: user.id,
          type: 'receita',
          category_id: incomeCategory.id,
          account_id: createdBank.id,
          amount: 5200,
          description: 'Salário',
          payment_status: 'paid',
          date: toNoonISOString(new Date(year, month, 5)),
          month,
          year,
          is_recurring: false
        },
        {
          user_id: user.id,
          type: 'despesa',
          category_id: expenseCategory.id,
          account_id: createdBank.id,
          amount: 1650,
          description: 'Aluguel',
          payment_status: 'paid',
          date: toNoonISOString(new Date(year, month, 10)),
          month,
          year,
          is_recurring: false
        },
        {
          user_id: user.id,
          type: 'despesa',
          category_id: expenseCategory.id,
          account_id: createdCard.id,
          amount: 420,
          description: 'Supermercado',
          payment_status: 'pending',
          date: toNoonISOString(new Date(year, month, 12)),
          month,
          year,
          is_recurring: false
        },
        {
          user_id: user.id,
          type: 'despesa',
          category_id: expenseCategory.id,
          account_id: createdCard.id,
          amount: 180,
          description: 'Combustível',
          payment_status: 'pending',
          date: toNoonISOString(new Date(year, month, 16)),
          month,
          year,
          is_recurring: false
        }
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

  const handleSaveFeedback = async () => {
    const cleanMessage = feedbackText.trim();
    if (!cleanMessage) {
      window.alert('Escreva um feedback curto para enviar.');
      return;
    }

    const payload = {
      created_at: new Date().toISOString(),
      score: feedbackScore,
      message: cleanMessage,
      persona: goal || 'CLT com cartão'
    };

    const previous = JSON.parse(localStorage.getItem(IN_APP_FEEDBACK_KEY) || '[]');
    localStorage.setItem(IN_APP_FEEDBACK_KEY, JSON.stringify([payload, ...previous].slice(0, 20)));

    try {
      if (user?.id) {
        const { error } = await supabase.from('feedback').insert({
          user_id: user.id,
          score: feedbackScore,
          message: cleanMessage,
          context: 'dashboard_onboarding'
        });

        if (error) {
          console.error('Falha ao salvar feedback no Supabase:', error);
        }
      }
    } catch {
      // Mantém captação local se tabela remota não existir.
    }

    setFeedbackSaved(true);
    setFeedbackText('');
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

      <Card title="Métricas de ativação (Fase 2)">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <div className="p-3 rounded-lg border border-[var(--border-color)]">
            <p className="opacity-70">Cadastro</p>
            <p className="font-semibold">{activationMetrics.signup ? '✅ Concluído' : '⏳ Pendente'}</p>
          </div>
          <div className="p-3 rounded-lg border border-[var(--border-color)]">
            <p className="opacity-70">1ª Conta</p>
            <p className="font-semibold">{activationMetrics.firstAccount ? '✅ Concluído' : '⏳ Pendente'}</p>
          </div>
          <div className="p-3 rounded-lg border border-[var(--border-color)]">
            <p className="opacity-70">1ª Transação</p>
            <p className="font-semibold">{activationMetrics.firstTransaction ? '✅ Concluído' : '⏳ Pendente'}</p>
          </div>
          <div className="p-3 rounded-lg border border-[var(--border-color)]">
            <p className="opacity-70">1º Relatório</p>
            <p className="font-semibold">{activationMetrics.firstReport ? '✅ Concluído' : '⏳ Pendente'}</p>
          </div>
        </div>
      </Card>

      <Card title="Feedback rápido (dentro do app)">
        <p className="text-sm text-[var(--text-secondary)] mb-3">
          Estamos validando a proposta para a persona: <strong>{goal}</strong>.
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-xs uppercase tracking-wide opacity-70 font-semibold">Nota da experiência (0-10)</label>
            <input
              type="range"
              min={0}
              max={10}
              value={feedbackScore}
              onChange={(e) => setFeedbackScore(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xs opacity-70">Nota atual: {feedbackScore}</p>
          </div>
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            rows={3}
            className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm"
            placeholder="O que te ajudou e o que faltou no primeiro uso?"
          />
          <Button onClick={handleSaveFeedback}>Enviar feedback</Button>
          {feedbackSaved && <p className="text-xs text-[var(--success)]">Feedback salvo. Obrigado! 🙌</p>}
        </div>
      </Card>

      <Card title="Retenção (Fase 3)">
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2">🔔 Alertas de vencimento</h4>
            {dueAlerts.length === 0 ? (
              <p className="text-[var(--text-secondary)]">Nenhum vencimento de cartão nos próximos 7 dias.</p>
            ) : (
              <ul className="space-y-2">
                {dueAlerts.map((alert) => (
                  <li key={alert.id} className="p-2 rounded-lg border border-[var(--border-color)]">
                    {alert.name}: vence dia {alert.dueDay} ({alert.daysLeft === 0 ? 'hoje' : `em ${alert.daysLeft} dia(s)`})
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h4 className="font-semibold mb-2">🗓️ Rotina mensal automática</h4>
            <p className="text-[var(--text-secondary)]">
              {monthlyRoutine.hasMonthCloseTx
                ? 'Fechamento mensal já lançado. Próximo passo: revisar metas do mês.'
                : 'Fechamento mensal pendente. Recomendado: fechar o mês após revisar despesas pendentes.'}
            </p>
            {monthlyRoutine.pendingCount > 0 && (
              <p className="text-xs mt-1 opacity-80">
                Você ainda possui {monthlyRoutine.pendingCount} despesa(s) pendente(s) este mês.
              </p>
            )}
          </div>

          <div>
            <h4 className="font-semibold mb-2">🧠 Resumo inteligente</h4>
            <p className="text-[var(--text-secondary)]">{smartSummary}</p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">📅 Calendário integrado</h4>
            <p className="text-[var(--text-secondary)] mb-2">
              Exporte despesas para calendário (.ics) em Configurações para visualizar vencimentos na agenda.
            </p>
            <Link to="/settings" className="text-[var(--primary)] hover:underline text-sm font-medium">
              Ir para Configurações → Calendário
            </Link>
          </div>

          <div>
            <h4 className="font-semibold mb-2">📥 Importação facilitada</h4>
            <p className="text-[var(--text-secondary)] mb-2">
              Importe backup JSON e acelere a migração de outros apps para o Saldo.io.
            </p>
            <Link to="/settings" className="text-[var(--primary)] hover:underline text-sm font-medium">
              Ir para Configurações → Importar Backup
            </Link>
          </div>
        </div>
      </Card>

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
