-- ============================================================
-- Tabela de Orçamentos (Budgets) por Categoria
-- Orçamentos são mensais: um limite por categoria por mês.
-- ============================================================

CREATE TABLE IF NOT EXISTS budgets (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id  UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  month_year   TEXT NOT NULL, -- Formato: 'YYYY-MM' ex: '2025-03'
  limit_amount NUMERIC(12,2) NOT NULL CHECK (limit_amount > 0),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),

  -- Um único orçamento por usuário/categoria/mês
  UNIQUE(user_id, category_id, month_year)
);

-- Índices para queries frequentes
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month_year);
CREATE INDEX IF NOT EXISTS idx_budgets_category   ON budgets(category_id);

-- Row Level Security
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Cada usuário gerencia apenas seus próprios orçamentos
CREATE POLICY "Users manage own budgets"
  ON budgets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_budgets_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS budgets_updated_at ON budgets;
CREATE TRIGGER budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_budgets_updated_at();
