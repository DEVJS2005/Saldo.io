import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext';
import { format } from 'date-fns';
import { Shield, Users, Calendar } from 'lucide-react';

export default function Admin() {
    const { user } = useAuth();
    const { confirm, alert } = useDialog();
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

    const toggleStatus = async (userId, currentStatus) => {
        if (userId === user.id) {
            await alert('Você não pode desativar sua própria conta.', 'Ação Bloqueada', 'warning');
            return;
        }

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_active: !currentStatus })
                .eq('id', userId);

            if (error) throw error;

            // Optimistic update
            setProfiles(profiles.map(p =>
                p.id === userId ? { ...p, is_active: !currentStatus } : p
            ));
        } catch (err) {
            console.error('Error updating status:', err);
            await alert('Falha ao atualizar status do usuário.', 'Erro', 'error');
        }
    };

    const toggleUploadPermission = async (userId, currentPermission) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ can_upload_local_data: !currentPermission })
                .eq('id', userId);

            if (error) throw error;

            // Optimistic update
            setProfiles(profiles.map(p =>
                p.id === userId ? { ...p, can_upload_local_data: !currentPermission } : p
            ));
        } catch (err) {
            console.error('Error updating permission:', err);
            await alert('Falha ao atualizar permissão de upload.', 'Erro', 'error');
        }
    };

    const toggleSyncPermission = async (userId, currentPermission) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ can_sync: !currentPermission })
                .eq('id', userId);

            if (error) throw error;

            // Optimistic update
            setProfiles(profiles.map(p =>
                p.id === userId ? { ...p, can_sync: !currentPermission } : p
            ));
        } catch (err) {
            console.error('Error updating sync permission:', err);
            await alert('Falha ao atualizar permissão de sync.', 'Erro', 'error');
        }
    };

    const toggleRole = async (userId, currentRole) => {
        console.log(`Attempting to toggle role for ${userId}. Current: ${currentRole}`);
        if (userId === user.id) {
            await alert('Você não pode alterar sua própria função.', 'Ação Bloqueada', 'warning');
            return;
        }

        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        console.log(`New role will be: ${newRole}`);

        if (newRole === 'user') {
            const confirmed = await confirm(
                'Tem certeza? Este usuário perderá acesso ao painel Admin.',
                'Rebaixar Administrador'
            );
            if (!confirmed) return;
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId)
                .select(); // Select to confirm update returned data

            if (error) {
                console.error('Supabase update error:', error);
                throw error;
            }

            console.log('Update success:', data);

            setProfiles(profiles.map(p =>
                p.id === userId ? { ...p, role: newRole } : p
            ));
        } catch (err) {
            console.error('Error updating role:', err);
            await alert(`Falha ao atualizar função: ${err.message}`, 'Erro', 'error');
        }
    };

    if (loading) return <div className="p-8 text-center text-[var(--text-secondary)]">Carregando painel...</div>;

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
                                <th className="p-4 font-medium text-[var(--text-secondary)]">Status</th>
                                <th className="p-4 font-medium text-[var(--text-secondary)]">Upload</th>
                                <th className="p-4 font-medium text-[var(--text-secondary)]">Sync (Premium)</th>
                                <th className="p-4 font-medium text-[var(--text-secondary)]">Função</th>
                                <th className="p-4 font-medium text-[var(--text-secondary)]">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {profiles.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-[var(--text-secondary)]">
                                        Nenhum perfil encontrado.
                                    </td>
                                </tr>
                            ) : (
                                profiles.map(profile => (
                                    <tr key={profile.id} className="hover:bg-[var(--bg-input)]/20 transition-colors">
                                        <td className="p-4 font-mono text-xs opacity-70" title={profile.id}>
                                            {profile.id.slice(0, 8)}...
                                        </td>
                                        <td className="p-4 font-medium">
                                            {profile.email}
                                            <div className="text-xs text-[var(--text-secondary)]">
                                                Criado em {format(new Date(profile.created_at), 'dd/MM/yyyy')}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${profile.is_active !== false
                                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                : 'bg-red-500/10 text-red-500 border-red-500/20'
                                                }`}>
                                                {profile.is_active !== false ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => toggleUploadPermission(profile.id, profile.can_upload_local_data)}
                                                title="Clique para alternar permissão de upload"
                                                className={`px-2 py-1 rounded-full text-xs font-medium border transition-colors ${profile.can_upload_local_data
                                                    ? 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20'
                                                    : 'bg-gray-500/10 text-gray-500 border-gray-500/20 hover:bg-gray-500/20'
                                                    }`}
                                            >
                                                {profile.can_upload_local_data ? 'Permitido' : 'Bloqueado'}
                                            </button>
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => toggleSyncPermission(profile.id, profile.can_sync)}
                                                title="Clique para alternar acesso à Nuvem (Premium)"
                                                className={`px-2 py-1 rounded-full text-xs font-medium border transition-colors ${profile.can_sync
                                                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'
                                                    : 'bg-gray-500/10 text-gray-500 border-gray-500/20 hover:bg-gray-500/20'
                                                    }`}
                                            >
                                                {profile.can_sync ? 'Premium (Cloud)' : 'Grátis (Local)'}
                                            </button>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${profile.role === 'admin'
                                                ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                                                : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                }`}>
                                                {profile.role}
                                            </span>
                                        </td>
                                        <td className="p-4 flex gap-2">
                                            {/* Role Toggle */}
                                            {profile.id !== user.id && (
                                                <button
                                                    onClick={() => toggleRole(profile.id, profile.role)}
                                                    className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${profile.role === 'admin'
                                                        ? 'border-purple-500/30 text-purple-500 hover:bg-purple-500/10'
                                                        : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-input)]'
                                                        }`}
                                                    title={profile.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                                                >
                                                    {profile.role === 'admin' ? '👎' : '👑'}
                                                </button>
                                            )}

                                            {/* Activate/Deactivate Toggle */}
                                            {profile.id !== user.id && (
                                                <button
                                                    onClick={() => toggleStatus(profile.id, profile.is_active !== false)}
                                                    className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${profile.is_active !== false
                                                        ? 'border-red-500/30 text-red-500 hover:bg-red-500/10'
                                                        : 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10'
                                                        }`}
                                                >
                                                    {profile.is_active !== false ? 'Desativar' : 'Ativar'}
                                                </button>
                                            )}
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
