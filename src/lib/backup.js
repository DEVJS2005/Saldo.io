import { supabase } from './supabase';

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export async function generateBackup(userId) {
    if (!userId) throw new Error('Usuário não autenticado.');

    const { data: categories } = await supabase.from('categories').select('*').eq('user_id', userId);
    const { data: accounts } = await supabase.from('accounts').select('*').eq('user_id', userId);
    const { data: transactions } = await supabase.from('transactions').select('*').eq('user_id', userId);
    const { data: budgets } = await supabase.from('budgets').select('*').eq('user_id', userId);

    const backupData = {
        version: '2.0',
        timestamp: new Date().toISOString(),
        categories: categories || [],
        accounts: accounts || [],
        transactions: transactions || [],
        budgets: budgets || []
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `saldo-backup-${new Date().toISOString().split('T')[0]}.json`);

    return backupData;
}

export async function exportTransactionsCSV(userId) {
    if (!userId) throw new Error('Usuário não autenticado.');

    const { data: tData } = await supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false });
    const { data: cData } = await supabase.from('categories').select('id, name').eq('user_id', userId);
    const { data: aData } = await supabase.from('accounts').select('id, name').eq('user_id', userId);

    const transactions = tData || [];
    const categories = cData || [];
    const accounts = aData || [];

    const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]));
    const accMap = Object.fromEntries(accounts.map(a => [a.id, a.name]));

    const csvRows = [
        ['Data', 'Descrição', 'Valor', 'Tipo', 'Categoria', 'Conta', 'Status', 'Recorrente', 'Parcela']
    ];

    transactions.forEach(t => {
        const date = t.date ? t.date.split('T')[0] : '';
        const desc = `"${(t.description || t.title || '').replace(/"/g, '""')}"`;
        const amount = t.amount;
        const type = t.type === 'receita' ? 'Receita' : 'Despesa';
        const cat = `"${catMap[t.category_id] || 'Desconhecida'}"`;
        const acc = `"${accMap[t.account_id] || 'Desconhecida'}"`;
        const status = t.payment_status || 'pending';
        const recurring = t.is_recurring ? 'Sim' : 'Não';
        const parcel = t.installment_number
            ? `${t.installment_number}/${t.total_installments}`
            : '-';

        csvRows.push([date, desc, amount, type, cat, acc, status, recurring, parcel]);
    });

    const csvString = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `saldo-transacoes-${new Date().toISOString().split('T')[0]}.csv`);
}

export async function restoreBackup(jsonData, userId) {
    if (!userId) throw new Error('Usuário não autenticado.');
    if (!jsonData || typeof jsonData !== 'object') throw new Error('Arquivo de backup inválido.');

    const { categories = [], accounts = [], transactions = [], budgets = [] } = jsonData;

    const mapItems = (items) => items.map(item => ({ ...item, user_id: userId }));

    if (categories.length > 0) await supabase.from('categories').upsert(mapItems(categories));
    if (accounts.length > 0) await supabase.from('accounts').upsert(mapItems(accounts));

    const mappedTx = mapItems(transactions);
    for (let i = 0; i < mappedTx.length; i += 100) {
        const chunk = mappedTx.slice(i, i + 100);
        await supabase.from('transactions').upsert(chunk);
    }

    if (budgets.length > 0) await supabase.from('budgets').upsert(mapItems(budgets));
}
