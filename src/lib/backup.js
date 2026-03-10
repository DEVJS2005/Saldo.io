import { supabase } from './supabase';
import { db } from '../db/db';

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

export async function generateBackup(userId, canSync) {
    if (!userId) throw new Error('Usuário não autenticado.');
    
    const backupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        categories: [],
        accounts: [],
        transactions: [],
        budgets: []
    };

    if (canSync) {
        const { data: categories } = await supabase.from('categories').select('*').eq('user_id', userId);
        const { data: accounts } = await supabase.from('accounts').select('*').eq('user_id', userId);
        const { data: transactions } = await supabase.from('transactions').select('*').eq('user_id', userId);
        const { data: budgets } = await supabase.from('budgets').select('*').eq('user_id', userId);
        
        backupData.categories = categories || [];
        backupData.accounts = accounts || [];
        backupData.transactions = transactions || [];
        backupData.budgets = budgets || [];
    } else {
        backupData.categories = await db.categories.toArray();
        backupData.accounts = await db.accounts.toArray();
        backupData.transactions = await db.transactions.toArray();
        backupData.budgets = db.budgets ? await db.budgets.toArray() : [];
    }
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `saldo-backup-${new Date().toISOString().split('T')[0]}.json`);
    
    return backupData;
}

export async function exportTransactionsCSV(userId, canSync) {
    if (!userId) throw new Error('Usuário não autenticado.');
    
    let transactions = [];
    let categories = [];
    let accounts = [];

    if (canSync) {
        const { data: tData } = await supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false });
        const { data: cData } = await supabase.from('categories').select('id, name').eq('user_id', userId);
        const { data: aData } = await supabase.from('accounts').select('id, name').eq('user_id', userId);
        transactions = tData || [];
        categories = cData || [];
        accounts = aData || [];
    } else {
        transactions = await db.transactions.orderBy('date').reverse().toArray();
        categories = await db.categories.toArray();
        accounts = await db.accounts.toArray();
    }

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
        const cat = `"${catMap[t.category_id || t.categoryId] || 'Desconhecida'}"`;
        const acc = `"${accMap[t.account_id || t.accountId] || 'Desconhecida'}"`;
        const status = t.payment_status || t.paymentStatus || 'pending';
        const recurring = (t.is_recurring || t.isRecurring) ? 'Sim' : 'Não';
        const parcel = (t.installment_number || t.installmentNumber) 
            ? `${t.installment_number || t.installmentNumber}/${t.total_installments || t.totalInstallments}` 
            : '-';
            
        csvRows.push([date, desc, amount, type, cat, acc, status, recurring, parcel]);
    });

    const csvString = csvRows.map(row => row.join(',')).join('\n');
    // Prefix with BOM so Excel treats it as UTF-8
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `saldo-transacoes-${new Date().toISOString().split('T')[0]}.csv`);
}

export async function restoreBackup(jsonData, userId, canSync) {
    if (!userId) throw new Error('Usuário não autenticado.');
    if (!jsonData || typeof jsonData !== 'object') throw new Error('Arquivo de backup inválido.');
    
    const { categories = [], accounts = [], transactions = [], budgets = [] } = jsonData;
    
    const mapItems = (items) => items.map(item => {
        const copy = { ...item };
        if (canSync) {
            copy.user_id = userId; 
        } else {
            copy.userId = userId;
        }
        return copy;
    });

    if (canSync) {
        if (categories.length > 0) await supabase.from('categories').upsert(mapItems(categories));
        if (accounts.length > 0) await supabase.from('accounts').upsert(mapItems(accounts));
        
        const mappedTx = mapItems(transactions);
        for (let i = 0; i < mappedTx.length; i += 100) {
            const chunk = mappedTx.slice(i, i + 100);
            await supabase.from('transactions').upsert(chunk);
        }
        
        if (budgets.length > 0) await supabase.from('budgets').upsert(mapItems(budgets));
    } else {
        if (categories.length > 0) await db.categories.bulkPut(categories);
        if (accounts.length > 0) await db.accounts.bulkPut(accounts);
        if (transactions.length > 0) await db.transactions.bulkPut(transactions);
        if (budgets.length > 0 && db.budgets) await db.budgets.bulkPut(budgets);
    }
}
