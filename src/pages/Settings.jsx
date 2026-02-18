import { useState } from 'react';
import { useMasterData } from '../hooks/useMasterData';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTransactions } from '../hooks/useTransactions';
import { useDialog } from '../contexts/DialogContext';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Trash2, Plus, CreditCard, Wallet, Building2, Utensils, PiggyBank, Wrench, Download, Upload, RefreshCw, CloudUpload, Edit2, Save, X } from 'lucide-react';
import { migrateLocalData } from '../lib/migration';
import { resetCloudData } from '../lib/reset';
import { db } from '../db/db';

export default function Settings() {
    const { validateAndRepairTransactions } = useTransactions();
    const { categories, accounts, refreshData } = useMasterData();
    const { user } = useAuth();
    const { confirm, alert } = useDialog();

    // Local state for inputs
    const [newCatName, setNewCatName] = useState('');
    const [newCatType, setNewCatType] = useState('despesa');
    const [newAccName, setNewAccName] = useState('');
    const [newAccType, setNewAccType] = useState('bank');
    const [newAccLimit, setNewAccLimit] = useState('');

    // Edits state
    const [limitEdits, setLimitEdits] = useState({});
    const [catEdits, setCatEdits] = useState({}); // { id: 'New Name' }
    const [editingCatId, setEditingCatId] = useState(null); // Currently editing ID
    const [accEdits, setAccEdits] = useState({}); // { id: 'New Name' }
    const [editingAccId, setEditingAccId] = useState(null); // Currently editing ID

    // --- Actions ---

    // Categories
    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCatName.trim() || !user) return;

        try {
            const { error } = await supabase.from('categories').insert({
                user_id: user.id,
                name: newCatName,
                type: newCatType
            });
            if (error) throw error;
            setNewCatName('');
            await refreshData();
        } catch (err) {
            console.error(err);
            await alert('Erro ao criar categoria', 'Erro', 'error');
        }
    };

    const handleDeleteCategory = async (id) => {
        if (await confirm('Excluir esta categoria?')) {
            const { error } = await supabase.from('categories').delete().eq('id', id);
            if (error) await alert('Erro ao excluir: ' + error.message, 'Erro', 'error');
            else await refreshData();
        }
    };

    const startEditingCategory = (cat) => {
        setEditingCatId(cat.id);
        setCatEdits(prev => ({ ...prev, [cat.id]: cat.name }));
    };

    const cancelEditingCategory = () => {
        setEditingCatId(null);
    };

    const saveCategory = async (id) => {
        const newName = catEdits[id];
        if (!newName || !newName.trim()) return;

        try {
            const { error } = await supabase
                .from('categories')
                .update({ name: newName })
                .eq('id', id);

            if (error) throw error;

            setEditingCatId(null);
            await refreshData();
        } catch (err) {
            console.error(err);
            await alert('Erro ao atualizar categoria: ' + err.message, 'Erro', 'error');
        }
    };

    // Accounts
    const handleAddAccount = async (e) => {
        e.preventDefault();
        if (!newAccName.trim() || !user) return;

        try {
            const { error } = await supabase.from('accounts').insert({
                user_id: user.id,
                name: newAccName,
                type: newAccType,
                limit: newAccType === 'credit' ? parseFloat(newAccLimit || 0) : 0
            });
            if (error) throw error;
            setNewAccName('');
            setNewAccLimit('');
            await refreshData();
        } catch (err) {
            console.error(err);
            await alert('Erro ao criar conta', 'Erro', 'error');
        }
    };

    const startEditingAccount = (acc) => {
        setEditingAccId(acc.id);
        setAccEdits(prev => ({ ...prev, [acc.id]: acc.name }));
    };

    const cancelEditingAccount = () => {
        setEditingAccId(null);
    };

    const saveAccountName = async (id) => {
        const newName = accEdits[id];
        if (!newName || !newName.trim()) return;

        try {
            const { error } = await supabase
                .from('accounts')
                .update({ name: newName })
                .eq('id', id);

            if (error) throw error;

            setEditingAccId(null);
            await refreshData();
        } catch (err) {
            console.error(err);
            await alert('Erro ao atualizar conta: ' + err.message, 'Erro', 'error');
        }
    };

    const handleDeleteAccount = async (id, name) => {
        if (!await confirm(`Tem certeza que deseja excluir a conta "${name}"?`)) return;

        try {
            // Check for linked transactions
            const { count, error: countError } = await supabase
                .from('transactions')
                .select('*', { count: 'exact', head: true })
                .eq('account_id', id);

            if (countError) throw countError;

            if (count > 0) {
                await alert(`Não é possível excluir a conta "${name}".\n\nMotivo: Existem ${count} transações vinculadas a ela.\n\nVocê deve excluir ou reatribuir essas transações antes de apagar a conta.`, 'Ação Bloqueada', 'warning');
                return;
            }

            // Proceed with deletion
            const { error: deleteError } = await supabase
                .from('accounts')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            await alert('Conta excluída com sucesso!', 'Sucesso', 'success');
            await refreshData();
        } catch (err) {
            console.error(err);
            await alert('Erro ao excluir conta: ' + err.message, 'Erro', 'error');
        }
    };

    const handleLimitChange = (id, val) => {
        setLimitEdits(prev => ({ ...prev, [id]: val }));
    };

    const saveLimit = async (id) => {
        const val = limitEdits[id];
        if (val !== undefined) {
            const { error } = await supabase.from('accounts').update({ limit: parseFloat(val) }).eq('id', id);
            if (error) await alert('Erro ao atualizar: ' + error.message, 'Erro', 'error');
            else {
                const newEdits = { ...limitEdits };
                delete newEdits[id];
                setLimitEdits(newEdits);
                await refreshData();
            }
        }
    };

    // Maintenance
    const handleRepairTransactions = async () => {
        await alert('Esta função não é necessária na nuvem.', 'Info');
    };

    const handleExportData = async () => {
        // Export from Supabase
        await alert('Funcionalidade de exportação em desenvolvimento para versão Cloud.', 'Em Breve');
    };

    const handleImportData = async (e) => {
        await alert('Funcionalidade de importação em desenvolvimento para versão Cloud.', 'Em Breve');
    };

    const handleResetApp = async () => {
        if (await confirm('PERIGO: Isso irá APAGAR TODOS os seus dados. Esta ação é irreversível. Tem certeza?', 'Zona de Perigo')) {
            try {
                if (user.canSync) {
                    await resetCloudData();
                } else {
                    await db.categories.clear();
                    await db.accounts.clear();
                    await db.transactions.clear();
                }
                window.location.reload();
            } catch (err) {
                await alert('Erro ao resetar: ' + err.message, 'Erro', 'error');
            }
        }
    };

    const [migrating, setMigrating] = useState(false);

    const handleMigrateLocalData = async () => {
        const confirmed = await confirm(
            'Esta ação copiará todos os dados do seu navegador (versão antiga) para a nuvem. Isso pode criar duplicatas se você já fez isso antes. Deseja continuar?',
            'Migração de Dados'
        );

        if (!confirmed) return;

        setMigrating(true);
        try {
            const result = await migrateLocalData(user.id);
            await alert(
                `Migração concluída!\n\nCategorias: ${result.categories}\nContas: ${result.accounts}\nTransações: ${result.transactions}\nErros: ${result.errors.length}`,
                'Sucesso',
                'success'
            );

            if (result.errors.length > 0) {
                console.warn('Migration errors:', result.errors);
            }

            window.location.reload();
        } catch (err) {
            await alert('Erro crítico na migração: ' + err.message, 'Erro Fatal', 'error');
        } finally {
            setMigrating(false);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'credit': return <CreditCard size={18} className="text-purple-400" />;
            case 'ticket': return <Utensils size={18} className="text-orange-400" />;
            case 'bank': return <Building2 size={18} className="text-blue-400" />;
            case 'invest': return <PiggyBank size={18} className="text-yellow-400" />;
            default: return <Wallet size={18} className="text-emerald-400" />;
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Configurações</h1>
                    <p className="text-[var(--text-secondary)]">Gerencie suas categorias e contas</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Categories Section */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Categorias</h2>
                    <Card className="p-4">
                        <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
                            <div className="flex-1">
                                <Input
                                    placeholder="Nova categoria..."
                                    value={newCatName}
                                    onChange={e => setNewCatName(e.target.value)}
                                    required
                                />
                            </div>
                            <select
                                className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-2 text-sm focus:ring-2 focus:ring-[var(--primary)] outline-none"
                                value={newCatType}
                                onChange={e => setNewCatType(e.target.value)}
                            >
                                <option value="despesa">Despesa</option>
                                <option value="receita">Receita</option>
                            </select>
                            <Button type="submit" size="sm" title="Adicionar">
                                <Plus size={18} />
                            </Button>
                        </form>

                        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {categories?.map(cat => (
                                <div key={cat.id} className="flex justify-between items-center p-2 bg-[var(--bg-input)]/50 rounded-lg group hover:bg-[var(--bg-input)] transition-colors">
                                    <div className="flex items-center gap-2 flex-1">
                                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cat.type === 'receita' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>

                                        {/* Edit Mode */}
                                        {editingCatId === cat.id ? (
                                            <div className="flex items-center gap-2 flex-1 mr-2">
                                                <input
                                                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded px-2 py-1 text-sm focus:outline-none focus:border-[var(--primary)]"
                                                    value={catEdits[cat.id] || ''}
                                                    onChange={(e) => setCatEdits(prev => ({ ...prev, [cat.id]: e.target.value }))}
                                                    autoFocus
                                                />
                                                <button onClick={() => saveCategory(cat.id)} className="text-emerald-500 hover:text-emerald-400">
                                                    <Save size={16} />
                                                </button>
                                                <button onClick={cancelEditingCategory} className="text-red-500 hover:text-red-400">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="truncate">{cat.name}</span>
                                        )}
                                    </div>

                                    {editingCatId !== cat.id && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => startEditingCategory(cat)}
                                                className="text-[var(--text-muted)] hover:text-[var(--primary)] p-1"
                                                title="Editar"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCategory(cat.id)}
                                                className="text-[var(--text-muted)] hover:text-red-500 p-1"
                                                title="Excluir"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Accounts / Limits Section */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Contas</h2>
                    <Card className="p-4">
                        {/* Add Account Form */}
                        <form onSubmit={handleAddAccount} className="mb-6 p-4 bg-[var(--bg-input)]/30 rounded-lg border border-[var(--border-color)]">
                            <h3 className="text-sm font-medium mb-3">Nova Conta</h3>
                            <div className="space-y-3">
                                <Input
                                    placeholder="Nome da Conta"
                                    value={newAccName}
                                    onChange={e => setNewAccName(e.target.value)}
                                    required
                                />
                                <div className="flex gap-2">
                                    <select
                                        className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-2 py-2 text-sm flex-1 focus:ring-2 focus:ring-[var(--primary)] outline-none"
                                        value={newAccType}
                                        onChange={e => setNewAccType(e.target.value)}
                                    >
                                        <option value="bank">Conta Corrente</option>
                                        <option value="credit">Cartão de Crédito</option>
                                        <option value="ticket">Vale Alimentação</option>
                                        <option value="wallet">Carteira / Dinheiro</option>
                                        <option value="invest">Investimento</option>
                                    </select>
                                    {newAccType === 'credit' && (
                                        <Input
                                            type="number"
                                            placeholder="Limite"
                                            className="w-24"
                                            value={newAccLimit}
                                            onChange={e => setNewAccLimit(e.target.value)}
                                        />
                                    )}
                                </div>
                                <Button type="submit" size="sm" className="w-full">
                                    <Plus size={16} className="mr-1" /> Criar Conta
                                </Button>
                            </div>
                        </form>

                        <h3 className="text-sm font-medium mb-3 text-[var(--text-secondary)]">Gerenciar Contas Existentes</h3>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {accounts?.map(acc => (
                                <div key={acc.id} className="bg-[var(--bg-input)]/30 p-3 rounded-lg flex flex-col gap-2 border border-[var(--border-color)]/50 group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="bg-[var(--bg-card)] p-2 rounded-full border border-[var(--border-color)]">
                                                {getIcon(acc.type)}
                                            </div>

                                            {/* Edit Account Name Mode */}
                                            {editingAccId === acc.id ? (
                                                <div className="flex items-center gap-2 flex-1 mr-2">
                                                    <input
                                                        className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded px-2 py-1 text-sm focus:outline-none focus:border-[var(--primary)]"
                                                        value={accEdits[acc.id] || ''}
                                                        onChange={(e) => setAccEdits(prev => ({ ...prev, [acc.id]: e.target.value }))}
                                                        autoFocus
                                                    />
                                                    <button onClick={() => saveAccountName(acc.id)} className="text-emerald-500 hover:text-emerald-400">
                                                        <Save size={16} />
                                                    </button>
                                                    <button onClick={cancelEditingAccount} className="text-red-500 hover:text-red-400">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="font-medium text-sm">{acc.name}</p>
                                                    <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">{acc.type}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        {editingAccId !== acc.id && (
                                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => startEditingAccount(acc)}
                                                    className="text-[var(--text-muted)] hover:text-[var(--primary)] p-2"
                                                    title="Editar Nome"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteAccount(acc.id, acc.name)}
                                                    className="text-[var(--text-muted)] hover:text-red-500 p-2"
                                                    title="Excluir Conta"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {acc.type === 'credit' && (
                                        <div className="flex items-center justify-between gap-2 bg-[var(--bg-card)]/50 p-2 rounded text-sm">
                                            <span className="text-[var(--text-secondary)]">Limite:</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs">R$</span>
                                                <input
                                                    type="number"
                                                    className="w-20 bg-transparent border-b border-[var(--border-color)] focus:border-[var(--primary)] outline-none text-right font-medium"
                                                    value={limitEdits[acc.id] ?? acc.limit ?? ''}
                                                    onChange={e => handleLimitChange(acc.id, e.target.value)}
                                                />
                                                {(limitEdits[acc.id] !== undefined && limitEdits[acc.id] != acc.limit) && (
                                                    <Button size="xs" onClick={() => saveLimit(acc.id)}>Salvar</Button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
            {/* Maintenance Section */}
            <div className="space-y-4 md:col-span-2">
                <h2 className="text-xl font-semibold">Manutenção e Dados</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-4 flex flex-col gap-4">
                        <div>
                            <h3 className="font-medium text-lg flex items-center gap-2">
                                <Download size={20} className="text-blue-400" /> Backup e Restauração
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)] mt-1">
                                Salve seus dados em um arquivo ou restaure de um backup. Útil ao trocar de navegador ou computador.
                            </p>
                        </div>
                        <div className="flex gap-2 mt-auto">
                            <Button onClick={handleExportData} variant="secondary" className="flex-1">
                                <Download size={16} className="mr-2" />
                                Exportar
                            </Button>
                            <div className="relative flex-1">
                                <Button variant="secondary" className="w-full">
                                    <Upload size={16} className="mr-2" />
                                    Importar
                                </Button>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleImportData}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>
                    </Card>

                    {user?.canSync ? (
                        <Card className="p-4 flex flex-col gap-4 border-blue-500/20">
                            <div>
                                <h3 className="font-medium text-lg flex items-center gap-2 text-blue-400">
                                    <CloudUpload size={20} /> Migrar Dados Antigos
                                </h3>
                                <p className="text-sm text-[var(--text-secondary)] mt-1">
                                    Envia seus dados locais (offline) para sua conta na nuvem.
                                </p>
                            </div>
                            <Button onClick={handleMigrateLocalData} disabled={migrating} className="w-full justify-start bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/20">
                                <CloudUpload size={16} className="mr-2" />
                                {migrating ? 'Migrando...' : 'Sincronizar Dados Locais'}
                            </Button>
                        </Card>
                    ) : (
                        <Card className="p-4 flex flex-col gap-4 border-gray-500/20 opacity-60">
                            <div>
                                <h3 className="font-medium text-lg flex items-center gap-2 text-[var(--text-secondary)]">
                                    <CloudUpload size={20} /> Sincronização em Nuvem
                                </h3>
                                <p className="text-sm text-[var(--text-secondary)] mt-1">
                                    Recurso Premium. Sincronize seus dados e acesse de qualquer lugar.
                                </p>
                            </div>
                            <Button disabled variant="secondary" className="w-full justify-start cursor-not-allowed">
                                <CloudUpload size={16} className="mr-2" />
                                Disponível no Plano Premium
                            </Button>
                        </Card>
                    )}

                    <Card className="p-4 flex flex-col gap-4 border-red-500/20">
                        <div>
                            <h3 className="font-medium text-lg flex items-center gap-2 text-red-400">
                                <RefreshCw size={20} /> Zona de Perigo
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)] mt-1">
                                Ações destrutivas. Tenha cuidado.
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 mt-auto">
                            <Button onClick={handleRepairTransactions} variant="secondary" className="w-full justify-start">
                                <Wrench size={16} className="mr-2" />
                                Reparar Transações (Datas)
                            </Button>
                            <Button onClick={handleResetApp} className="w-full justify-start bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20">
                                <Trash2 size={16} className="mr-2" />
                                Resetar App (Apagar Tudo)
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
