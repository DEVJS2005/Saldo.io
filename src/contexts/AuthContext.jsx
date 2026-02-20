import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

import { seedUserData } from '../lib/seeder';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (sessionUser) => {
        if (!sessionUser) return null;
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role, is_active, can_sync')
                .eq('id', sessionUser.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile:', error);
            }

            // Check if user is active
            if (data && data.is_active === false) {
                await supabase.auth.signOut();
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
            console.error(err);
            return sessionUser;
        }
    };

    useEffect(() => {
        let isMounted = true;
        let currentUserId = null;

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
            subscription.unsubscribe();
        };
    }, []);

    const signUp = (email, password) => {
        return supabase.auth.signUp({ email, password });
    };

    const signIn = (email, password) => {
        return supabase.auth.signInWithPassword({ email, password });
    };

    const signOut = async () => {
        setUser(null);
        setLoading(false);
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Error signing out:', error);
    };

    return (
        <AuthContext.Provider value={{ user, signUp, signIn, signOut, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
