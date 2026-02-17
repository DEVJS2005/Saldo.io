import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { Shield, Users, Calendar } from 'lucide-react';

export default function Admin() {
    const { user } = useAuth();
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        setLoading(true);
        // Note: Standard users cannot see 'auth.users'. We rely on 'public.profiles' table.
        // Assuming RLS policy allows admins to read all profiles.
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            setError('Erro ao carregar usuários. Verifique se você é admin e o SQL foi executado.');
        } else {
            setProfiles(data || []);
        }
        setLoading(false);
    };

    if (loading) return <div className="p-8 text-center">Carregando painel administrativo...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Shield className="text-[var(--primary)]" /> Painel Admin
                    </h1>
                    <p className="text-[var(--text-secondary)]">Gestão de usuários e acessos</p>
                </div>
                <div className="bg-[var(--bg-card)] px-4 py-2 rounded-lg border border-[var(--border-color)]">
                    <span className="text-sm font-medium">Total Usuários: {profiles.length}</span>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 text-red-500 p-4 rounded-lg border border-red-500/20">
                    {error}
                </div>
            )}

            <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[var(--bg-input)]/30 border-b border-[var(--border-color)]">
                            <tr>
                                <th className="p-4 font-medium text-[var(--text-secondary)]">ID</th>
                                <th className="p-4 font-medium text-[var(--text-secondary)]">Email</th>
                                <th className="p-4 font-medium text-[var(--text-secondary)]">Função</th>
                                <th className="p-4 font-medium text-[var(--text-secondary)]">Criado em</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {profiles.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-[var(--text-secondary)]">
                                        Nenhum perfil encontrado. O trigger de 'profiles' foi criado?
                                    </td>
                                </tr>
                            ) : (
                                profiles.map(profile => (
                                    <tr key={profile.id} className="hover:bg-[var(--bg-input)]/20 transition-colors">
                                        <td className="p-4 font-mono text-xs opacity-70">{profile.id.slice(0, 8)}...</td>
                                        <td className="p-4 font-medium">{profile.email}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${profile.role === 'admin'
                                                    ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                                                    : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                }`}>
                                                {profile.role}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-[var(--text-secondary)]">
                                            {format(new Date(profile.created_at), 'dd/MM/yyyy HH:mm')}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
