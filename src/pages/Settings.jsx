import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useTransactions } from '../hooks/useTransactions'; // Import hook
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Trash2, Plus, CreditCard, Wallet, Building2, Utensils, PiggyBank, Wrench } from 'lucide-react';

export default function Settings() {
    const { validateAndRepairTransactions } = useTransactions(); // Get function
    const categories = useLiveQuery(() => db.categories.toArray());
    const accounts = useLiveQuery(() => db.accounts.toArray());

    const [newCatName, setNewCatName] = useState('');
    const [newCatType, setNewCatType] = useState('despesa');

    // Account Creation State
    const [newAccName, setNewAccName] = useState('');
    const [newAccType, setNewAccType] = useState('bank');
    const [newAccLimit, setNewAccLimit] = useState('');

    // Account Limit Edits
    const [limitEdits, setLimitEdits] = useState({});

    // --- Actions ---

    const handleAddCategory = async (e) => {
        e.preventDefault();
        console.log("Submitting Category:", newCatName);
        if (!newCatName.trim()) return;

        try {
            await db.categories.add({ name: newCatName, type: newCatType });
            setNewCatName('');
        } catch (err) {
            console.error(err);
            alert('Erro ao criar categoria');
        }
    };

    const handleDeleteCategory = async (id) => {
        if (confirm('Excluir esta categoria? Transações antigas manterão o ID mas ficarão sem nome visual.')) {
            await db.categories.delete(id);
        }
    };

    const handleAddAccount = async (e) => {
        e.preventDefault();
        if (!newAccName.trim()) return;

        try {
            await db.accounts.add({
                name: newAccName,
                type: newAccType,
                limit: newAccType === 'credit' ? parseFloat(newAccLimit || 0) : 0
            });
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
            await db.accounts.update(id, { limit: parseFloat(val) });
            const newEdits = { ...limitEdits };
            delete newEdits[id];
            setLimitEdits(newEdits);
            alert('Limite atualizado!');
        }
    };

    const handleRepairTransactions = async () => {
        if (confirm('Isso irá verificar todas as transações em busca de datas inválidas e corrigi-las. Deseja continuar?')) {
            try {
                const result = await validateAndRepairTransactions();
                alert(result.message);
            } catch (err) {
                console.error(err);
                alert('Erro ao reparar: ' + err.message);
            }
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
            <div>
                <h1 className="text-3xl font-bold">Configurações</h1>
                <p className="text-[var(--text-secondary)]">Gerencie suas categorias e contas</p>
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
                                <div key={acc.id} className="bg-[var(--bg-input)]/30 p-3 rounded-lg flex flex-col gap-2 border border-[var(--border-color)]/50">
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
                {/* Maintenance Section */}
                <div className="space-y-4 md:col-span-2">
                    <h2 className="text-xl font-semibold">Manutenção</h2>
                    <Card className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <h3 className="font-medium text-lg">Reparar Transações</h3>
                            <p className="text-sm text-[var(--text-secondary)]">
                                Se alguma transação sumiu ou está com data incorreta, utilize esta ferramenta para corrigir o banco de dados.
                            </p>
                        </div>
                        <Button onClick={handleRepairTransactions} variant="secondary">
                            <Wrench size={18} className="mr-2" />
                            Verificar e Reparar
                        </Button>
                    </Card>
                </div>
            </div>
        </div>
    );
}
