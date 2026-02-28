import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

import { seedUserData } from '../lib/seeder';

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

    const fetchProfile = async (sessionUser) => {
        if (!sessionUser) return null;
        try {
            const result = await withTimeout(
                supabase.from('profiles').select('role, is_active, can_sync').eq('id', sessionUser.id).single(),
                8000
            );
            const data = result.data;
            const error = result.error;

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile:', error);
            }

            // Check if user is active
            if (data && data.is_active === false) {
                await withTimeout(supabase.auth.signOut(), 3000).catch(() => { });
                alert('Sua conta está desativada. Entre em contato com o suporte.');
                return null;
            }

            // Return user with role appended
            return {
                ...sessionUser,
                role: data?.role || 'user',
                canSync: data?.can_sync || false
            };
        } catch (err) {
            console.error('Timeout or error fetching profile:', err);
            return sessionUser;
        }
    };

    useEffect(() => {
        let isMounted = true;
        let currentUserId = null;
        let fallbackTimer = setTimeout(() => {
            if (isMounted) setLoading(false);
        }, 5000); // Increased slightly for mobile

        // Check active session
        const initSession = async () => {
            try {
                const { data: { session } } = await withTimeout(supabase.auth.getSession(), 8000);
                currentUserId = session?.user?.id || null;

                if (session?.user) {
                    const userWithRole = await fetchProfile(session.user);
                    if (isMounted) {
                        if (currentUserId === session.user.id) {
                            setUser(userWithRole);
                        }
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
                const userWithRole = await fetchProfile(session.user);
                if (isMounted) {
                    if (currentUserId === session.user.id) {
                        setUser(prev => {
                            if (prev?.id === userWithRole.id &&
                                prev?.role === userWithRole.role &&
                                prev?.canSync === userWithRole.canSync &&
                                prev?.email === userWithRole.email) {
                                return prev;
                            }
                            return userWithRole;
                        });
                    }
                    setLoading(false);
                }
            } else {
                if (isMounted) {
                    setUser(null);
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
        return withTimeout(supabase.auth.signUp({ email, password }));
    };

    const signIn = (email, password) => {
        return withTimeout(supabase.auth.signInWithPassword({ email, password }));
    };

    const signOut = async () => {
        setUser(null);
        setLoading(false);
        try {
            await withTimeout(supabase.auth.signOut(), 4000);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, signUp, signIn, signOut, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
