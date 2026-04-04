import { Link } from 'react-router-dom';

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-body)] text-[var(--text-primary)] p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Segurança e Arquitetura — Saldo.io</h1>
        <p className="text-sm text-[var(--text-secondary)]">Página pública de confiança e transparência.</p>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Segurança</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Autenticação via Supabase Auth.</li>
            <li>Isolamento por usuário com políticas RLS.</li>
            <li>Sessões com controle de acesso por rota.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Arquitetura resumida</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Frontend: React + Vite.</li>
            <li>Dados: Supabase (Postgres + RPC).</li>
            <li>Estado: TanStack Query + Context API.</li>
            <li>Exportação de calendário e backup para retenção e portabilidade.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Backup e restauração</h2>
          <p>No app, vá em <strong>Configurações → Manutenção e Dados</strong> para baixar backup completo (JSON) e restaurar com um clique.</p>
        </section>

        <div className="pt-4 border-t border-[var(--border-color)] text-sm flex gap-4">
          <Link to="/privacy" className="text-[var(--primary)] hover:underline">Política de Privacidade</Link>
          <Link to="/login" className="text-[var(--primary)] hover:underline">Entrar no app</Link>
        </div>
      </div>
    </div>
  );
}
