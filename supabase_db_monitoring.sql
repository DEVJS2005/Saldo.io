-- ============================================================
-- Monitoramento de Banco de Dados (Admin)
-- Função RPC chamada pelo painel admin para exibir métricas
-- de tamanho, saúde e crescimento do banco de dados.
-- ============================================================

-- Drop necessário pois o tipo de retorno mudou (OR REPLACE não permite isso)
DROP FUNCTION IF EXISTS get_db_health_metrics();

CREATE OR REPLACE FUNCTION get_db_health_metrics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin      BOOLEAN;
  v_db_size_bytes BIGINT;
  v_db_size_text  TEXT;
  v_tables        JSONB;
  v_index_size    TEXT;
  v_status        TEXT;
  v_growth        JSONB;
  v_tx_last_30    BIGINT;
  v_tx_prev_30    BIGINT;
  v_growth_pct    NUMERIC;
BEGIN
  -- ① Apenas admins podem chamar esta função
  SELECT role = 'admin' AND is_active = true
  INTO v_is_admin
  FROM profiles
  WHERE id = auth.uid();

  IF NOT FOUND OR NOT v_is_admin THEN
    RAISE EXCEPTION 'Acesso negado: permissão de admin necessária.';
  END IF;

  -- ② Tamanho total do banco
  SELECT pg_database_size(current_database())
  INTO v_db_size_bytes;

  v_db_size_text := pg_size_pretty(v_db_size_bytes);

  -- ③ Status baseado no tamanho (limites para Supabase Free: 500 MB)
  v_status := CASE
    WHEN v_db_size_bytes < 400 * 1024 * 1024  THEN 'Saudável'     -- < 400 MB
    WHEN v_db_size_bytes < 480 * 1024 * 1024  THEN 'Atenção'      -- < 480 MB
    ELSE                                            'Crítico'       -- >= 480 MB
  END;

  -- ④ Tamanho e contagem de linhas por tabela principal
  SELECT jsonb_agg(
    jsonb_build_object(
      'table_name', t.table_name,
      'size',       pg_size_pretty(pg_total_relation_size(quote_ident(t.table_name))),
      'size_bytes', pg_total_relation_size(quote_ident(t.table_name)),
      'row_count',  (xpath('/row/c/text()',
                      query_to_xml(
                        format('SELECT COUNT(*) AS c FROM %I', t.table_name),
                        false, true, ''
                      )
                    ))[1]::TEXT::BIGINT
    )
    ORDER BY pg_total_relation_size(quote_ident(t.table_name)) DESC
  )
  INTO v_tables
  FROM (
    VALUES
      ('transactions'),
      ('profiles'),
      ('categories'),
      ('accounts'),
      ('audit_logs'),
      ('changelog'),
      ('app_settings')
  ) AS t(table_name)
  WHERE to_regclass(quote_ident(t.table_name)) IS NOT NULL;

  -- ⑤ Tamanho total dos índices
  SELECT pg_size_pretty(
    SUM(pg_indexes_size(quote_ident(t.table_name)))
  )
  INTO v_index_size
  FROM (
    VALUES ('transactions'), ('profiles'), ('categories'), ('accounts')
  ) AS t(table_name)
  WHERE to_regclass(quote_ident(t.table_name)) IS NOT NULL;

  -- ⑥ Taxa de crescimento: transações últimos 30 dias vs 30 anteriores
  SELECT COUNT(*) INTO v_tx_last_30
  FROM transactions
  WHERE created_at >= NOW() - INTERVAL '30 days';

  SELECT COUNT(*) INTO v_tx_prev_30
  FROM transactions
  WHERE created_at >= NOW() - INTERVAL '60 days'
    AND created_at <  NOW() - INTERVAL '30 days';

  v_growth_pct := CASE
    WHEN v_tx_prev_30 = 0 THEN NULL
    ELSE ROUND(((v_tx_last_30 - v_tx_prev_30)::NUMERIC / v_tx_prev_30) * 100, 1)
  END;

  v_growth := jsonb_build_object(
    'last_30_days',   v_tx_last_30,
    'prev_30_days',   v_tx_prev_30,
    'growth_percent', v_growth_pct
  );

  -- ⑦ Resultado final
  RETURN jsonb_build_object(
    'database_size',       v_db_size_text,
    'database_size_bytes', v_db_size_bytes,
    'status',              v_status,
    'index_size',          COALESCE(v_index_size, 'N/A'),
    'tables',              COALESCE(v_tables, '[]'::JSONB),
    'growth',              v_growth,
    'collected_at',        NOW()
  );
END;
$$;

-- Apenas usuários autenticados podem chamar (a função verifica admin internamente)
REVOKE ALL ON FUNCTION get_db_health_metrics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_db_health_metrics() TO authenticated;
