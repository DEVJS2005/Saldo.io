export async function getFinancialInsight(provider, apiKey, monthData) {
    if (!apiKey) {
        throw new Error('Chave de API não configurada. Vá em Configurações > Inteligência Artificial e adicione sua chave.');
    }

    const {
        income,
        expense,
        balance,
        categoriesData,
        bestMonth,
        worstMonth,
        monthName
    } = monthData;

    // Remove any negative zero or strange formatting before sending
    const safeIncome = income || 0;
    const safeExpense = Math.abs(expense || 0);
    const safeBalance = balance || 0;

    // Formatting category data as simple text to reduce token usage
    const catText = categoriesData.map(c => `- ${c.name}: R$ ${c.value.toFixed(2)}`).join('\n');

    const prompt = `
Você é o Saldo.io AI, um consultor financeiro pessoal brilhante e direto ao ponto.
Abaixo está o resumo financeiro do usuário referente ao mês de ${monthName}.
Por favor, analise a saúde financeira dele com base apenas nestes números e retorne um parágrafo curto (máximo 4 a 5 frases) com seu diagnóstico e UMA dica prática para melhorar no próximo mês. Use tom encorajador.

DADOS:
- Receitas Totais: R$ ${safeIncome.toFixed(2)}
- Despesas Totais: R$ ${safeExpense.toFixed(2)}
- Saldo do Mês: R$ ${safeBalance.toFixed(2)}

Gastos por Categoria:
${catText}

Regras da resposta:
- Fale diretamente com o usuário no formato Markdown.
- Seja breve, direto e prestativo.
- Não mencione que você é uma IA ou um modelo de linguagem aberto.
- Se o saldo for negativo, sugira cortes nas categorias onde ele mais gastou.
- Se for positivo, dê parabéns e sugira poupar/investir.
    `.trim();

    try {
        if (provider === 'gemini') {
            return await callGemini(apiKey, prompt);
        } else if (provider === 'openai') {
            return await callOpenAI(apiKey, prompt);
        } else {
            throw new Error('Provedor de I.A. não suportado.');
        }
    } catch (err) {
        console.error("AI Error:", err);
        throw new Error(`Ocorreu um erro ao consultar a I.A.: ${err.message}`);
    }
}

async function callGemini(apiKey, prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 300 }
        })
    });

    if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData?.error?.message || 'Falha na resposta do servidor Gemini.');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

async function callOpenAI(apiKey, prompt) {
    const url = `https://api.openai.com/v1/chat/completions`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 300
        })
    });

    if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData?.error?.message || 'Falha na resposta do servidor OpenAI.');
    }

    const data = await response.json();
    return data.choices[0].message.content;
}
