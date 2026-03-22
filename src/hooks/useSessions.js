import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

/**
 * Gera um hash SHA-256 de uma string (usado para o refresh_token).
 * O token bruto nunca é armazenado — apenas seu hash.
 */
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * useSessions
 *
 * Hook para gerenciamento de sessões de login rastreáveis e revogáveis.
 *
 * @example
 * const { sessions, revokeSession, revokeAllOtherSessions } = useSessions();
 */
export function useSessions() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Retorna o hash SHA-256 do refresh token da sessão atual.
     * Retorna null se não houver sessão ativa.
     */
    const getCurrentTokenHash = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.refresh_token) return null;
        return sha256(session.refresh_token);
    }, []);

    /**
     * Registra a sessão atual no banco após um login bem-sucedido.
     * Deve ser chamado logo após supabase.auth.signInWithPassword.
     *
     * @param {object} session - Objeto de sessão retornado pelo Supabase
     * @param {{ days?: number }} options - expiresInDays: duração em dias (padrão: 30)
     */
    const registerSession = useCallback(async (session, { days = 30 } = {}) => {
        if (!session?.refresh_token || !session?.user?.id) return;

        try {
            const tokenHash = await sha256(session.refresh_token);
            const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

            const deviceInfo = navigator.userAgent.substring(0, 255);

            await supabase.from('sessions').insert({
                user_id: session.user.id,
                token_hash: tokenHash,
                device_info: deviceInfo,
                expires_at: expiresAt,
            });
        } catch (err) {
            // Não bloqueia o login se o registro falhar
            console.warn('[useSessions] Falha ao registrar sessão:', err.message);
        }
    }, []);

    /**
     * Revoga a sessão atual no banco e faz signOut no Supabase.
     * @param {'local'|'global'} scope - 'local' revoga apenas esta sessão;
     *                                    'global' revoga todas as sessões do usuário.
     */
    const revokeCurrentSession = useCallback(async (scope = 'local') => {
        try {
            const tokenHash = await getCurrentTokenHash();

            if (tokenHash) {
                if (scope === 'global') {
                    // Revogar todas as sessões do usuário
                    await supabase
                        .from('sessions')
                        .update({ revoked_at: new Date().toISOString() })
                        .is('revoked_at', null);
                } else {
                    // Revogar apenas esta sessão
                    await supabase
                        .from('sessions')
                        .update({ revoked_at: new Date().toISOString() })
                        .eq('token_hash', tokenHash);
                }
            }
        } catch (err) {
            console.warn('[useSessions] Falha ao revogar sessão:', err.message);
            toast.error('Erro ao encerrar sessão: ' + err.message);
        } finally {
            await supabase.auth.signOut({ scope });
        }
    }, [getCurrentTokenHash]);

    /**
     * Revoga todas as outras sessões ativas (sem deslogar a atual).
     * Usa a RPC server-side para maior segurança.
     */
    const revokeAllOtherSessions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const tokenHash = await getCurrentTokenHash();
            if (!tokenHash) throw new Error('Sessão atual não encontrada.');

            const { data, error: rpcError } = await supabase
                .rpc('revoke_other_sessions', { current_token_hash: tokenHash });

            if (rpcError) throw rpcError;
            return data; // quantidade de sessões revogadas
        } catch (err) {
            console.error('[useSessions] revokeAllOtherSessions falhou:', err);
            setError(err.message);
            return 0;
        } finally {
            setLoading(false);
        }
    }, [getCurrentTokenHash]);

    /**
     * Revoga uma sessão específica por ID (somente sessões do próprio usuário via RLS).
     * @param {string} sessionId - ID da linha na tabela sessions
     */
    const revokeSession = useCallback(async (sessionId) => {
        setLoading(true);
        setError(null);
        try {
            const { error: rpcError } = await supabase
                .from('sessions')
                .update({ revoked_at: new Date().toISOString() })
                .eq('id', sessionId);

            if (rpcError) throw rpcError;
            setSessions(prev => prev.filter(s => s.id !== sessionId));
        } catch (err) {
            console.error('[useSessions] revokeSession falhou:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Busca todas as sessões ativas do usuário atual (exclui expiradas/revogadas).
     */
    const fetchActiveSessions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await supabase
                .from('sessions')
                .select('id, device_info, created_at, last_seen, expires_at')
                .is('revoked_at', null)
                .gt('expires_at', new Date().toISOString())
                .order('last_seen', { ascending: false });

            if (fetchError) throw fetchError;
            setSessions(data || []);
        } catch (err) {
            console.error('[useSessions] fetchActiveSessions falhou:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        sessions,
        loading,
        error,
        registerSession,
        revokeCurrentSession,
        revokeAllOtherSessions,
        revokeSession,
        fetchActiveSessions,
    };
}
