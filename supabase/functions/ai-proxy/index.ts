import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { provider = 'gemini', monthData } = await req.json();
    
    // Auth check relies on verify_jwt being true, so the request has a valid JWT.
    
    if (!monthData) {
      throw new Error('monthData is required');
    }

    const { income, expense, balance, categoriesData, monthName } = monthData;
    const safeIncome = income || 0;
    const safeExpense = Math.abs(expense || 0);
    const safeBalance = balance || 0;
    const catText = (categoriesData || []).map((c: any) => `- ${c.name}: R$ ${c.value.toFixed(2)}`).join('\n');

    const prompt = `
Você é o Saldo.io AI, um consultor financeiro pessoal brilhante e direto ao ponto.
Abaixo está o resumo financeiro do usuário referente ao mês de ${monthName || 'atual'}.
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

    let resultText = '';

    if (provider === 'gemini') {
      const apiKey = Deno.env.get('GEMINI_API_KEY');
      if (!apiKey) throw new Error('GEMINI_API_KEY is not configured on the server.');
      
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
      resultText = data.candidates[0].content.parts[0].text;
      
    } else if (provider === 'openai') {
      const apiKey = Deno.env.get('OPENAI_API_KEY');
      if (!apiKey) throw new Error('OPENAI_API_KEY is not configured on the server.');
      
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
      resultText = data.choices[0].message.content;
    } else {
      throw new Error(`Provider ${provider} is not supported.`);
    }

    return new Response(JSON.stringify({ insight: resultText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
