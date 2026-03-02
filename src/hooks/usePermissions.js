import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * usePermissions
 *
 * Hook para validação de permissões SEGURA via RPC no Supabase.
 *
 * ❌ NÃO faça: if (user.role === 'admin') { ... }
 *    → O estado client-side pode estar desatualizado ou ser manipulado.
 *
 * ✅ FAÇA: const { isAdmin } = await checkPermissions();
 *    → A validação roda no banco, usando auth.uid() do JWT.
 *
 * @example
 * const { checkPermissions, checkAdmin, checkSync, loading } = usePermissions();
 *
 * // Antes de uma ação sensível:
 * const permissions = await checkPermissions();
 * if (!permissions.can_sync) return toast.error('Sem permissão de sync');
 */
export function usePermissions() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Busca todas as permissões do usuário autenticado via RPC.
     * @returns {{ is_authenticated, role, is_active, can_sync, can_upload_local_data } | null}
     */
    const checkPermissions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: rpcError } = await supabase.rpc('check_user_permissions');
            if (rpcError) throw rpcError;
            return data;
        } catch (err) {
            console.error('[usePermissions] check_user_permissions falhou:', err);
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Verifica se o usuário autenticado tem acesso de admin.
     * @returns {boolean}
     */
    const checkAdmin = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: rpcError } = await supabase.rpc('check_admin_access');
            if (rpcError) throw rpcError;
            return data === true;
        } catch (err) {
            console.error('[usePermissions] check_admin_access falhou:', err);
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Verifica se o usuário tem permissão de sincronização com a nuvem.
     * @returns {boolean}
     */
    const checkSync = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: rpcError } = await supabase.rpc('check_sync_access');
            if (rpcError) throw rpcError;
            return data === true;
        } catch (err) {
            console.error('[usePermissions] check_sync_access falhou:', err);
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    return { checkPermissions, checkAdmin, checkSync, loading, error };
}
