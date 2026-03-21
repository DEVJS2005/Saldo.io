import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

// ── Session helpers (standalone para evitar dependência circular com useSessions) ──

/** Gera hash SHA-256 de uma string (o refresh_token bruto nunca é armazenado). */
async function sha256(message) {
    try {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
        return null;
    }
}

/** Registra a sessão atual na tabela sessions. Falhas são silenciosas (não bloqueiam o login). */
async function registerSession(session, { days = 30 } = {}) {
    if (!session?.refresh_token || !session?.user?.id) return;
    try {
        const tokenHash = await sha256(session.refresh_token);
        if (!tokenHash) return;
        await supabase.from('sessions').insert({
            user_id: session.user.id,
            token_hash: tokenHash,
            device_info: navigator.userAgent.substring(0, 255),
            expires_at: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
        });
    } catch (err) {
        console.warn('[Auth] Falha ao registrar sessão:', err.message);
    }
}

/** Revoga a sessão atual no banco. Falhas são silenciosas (o signOut continua). */
async function revokeSession(scope = 'local') {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.refresh_token) {
            const tokenHash = await sha256(session.refresh_token);
            if (tokenHash) {
                if (scope === 'global') {
                    await supabase.from('sessions')
                        .update({ revoked_at: new Date().toISOString() })
                        .is('revoked_at', null);
                } else {
                    await supabase.from('sessions')
                        .update({ revoked_at: new Date().toISOString() })
                        .eq('token_hash', tokenHash);
                }
            }
        }
    } catch (err) {
        console.warn('[Auth] Falha ao revogar sessão no banco:', err.message);
    }
}

const AuthContext = createContext({});

// Timeout utility to prevent infinite hanging on mobile (network drop/backgrounding)
const withTimeout = (promise, ms = 10000) => {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Tempo limite excedido. Verifique sua conexão.')), ms);
        promise.then(
            res => { clearTimeout(timer); resolve(res); },
            err => { clearTimeout(timer); reject(err); }
        );
    });
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const userRef = useRef(null);

    useEffect(() => {
        userRef.current = user;
    }, [user]);

    const fetchProfile = async (sessionUser) => {
        if (!sessionUser) return null;
        try {
            const result = await withTimeout(
                supabase.from('profiles').select('role, is_active, can_sync').eq('id', sessionUser.id).single(),
                15000
            );

            const data = result.data;
            const error = result.error;

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile:', error);
            }

            // Check if user is active
            if (data && data.is_active === false) {
                await supabase.auth.signOut();
                alert('Sua conta está desativada. Entre em contato com o suporte.');
                return null;
            }

            // ⚠️ IMPORTANTE: user.role e user.canSync são usados apenas para
            // decisões de UX (ex: exibir ou ocultar botões). Para ações
            // sensíveis (ex: sync, painel admin, upload), use o hook
            // usePermissions() que valida via RPC no backend — não pode
            // ser manipulado pelo cliente.
            return {
                ...sessionUser,
                role: data?.role || 'user',
                canSync: data?.can_sync || false
            };
        } catch (err) {
            // Falhas de rede transitórias (background/foreground mobile, token refresh)
            // geram NetworkError ou timeout — não são erros críticos quando o perfil
            // já está carregado. Logamos apenas erros inesperados.
            const isNetworkError = err.message?.includes('NetworkError') ||
                err.message?.includes('Failed to fetch') ||
                err.message?.includes('Tempo limite excedido') ||
                err.message?.includes('Load failed');

            if (!isNetworkError) {
                console.error('Timeout or error fetching profile:', err);
            }

            // Se já temos o perfil carregado na sessão atual para este usuário,
            // mantemos as permissões atuais para evitar que ele caia para o modo
            // offline repentinamente por causa de uma falha temporária de rede em background.
            if (userRef.current && userRef.current.id === sessionUser.id) {
                return userRef.current;
            }

            // Segurança: em caso de timeout/offline inicial, mantemos o modo cloud (online-only).
            // O app não possui mais modo local — use usePermissions() para validação real.
            return {
                ...sessionUser,
                role: 'user',
                canSync: true
            };
        }
    };

    useEffect(() => {
        let isMounted = true;
        let currentUserId = null;
        let fallbackTimer = setTimeout(() => {
            if (isMounted) setLoading(false);
        }, 20000);

        // Check active session
        const initSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                currentUserId = session?.user?.id || null;

                if (session?.user) {
                    const userWithRole = await fetchProfile(session.user);
                    if (isMounted && currentUserId === session.user.id) {
                        setUser(userWithRole);
                    }
                } else {
                    if (isMounted) {
                        setUser(null);
                    }
                }
            } catch (err) {
                console.error("Error initializing session:", err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };
        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            currentUserId = session?.user?.id || null;

            if (event === 'SIGNED_OUT') {
                if (isMounted) {
                    setUser(null);
                    setLoading(false);
                }
            } else if (session?.user) {
                // Otimização: TOKEN_REFRESHED ocorre quando o app volta do background.
                // Se o mesmo usuário já está carregado, não precisamos re-buscar o perfil
                // (o perfil não muda em renovações de token). Isso evita a race condition
                // de CORS/NetworkError que ocorre quando a rede acabou de se restabelecer.
                if (event === 'TOKEN_REFRESHED' &&
                    userRef.current?.id === session.user.id) {
                    if (isMounted) setLoading(false);
                    return;
                }

                const userWithRole = await fetchProfile(session.user);
                if (isMounted && currentUserId === session.user.id) {
                    setUser(prev => {
                        if (prev?.id === userWithRole.id &&
                            prev?.role === userWithRole.role &&
                            prev?.canSync === userWithRole.canSync &&
                            prev?.email === userWithRole.email) {
                            return prev;
                        }
                        return userWithRole;
                    });
                    setLoading(false);
                }
            } else {
                if (isMounted) {
                    setLoading(false);
                }
            }
        });

        return () => {
            isMounted = false;
            clearTimeout(fallbackTimer);
            subscription.unsubscribe();
        };
    }, []);

    const signUp = (email, password) => {
        return supabase.auth.signUp({ email, password });
    };

    const signIn = async (email, password) => {
        const result = await supabase.auth.signInWithPassword({ email, password });
        // Registra sessão rastreável em background (não bloqueia o retorno)
        if (result.data?.session) {
            registerSession(result.data.session);
        }
        return result;
    };

    /**
     * @param {'local'|'global'} scope
     *   - 'local'  → revoga apenas esta sessão (padrão)
     *   - 'global' → revoga todas as sessões do usuário em todos os dispositivos
     */
    const signOut = async (scope = 'local') => {
        setUser(null);
        setLoading(false);
        await revokeSession(scope);
        const { error } = await supabase.auth.signOut({ scope });
        if (error) console.error('Error signing out:', error);
    };

    return (
        <AuthContext.Provider value={{ user, signUp, signIn, signOut, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
