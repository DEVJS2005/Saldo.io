import { useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Sparkles, Loader2, KeyRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getFinancialInsight } from '../../lib/ai';
import { useDialog } from '../../contexts/DialogContext';
import { Link } from 'react-router-dom';

export function AIFinancialInsight({ income, expense, categoriesData, monthName }) {
    const { t } = useTranslation();
    const { alert } = useDialog();
    const [insight, setInsight] = useState('');
    const [loading, setLoading] = useState(false);

    const provider = localStorage.getItem('saldo_ai_provider') || 'gemini';
    const apiKey = localStorage.getItem('saldo_ai_api_key') || '';

    const handleGenerate = async () => {
        if (!apiKey) {
            await alert('Por favor, configure sua chave de API nas Configurações primeiro.', 'Chave Ausente', 'attention');
            return;
        }

        setLoading(true);
        setInsight('');
        try {
            const result = await getFinancialInsight(provider, apiKey, {
                income,
                expense,
                balance: income - expense,
                categoriesData,
                monthName
            });
            setInsight(result);
        } catch (err) {
            await alert(err.message, 'Erro', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!apiKey) {
        return (
            <Card className="p-5 border border-[var(--primary)]/20 bg-gradient-to-br from-[var(--bg-card)] to-[var(--primary)]/5">
                <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-3 bg-[var(--primary)]/10 rounded-full text-[var(--primary)]">
                        <KeyRound size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-1">{t('reports.ai_unlock_title', 'Desbloqueie o Consultor Financeiro I.A.')}</h3>
                        <p className="text-sm text-[var(--text-secondary)]">
                            {t('reports.ai_unlock_desc', 'Adicione sua chave de API para obter análises automatizadas e dicas sobre seus gastos do mês.')}
                        </p>
                    </div>
                    <Link to="/settings" className="mt-2 text-sm font-semibold text-[var(--primary)] hover:underline flex items-center gap-1">
                        {t('reports.ai_go_to_settings', 'Ir para Configurações')} &rarr;
                    </Link>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-5 border border-[var(--primary)]/40 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Sparkles size={100} />
            </div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-[var(--primary)]/20 rounded-xl text-[var(--primary)]">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">{t('reports.ai_title', 'Análise Inteligente Mensal')}</h3>
                        <p className="text-xs text-[var(--text-secondary)] text-emerald-600 dark:text-emerald-400 font-medium tracking-wide uppercase">
                            {t('reports.ai_subtitle', 'Alimentado por')} {provider === 'gemini' ? 'Google Gemini' : 'OpenAI'}
                        </p>
                    </div>
                </div>

                {insight ? (
                    <div className="bg-[var(--bg-input)]/50 rounded-xl p-4 text-sm leading-relaxed text-[var(--text-primary)] border border-[var(--border-color)] prose dark:prose-invert max-w-none">
                        {insight.split('\n').map((line, i) => (
                            <p key={i} className="mb-2 last:mb-0">{line}</p>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-[var(--text-secondary)] mb-4">
                        {t('reports.ai_empty_state', 'Clique no botão abaixo para que seu Assistente Pessoal analise o fluxo de caixa, as categorias de gastos e gere dicas valiosas baseadas no mês selecionado.')}
                    </p>
                )}

                <div className="mt-4 flex justify-end">
                    <Button onClick={handleGenerate} disabled={loading} className="shadow-lg shadow-[var(--primary)]/20">
                        {loading ? (
                            <>
                                <Loader2 size={16} className="mr-2 animate-spin" />
                                {t('reports.ai_loading', 'Analisando Dados...')}
                            </>
                        ) : (
                            <>
                                <Sparkles size={16} className="mr-2" />
                                {insight ? t('reports.ai_regenerate', 'Gerar Nova Análise') : t('reports.ai_generate', 'Gerar Análise')}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </Card>
    );
}
