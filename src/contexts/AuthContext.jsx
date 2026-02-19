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
        // Check active session
        const initSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const userWithRole = await fetchProfile(session.user);
                setUser(userWithRole);
            } else {
                setUser(null);
            }
            setLoading(false);
        };
        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT') {
                setUser(null);
                setLoading(false);
            } else if (session?.user) {
                const userWithRole = await fetchProfile(session.user);
                setUser(userWithRole);
                setLoading(false);
            } else {
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signUp = (email, password) => {
        return supabase.auth.signUp({ email, password });
    };

    const signIn = (email, password) => {
        return supabase.auth.signInWithPassword({ email, password });
    };

    const signOut = () => {
        return supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, signUp, signIn, signOut, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
