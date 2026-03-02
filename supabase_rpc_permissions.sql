-- ============================================================
-- Funções RPC para Validação de Permissões no Backend
-- Chamadas via supabase.rpc() no frontend — nunca confie
-- apenas no estado client-side para decisões de acesso.
-- ============================================================

-- -----------------------------------------------------------
-- 1. check_user_permissions()
--    Retorna as permissões do usuário autenticado diretamente
--    da tabela profiles no banco. Imune a manipulação de
--    localStorage ou estado React.
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION check_user_permissions()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER  -- Roda com privilégio do dono da função (não do chamador)
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
BEGIN
  -- auth.uid() é injetado pelo Supabase a partir do JWT — não pode ser forjado pelo cliente
  SELECT role, is_active, can_sync, can_upload_local_data
  INTO v_profile
  FROM profiles
  WHERE id = auth.uid();

  -- Usuário não encontrado ou não autenticado
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'is_authenticated', false,
      'role',             'user',
      'is_active',        false,
      'can_sync',         false,
      'can_upload_local_data', false
    );
  END IF;

  RETURN jsonb_build_object(
    'is_authenticated',       true,
    'role',                   COALESCE(v_profile.role, 'user'),
    'is_active',              COALESCE(v_profile.is_active, true),
    'can_sync',               COALESCE(v_profile.can_sync, false),
    'can_upload_local_data',  COALESCE(v_profile.can_upload_local_data, false)
  );
END;
$$;

-- Garante que apenas usuários autenticados possam chamar
REVOKE ALL ON FUNCTION check_user_permissions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_user_permissions() TO authenticated;


-- -----------------------------------------------------------
-- 2. check_admin_access()
--    Retorna true se o usuário autenticado é admin e está
--    ativo. Use para proteger rotas e ações de painel admin.
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION check_admin_access()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role     TEXT;
  v_is_active BOOLEAN;
BEGIN
  SELECT role, is_active
  INTO v_role, v_is_active
  FROM profiles
  WHERE id = auth.uid();

  RETURN FOUND AND v_role = 'admin' AND v_is_active = true;
END;
$$;

REVOKE ALL ON FUNCTION check_admin_access() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_admin_access() TO authenticated;


-- -----------------------------------------------------------
-- 3. check_sync_access()
--    Confirma se o usuário tem permissão de sincronização
--    com a nuvem (campo can_sync na tabela profiles).
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION check_sync_access()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_can_sync  BOOLEAN;
  v_is_active BOOLEAN;
BEGIN
  SELECT can_sync, is_active
  INTO v_can_sync, v_is_active
  FROM profiles
  WHERE id = auth.uid();

  RETURN FOUND AND v_can_sync = true AND v_is_active = true;
END;
$$;

REVOKE ALL ON FUNCTION check_sync_access() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_sync_access() TO authenticated;
