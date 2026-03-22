import React, { useState } from 'react';
import { ShieldAlert, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function TermsModal() {
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const { user } = useAuth();

  const handleAccept = async () => {
    if (!agreed) return;
    setLoading(true);
    try {
      // Call RPC to accept terms
      const { error } = await supabase.rpc('accept_terms', { p_version: '1.0' });
      if (error) throw error;
      
      toast.success('Termos aceitos com sucesso! Redirecionando...');
      // Reload page to re-fetch AuthContext profiles state and unlock App
      setTimeout(() => window.location.reload(), 1500);
      
    } catch (err) {
      console.error(err);
      toast.error('Erro ao aceitar termos. Tente novamente.');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-[var(--bg-card)] max-w-lg w-full rounded-3xl border border-[var(--border-color)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-[var(--border-color)] bg-[var(--bg-card)]/50 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 ring-8 ring-blue-500/5">
            <ShieldAlert size={32} className="text-blue-500" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Atualização de Privacidade (LGPD)</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Olá 👋 Precisamos do seu consentimento para nossa nova Política de Privacidade antes de você continuar usando o Saldo.io.
          </p>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 text-sm text-[var(--text-secondary)] space-y-4">
          <p>
            Em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD)</strong>, atualizamos Nossos Termos e reiteramos nosso compromisso com sua privacidade:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Seus Dados:</strong> Coletamos apenas as métricas financeiras essenciais cadastradas ativamente por você para a gestão dos painéis.</li>
            <li><strong>Auditoria (Segurança):</strong> Ações destrutivas (exclusões de contas ou transações) são guardadas de forma segura e pseudonimizada na nossa trilha de auditoria para prevenções contra fraudes.</li>
            <li><strong>Direito ao Esquecimento:</strong> Você tem o poder de acessar o painel de <em>Ajustes</em> e apagar absolutamente toda a sua conta, removendo histórico, backups e metadados ao confirmar com "DELETAR TUDO".</li>
            <li><strong>Uso Interno:</strong> Nenhum dado financeiro sensível logado na plataforma é comercializado ou transmitido a terceiros para vias publicitárias.</li>
          </ul>
          <p className="pt-2 text-xs italic text-[var(--text-tertiary)] opacity-80">
            Versão do Acordo: v1.0 • Efeito O imediato
          </p>
        </div>

        <div className="p-6 border-t border-[var(--border-color)] bg-[var(--bg-body)] space-y-4">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-start pt-0.5">
               <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="peer sr-only"
              />
              <div className="w-5 h-5 rounded border-2 border-[var(--border-color)] peer-checked:bg-blue-500 peer-checked:border-blue-500 flex items-center justify-center transition-colors">
                <Check size={14} className="text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
              </div>
            </div>
            <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors select-none">
              Li e concordo com os Termos de Uso e entendo minhas restrições the exclusão e diretrizes the privacidade listadas acima.
            </span>
          </label>

          <div className="flex gap-3 pt-2">
             <button
              onClick={handleLogout}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl border border-[var(--border-color)] hover:bg-[var(--border-color)]/50 text-[var(--text-secondary)] disabled:opacity-50 transition-all font-medium"
            >
              Discordar & Sair
            </button>
            <button
              onClick={handleAccept}
              disabled={loading || !agreed}
              className="flex-1 px-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg shadow-blue-500/20"
            >
              {loading ? 'Confirmando...' : 'Aceitar Termos'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
