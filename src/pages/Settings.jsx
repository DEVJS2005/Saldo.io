import { useState } from 'react';
import { useMasterData } from '../hooks/useMasterData';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTransactions } from '../hooks/useTransactions';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Trash2, Plus, CreditCard, Wallet, Building2, Utensils, PiggyBank, Wrench, Download, Upload, RefreshCw, CloudUpload } from 'lucide-react';
import { migrateLocalData } from '../lib/migration';
import { resetCloudData } from '../lib/reset';


export default function Settings() {
    const { validateAndRepairTransactions } = useTransactions();
    const { categories, accounts } = useMasterData();
    const { user } = useAuth();

    // Local state for inputs
    const [newCatName, setNewCatName] = useState('');
    const [newCatType, setNewCatType] = useState('despesa');
    const [newAccName, setNewAccName] = useState('');
    const [newAccType, setNewAccType] = useState('bank');
    const [newAccLimit, setNewAccLimit] = useState('');
    const [limitEdits, setLimitEdits] = useState({});

    // --- Actions ---

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
        } catch (err) {
            console.error(err);
            alert('Erro ao criar categoria');
        }
    };

    const handleDeleteCategory = async (id) => {
        if (confirm('Excluir esta categoria?')) {
            const { error } = await supabase.from('categories').delete().eq('id', id);
            if (error) alert('Erro ao excluir: ' + error.message);
        }
    };

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
        } catch (err) {
            console.error(err);
            alert('Erro ao criar conta');
        }
    };

    const handleLimitChange = (id, val) => {
        setLimitEdits(prev => ({ ...prev, [id]: val }));
    };

    const saveLimit = async (id) => {
        const val = limitEdits[id];
        if (val !== undefined) {
            const { error } = await supabase.from('accounts').update({ limit: parseFloat(val) }).eq('id', id);
            if (error) alert('Erro ao atualizar: ' + error.message);
            else {
                const newEdits = { ...limitEdits };
                delete newEdits[id];
                setLimitEdits(newEdits);
                alert('Limite atualizado!');
            }
        }
    };

    const handleRepairTransactions = async () => {
        alert('Esta função não é necessária na nuvem.');
    };

    const handleExportData = async () => {
        // Export from Supabase
        alert('Funcionalidade de exportação em desenvolvimento para versão Cloud.');
    };

    const handleImportData = async (e) => {
        alert('Funcionalidade de importação em desenvolvimento para versão Cloud.');
    };

    const handleResetApp = async () => {
        if (confirm('PERIGO: Isso irá APAGAR TODOS os seus dados no servidor. Tem certeza?')) {
            try {
                await resetCloudData();
                window.location.reload();
            } catch (err) {
                alert('Erro ao resetar: ' + err.message);
            }
        }
    };

    const [migrating, setMigrating] = useState(false);

    const handleMigrateLocalData = async () => {
        if (!confirm('Esta ação copiará todos os dados do seu navegador (versão antiga) para a nuvem. Isso pode criar duplicatas se você já fez isso antes. Deseja continuar?')) return;

        setMigrating(true);
        try {
            const result = await migrateLocalData(user.id);
            alert(`Migração concluída!\n\nCategorias: ${result.categories}\nContas: ${result.accounts}\nTransações: ${result.transactions}\nErros: ${result.errors.length}\n\nDetalhes dos Erros:\n${result.errors.slice(0, 10).join('\n')}`);
            if (result.errors.length > 10) alert(`Foram mostrados os primeiros 10 erros de ${result.errors.length}. Verifique o console para mais detalhes.`);
            window.location.reload();
        } catch (err) {
            alert('Erro crítico na migração: ' + err.message);
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

    const handleDeleteAccount = async (id, name) => {
        if (!confirm(`Tem certeza que deseja excluir a conta "${name}"?`)) return;

        try {
            // Check for linked transactions
            const { count, error: countError } = await supabase
                .from('transactions')
                .select('*', { count: 'exact', head: true })
                .eq('account_id', id);

            if (countError) throw countError;

            if (count > 0) {
                alert(`Não é possível excluir a conta "${name}".\n\nMotivo: Existem ${count} transações vinculadas a ela.\n\nVocê deve excluir ou reatribuir essas transações antes de apagar a conta.`);
                return;
            }

            // Proceed with deletion
            const { error: deleteError } = await supabase
                .from('accounts')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            alert('Conta excluída com sucesso!');
        } catch (err) {
            console.error(err);
            alert('Erro ao excluir conta: ' + err.message);
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
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${cat.type === 'receita' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                                        <span>{cat.name}</span>
                                    </div>
                                    <button onClick={() => handleDeleteCategory(cat.id)} className="text-[var(--text-muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                        <Trash2 size={16} />
                                    </button>
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
                                        <div className="flex items-center gap-3">
                                            <div className="bg-[var(--bg-card)] p-2 rounded-full border border-[var(--border-color)]">
                                                {getIcon(acc.type)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{acc.name}</p>
                                                <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">{acc.type}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteAccount(acc.id, acc.name)}
                                            className="text-[var(--text-muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                                            title="Excluir Conta"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {acc.type === 'credit' && (
                                        <div className="flex items-center justify-between gap-2 bg-[var(--bg-card)]/50 p-2 rounded text-sm">
                                            <span className="text-[var(--text-secondary)]">Limite:</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs">R$</span>
                                                <input
                                                    type="number"
                                                    className="w-20 bg-transparent border-b border-[var(--border-color)] focus:border-[var(--primary)] outline-none text-right font-medium"
                                                    value={limitEdits[acc.id] ?? acc.limit}
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
