import { supabase } from './supabase';

export async function getFinancialInsight(provider, apiKey_deprecated, monthData) {
    try {
        const { data, error } = await supabase.functions.invoke('ai-proxy', {
            body: { provider: provider || 'gemini', monthData }
        });

        if (error) {
           throw error;
        }

        if (data && data.error) {
           throw new Error(data.error);
        }

        if (!data || !data.insight) {
           throw new Error("Resposta inválida do servidor proxy da I.A.");
        }

        return data.insight;
    } catch (err) {
        console.error("AI Error:", err);
        throw new Error(`Ocorreu um erro ao consultar a I.A.: ${err.message || 'Desconhecido'}`);
    }
}
