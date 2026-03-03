import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext';
import { format } from 'date-fns';
import { Shield, Users, Calendar, Wrench, Bell, DollarSign, Activity, TrendingUp, Search, Key, Database } from 'lucide-react';

export default function Admin() {
    const { user } = useAuth();
    const { confirm, alert } = useDialog();
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [maintenance, setMaintenance] = useState({ active: false, message: '' });
    const [changelogForm, setChangelogForm] = useState({ title: '', content: '', type: 'feature' });
    const [submittingChangelog, setSubmittingChangelog] = useState(false);

    // New State for admin features
    const [metrics, setMetrics] = useState(null);
    const [dbHealth, setDbHealth] = useState(null);
    const [searchEmail, setSearchEmail] = useState('');

    useEffect(() => {
        fetchProfiles();
        fetchMaintenanceStatus();
        fetchMetrics();
        fetchDbHealth();
    }, []);

    const fetchDbHealth = async () => {
        try {
            const { data, error } = await supabase.rpc('get_db_health_metrics');
            if (error) throw error;
            setDbHealth(data);
        } catch (err) {
            console.error("Error fetching db health:", err);
        }
    };

    const fetchMetrics = async () => {
        try {
            const { data, error } = await supabase.rpc('get_admin_metrics');
            if (error) throw error;
            setMetrics(data);
        } catch (err) {
            console.error("Error fetching metrics:", err);
        }
    };

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

    const handlePasswordReset = async (email) => {
        const confirmed = await confirm(
            `Tem certeza que deseja forçar o reset de senha para ${email}? Um e-mail será enviado.`,
            'Forçar Reset'
        );
        if (!confirmed) return;

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) throw error;
            await alert(`E-mail de recuperação enviado para ${email}.`, 'Sucesso', 'success');
        } catch (err) {
            console.error('Error resetting password:', err);
            await alert('Erro ao solicitar reset de senha.', 'Erro', 'error');
        }
    };

    const filteredProfiles = profiles.filter(p =>
        p.email.toLowerCase().includes(searchEmail.toLowerCase())
    );

    const fetchMaintenanceStatus = async () => {
        try {
            const { data, error } = await supabase
                .from('app_settings')
                .select('value')
                .eq('id', 'maintenance_mode')
                .single();
            if (data && data.value) setMaintenance(data.value);
        } catch (err) {
            console.error("Error fetching maintenance status:", err);
        }
    };

    const toggleMaintenance = async () => {
        const confirmed = await confirm(
            `Tem certeza que deseja ${maintenance.active ? 'DESLIGAR' : 'LIGAR'} o modo manutenção?`,
            maintenance.active ? 'Sistema voltará ao ar' : 'O sistema será bloqueado'
        );
        if (!confirmed) return;

        const newValue = { ...maintenance, active: !maintenance.active };
        try {
            const { error } = await supabase
                .from('app_settings')
                .update({ value: newValue })
                .eq('id', 'maintenance_mode');

            if (error) throw error;
            setMaintenance(newValue);
            await alert(
                `O modo manutenção foi ${newValue.active ? 'ativado' : 'desativado'}.`,
                'Sucesso',
                'success'
            );
        } catch (err) {
            console.error('Error toggling maintenance:', err);
            await alert('Erro ao alterar o modo manutenção.', 'Erro', 'error');
        }
    };

    const handleUpdateMaintenanceMessage = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('app_settings')
                .update({ value: maintenance })
                .eq('id', 'maintenance_mode');

            if (error) throw error;
            await alert('Mensagem de manutenção atualizada.', 'Sucesso', 'success');
        } catch (err) {
            console.error('Error updating maintenance message:', err);
            await alert('Erro ao salvar a mensagem.', 'Erro', 'error');
        }
    };

    const publishChangelog = async (e) => {
        e.preventDefault();
        if (!changelogForm.title || !changelogForm.content) {
            return alert('Preencha o título e o conteúdo.', 'Atenção', 'warning');
        }

        setSubmittingChangelog(true);
        try {
            const { error } = await supabase
                .from('changelog')
                .insert([{
                    title: changelogForm.title,
                    content: changelogForm.content,
                    type: changelogForm.type,
                    created_by: user.id
                }]);

            if (error) throw error;

            setChangelogForm({ title: '', content: '', type: 'feature' });
            await alert('Novidade publicada com sucesso!', 'Sucesso', 'success');
        } catch (err) {
            console.error('Error publishing changelog:', err);
            await alert('Erro ao publicar novidade.', 'Erro', 'error');
        } finally {
            setSubmittingChangelog(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-[var(--text-secondary)]">Carregando painel...</div>;

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <div className="space-y-6">
            {/* Business Metrics Row */}
            {metrics && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6 border-l-4 border-[var(--primary)] text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">Saldo Movimentado (Plataforma)</p>
                                <h3 className="text-2xl font-bold">{formatCurrency(metrics.total_balance)}</h3>
                            </div>
                            <div className="bg-[var(--primary)]/10 p-3 rounded-full mt-4 sm:mt-0">
                                <DollarSign className="text-[var(--primary)]" size={24} />
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6 border-l-4 border-emerald-500 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">Usuários Ativos / Total</p>
                                <h3 className="text-2xl font-bold">{metrics.active_users} / {metrics.total_users}</h3>
                            </div>
                            <div className="bg-emerald-500/10 p-3 rounded-full mt-4 sm:mt-0">
                                <Activity className="text-emerald-500" size={24} />
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6 border-l-4 border-purple-500 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">Total de Transações</p>
                                <h3 className="text-2xl font-bold">{metrics.total_transactions}</h3>
                            </div>
                            <div className="bg-purple-500/10 p-3 rounded-full mt-4 sm:mt-0">
                                <TrendingUp className="text-purple-500" size={24} />
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Database Monitoring */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <Database className="text-[var(--primary)]" size={24} />
                        <h2 className="text-xl font-semibold">Monitoramento de Banco de Dados</h2>
                    </div>
                    <button
                        onClick={fetchDbHealth}
                        className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-input)] transition-colors flex items-center gap-1.5"
                        title="Atualizar métricas"
                    >
                        <Activity size={12} /> Atualizar
                    </button>
                </div>

                {!dbHealth ? (
                    <div className="text-center py-8 text-[var(--text-secondary)] text-sm">
                        <Database size={32} className="mx-auto mb-2 opacity-30" />
                        <p>Carregando métricas do banco...</p>
                        <p className="text-xs mt-1 opacity-60">Certifique-se de que a função <code>get_db_health_metrics()</code> foi executada no Supabase.</p>
                    </div>
                ) : (
                    <>
                        {/* Header: Tamanho + Status */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                            <div className="p-4 rounded-xl bg-[var(--bg-input)]/50 border border-[var(--border-color)]">
                                <p className="text-xs text-[var(--text-secondary)] mb-1">Tamanho Total</p>
                                <p className="text-xl font-bold">{dbHealth.database_size}</p>
                                <p className="text-xs text-[var(--text-secondary)] mt-0.5">de 500 MB (Free)</p>
                            </div>
                            <div className="p-4 rounded-xl bg-[var(--bg-input)]/50 border border-[var(--border-color)]">
                                <p className="text-xs text-[var(--text-secondary)] mb-1">Status</p>
                                <p className={`text-lg font-bold flex items-center gap-1.5 ${dbHealth.status === 'Saudável' ? 'text-emerald-500' :
                                        dbHealth.status === 'Atenção' ? 'text-amber-500' : 'text-red-500'
                                    }`}>
                                    <span className={`w-2.5 h-2.5 rounded-full ${dbHealth.status === 'Saudável' ? 'bg-emerald-500' :
                                            dbHealth.status === 'Atenção' ? 'bg-amber-500' : 'bg-red-500'
                                        }`} />
                                    {dbHealth.status}
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-[var(--bg-input)]/50 border border-[var(--border-color)]">
                                <p className="text-xs text-[var(--text-secondary)] mb-1">Índices</p>
                                <p className="text-xl font-bold">{dbHealth.index_size}</p>
                                <p className="text-xs text-[var(--text-secondary)] mt-0.5">tamanho total</p>
                            </div>
                            <div className="p-4 rounded-xl bg-[var(--bg-input)]/50 border border-[var(--border-color)]">
                                <p className="text-xs text-[var(--text-secondary)] mb-1">Crescimento (30d)</p>
                                {dbHealth.growth ? (
                                    <>
                                        <p className={`text-xl font-bold flex items-center gap-1 ${(dbHealth.growth.growth_percent ?? 0) > 10 ? 'text-amber-500' :
                                                (dbHealth.growth.growth_percent ?? 0) > 0 ? 'text-emerald-500' : 'text-[var(--text-secondary)]'
                                            }`}>
                                            {dbHealth.growth.growth_percent !== null
                                                ? `${dbHealth.growth.growth_percent > 0 ? '+' : ''}${dbHealth.growth.growth_percent}%`
                                                : '—'}
                                        </p>
                                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                            {dbHealth.growth.last_30_days} tx nos últimos 30d
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-xl font-bold text-[var(--text-secondary)]">—</p>
                                )}
                            </div>
                        </div>

                        {/* Barra de uso geral do banco */}
                        {dbHealth.database_size_bytes && (
                            <div className="mb-6">
                                <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1.5">
                                    <span>Uso do banco</span>
                                    <span>{Math.min(100, ((dbHealth.database_size_bytes / (500 * 1024 * 1024)) * 100)).toFixed(1)}% de 500 MB</span>
                                </div>
                                <div className="h-2.5 bg-[var(--bg-input)] rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${dbHealth.status === 'Saudável' ? 'bg-emerald-500' :
                                                dbHealth.status === 'Atenção' ? 'bg-amber-500' : 'bg-red-500'
                                            }`}
                                        style={{ width: `${Math.min(100, (dbHealth.database_size_bytes / (500 * 1024 * 1024)) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Tabelas */}
                        {dbHealth.tables && dbHealth.tables.length > 0 && (
                            <div>
                                <p className="text-sm font-medium mb-3 border-b border-[var(--border-color)] pb-2 text-[var(--text-secondary)]">
                                    Tamanho das Tabelas
                                </p>
                                <div className="space-y-3">
                                    {(() => {
                                        const maxBytes = Math.max(...dbHealth.tables.map(t => t.size_bytes || 0), 1);
                                        return dbHealth.tables.map(t => (
                                            <div key={t.table_name}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-sm font-medium capitalize">{t.table_name}</span>
                                                    <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                                                        <span>{(t.row_count ?? 0).toLocaleString('pt-BR')} linhas</span>
                                                        <span className="font-mono text-[var(--primary)] font-medium">{t.size}</span>
                                                    </div>
                                                </div>
                                                <div className="h-1.5 bg-[var(--bg-input)] rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-[var(--primary)]/60 rounded-full transition-all duration-500"
                                                        style={{ width: `${((t.size_bytes || 0) / maxBytes) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        )}

                        {/* Footer: timestamp */}
                        {dbHealth.collected_at && (
                            <p className="text-xs text-[var(--text-secondary)] text-right mt-4 opacity-50">
                                Coletado em {new Date(dbHealth.collected_at).toLocaleString('pt-BR')}
                            </p>
                        )}
                    </>
                )}
            </Card>


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Maintenance Toggle Card */}
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Wrench className="text-[var(--primary)]" size={24} />
                        <h2 className="text-xl font-semibold">Modo Manutenção</h2>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mb-4">
                        Bloqueia o acesso de usuários padrão. Apenas administradores poderão logar e navegar.
                    </p>
                    <div className="flex items-center gap-4 mb-4">
                        <button
                            onClick={toggleMaintenance}
                            className={`relative w-14 h-7 rounded-full transition-colors ${maintenance.active ? 'bg-amber-500' : 'bg-[var(--bg-input)]'}`}
                        >
                            <div className={`absolute top-1 bg-white w-5 h-5 rounded-full transition-transform ${maintenance.active ? 'left-8' : 'left-1'}`}></div>
                        </button>
                        <span className={`text-sm font-medium ${maintenance.active ? 'text-amber-500' : 'text-[var(--text-secondary)]'}`}>
                            {maintenance.active ? 'Ativado (Acesso Restrito)' : 'Desativado (Acesso Público)'}
                        </span>
                    </div>

                    <form onSubmit={handleUpdateMaintenanceMessage} className="mt-4 pt-4 border-t border-[var(--border-color)]">
                        <label className="block text-sm font-medium mb-2">Mensagem de Manutenção (Aparece para usuários)</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={maintenance.message}
                                onChange={e => setMaintenance({ ...maintenance, message: e.target.value })}
                                className="flex-1 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm focus:ring-[var(--primary)] outline-none"
                                placeholder="Voltaremos em breve..."
                            />
                            <button type="submit" className="px-3 py-2 bg-[var(--bg-input)] hover:bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm transition-colors text-[var(--text-secondary)]">
                                Salvar
                            </button>
                        </div>
                    </form>
                </Card>

                {/* Changelog Card */}
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Bell className="text-[var(--primary)]" size={24} />
                        <h2 className="text-xl font-semibold">Publicar Atualização</h2>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mb-4">
                        Publique notas de versão que aparecerão nas notificações dos usuários.
                    </p>

                    <form onSubmit={publishChangelog} className="space-y-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Título (Ex: Atualizei o Menu)"
                                    required
                                    value={changelogForm.title}
                                    onChange={e => setChangelogForm({ ...changelogForm, title: e.target.value })}
                                    className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm focus:ring-[var(--primary)] outline-none"
                                />
                            </div>
                            <select
                                value={changelogForm.type}
                                onChange={e => setChangelogForm({ ...changelogForm, type: e.target.value })}
                                className="w-full sm:w-32 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm focus:ring-[var(--primary)] outline-none"
                            >
                                <option value="feature">Novo</option>
                                <option value="fix">Correção</option>
                                <option value="maintenance">Aviso</option>
                            </select>
                        </div>
                        <textarea
                            placeholder="Descreva o que mudou na plataforma..."
                            required
                            rows="2"
                            value={changelogForm.content}
                            onChange={e => setChangelogForm({ ...changelogForm, content: e.target.value })}
                            className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm focus:ring-[var(--primary)] outline-none resize-y custom-scrollbar"
                        ></textarea>
                        <button
                            type="submit"
                            disabled={submittingChangelog}
                            className="w-full sm:w-auto px-4 py-2 bg-[var(--primary)] text-white font-medium rounded-lg text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
                        >
                            {submittingChangelog ? 'Publicando...' : 'Publicar Novidade'}
                        </button>
                    </form>
                </Card>
            </div>

            <div className="flex justify-between items-center mb-2">
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

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar usuário por email..."
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm focus:ring-[var(--primary)] outline-none"
                    />
                </div>
            </div>

            <Card className="p-0 overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
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
                            {filteredProfiles.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-[var(--text-secondary)]">
                                        Nenhum perfil encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredProfiles.map(profile => (
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
                                        <td className="p-4 flex gap-2 flex-wrap">
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
                                                    {profile.is_active !== false ? 'Dstv' : 'Ativ'}
                                                </button>
                                            )}

                                            {/* Force Password Reset */}
                                            <button
                                                onClick={() => handlePasswordReset(profile.email)}
                                                className="text-xs px-3 py-1.5 rounded-md border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 transition-colors"
                                                title="Forçar reset de senha"
                                            >
                                                <Key size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="sm:hidden divide-y divide-[var(--border-color)]">
                    {filteredProfiles.length === 0 ? (
                        <div className="p-8 text-center text-[var(--text-secondary)]">
                            Nenhum perfil encontrado.
                        </div>
                    ) : (
                        filteredProfiles.map(profile => (
                            <div key={profile.id} className="p-4 space-y-4 hover:bg-[var(--bg-input)]/20 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-medium text-[var(--text-primary)] break-all">{profile.email}</div>
                                        <div className="text-xs text-[var(--text-secondary)] font-mono mt-1">ID: {profile.id.slice(0, 8)}...</div>
                                        <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                                            Criado: {format(new Date(profile.created_at), 'dd/MM/yyyy')}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${profile.role === 'admin'
                                            ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                                            : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                            }`}>
                                            {profile.role}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${profile.is_active !== false
                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                                            }`}>
                                            {profile.is_active !== false ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <button
                                        onClick={() => toggleUploadPermission(profile.id, profile.can_upload_local_data)}
                                        className={`px-3 py-2 rounded-lg border text-center transition-colors ${profile.can_upload_local_data
                                            ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                            : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)]'
                                            }`}
                                    >
                                        {profile.can_upload_local_data ? 'Upload: ON' : 'Upload: OFF'}
                                    </button>
                                    <button
                                        onClick={() => toggleSyncPermission(profile.id, profile.can_sync)}
                                        className={`px-3 py-2 rounded-lg border text-center transition-colors ${profile.can_sync
                                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                            : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)]'
                                            }`}
                                    >
                                        {profile.can_sync ? 'Premium: ON' : 'Premium: OFF'}
                                    </button>
                                </div>

                                {profile.id !== user.id && (
                                    <div className="flex gap-2 pt-2 border-t border-[var(--border-color)] overflow-x-auto pb-1">
                                        <button
                                            onClick={() => toggleRole(profile.id, profile.role)}
                                            className="flex-shrink-0 px-3 py-2 text-xs rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-input)] text-[var(--text-secondary)] transition-colors"
                                        >
                                            {profile.role === 'admin' ? 'Retira Admin' : 'Dá Admin'}
                                        </button>
                                        <button
                                            onClick={() => toggleStatus(profile.id, profile.is_active !== false)}
                                            className={`flex-shrink-0 px-3 py-2 text-xs rounded-lg border transition-colors ${profile.is_active !== false
                                                ? 'border-red-500/30 text-red-500 hover:bg-red-500/10'
                                                : 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10'
                                                }`}
                                        >
                                            {profile.is_active !== false ? 'Bloquear' : 'Ativar'}
                                        </button>
                                        <button
                                            onClick={() => handlePasswordReset(profile.email)}
                                            className="flex-shrink-0 px-3 py-2 text-xs rounded-lg border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 transition-colors flex items-center justify-center gap-1"
                                            title="Forçar reset de senha"
                                        >
                                            <Key size={14} /> Reset
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
}
