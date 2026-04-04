import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[var(--bg-body)] text-[var(--text-primary)] p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Política de Privacidade — Saldo.io</h1>
        <p className="text-sm text-[var(--text-secondary)]">Última atualização: 04/04/2026</p>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">1) O que coletamos</h2>
          <p>Coletamos dados de cadastro (e-mail), dados financeiros inseridos por você e configurações necessárias para funcionamento do app.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">2) Como usamos seus dados</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Exibir dashboard, relatórios e controles financeiros.</li>
            <li>Permitir backup/restauração e sincronização quando habilitada.</li>
            <li>Melhorar o produto com métricas agregadas de ativação.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">3) O que não fazemos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Não vendemos dados pessoais.</li>
            <li>Não compartilhamos dados financeiros sem sua autorização.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">4) Seus direitos</h2>
          <p>Você pode exportar dados, restaurar backup, solicitar remoção e revogar acesso da conta.</p>
        </section>

        <div className="pt-4 border-t border-[var(--border-color)] text-sm">
          <Link to="/security" className="text-[var(--primary)] hover:underline">Ver página pública de segurança e arquitetura</Link>
        </div>
      </div>
    </div>
  );
}
