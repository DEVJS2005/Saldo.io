-- ============================================================
-- Tabela de Auditoria (Admin)
-- Append-only: registra toda ação realizada pelo painel admin.
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id        UUID        REFERENCES auth.users(id),
  action          TEXT        NOT NULL,
  target_user_id  UUID,
  metadata        JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins podem ler todos os logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- O INSERT é feito via service_role (backend/edge function), não via cliente.
-- NÃO criar policy de INSERT para usuários normais — a tabela é append-only
-- e só pode ser gravada por funções server-side com a service_role_key.

-- Nenhuma policy de UPDATE ou DELETE — a tabela é imutável por design.

-- ============================================================
-- Índices para performance em consultas do painel admin
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id       ON audit_logs (admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user_id ON audit_logs (target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at     ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action         ON audit_logs (action);
