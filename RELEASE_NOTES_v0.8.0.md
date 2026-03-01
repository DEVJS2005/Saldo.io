# Saldo.io v0.8.0 🚀 - Administração SaaS

Nesta versão, focamos em entregar ferramentas poderosas para a gestão, análise e suporte da plataforma Saldo.io, consolidando nossa fundação como um serviço SaaS robusto, além de melhorar a captação de usuários com uma conta de Demonstração pública!

## ✨ O que há de Novo?

### 📈 Métricas de Negócio em Tempo Real
Para quem administra a plataforma, criamos um novo dashboard acima da lista de usuários contendo métricas atualizadas através de RPC do Supabase:
- **Saldo Total da Plataforma:** Mostra a soma consolidada de todo o dinheiro salvo pelos usuários na plataforma.
- **Usuários Ativos:** Veja quantos cadastros o sistema possui no total e quantos deles ainda estão ativos.
- **Volume de Transações:** Número exato de quantos lançamentos financeiros já foram processados pelo Saldo.io.

### 🆘 Suporte Avançado no Painel
O gerenciamento dos usuários agora está muito mais completo e amigável para a equipe de suporte:
- **Busca por E-mail:** Localize instantaneamente qualquer usuário cadastrado usando a nova barra de busca no painel de controle.
- **Reset de Senha Forçado:** O administrador agora tem um botão (`Chave`) que envia na hora um e-mail oficial (via Supabase Auth) com o link para o usuário recuperar/trocar sua senha, resolvendo problemas de acesso com um clique.

### 🎮 Conta de Demonstração (Test Drive Público)
Para facilitar a adesão de novos usuários e apresentar o poder híbrido do sistema, criamos um esquema auto-gerenciável:
- **Acesso em 1 Clique:** Novo botão na tela de Login para acesso de demonstração.
- **Auto-Reset Seguro:** O banco de dados (via RPC) limpa toda a conta *teste@saldo.io* e reinsere contas (Carteira, Banco) e transações (Salário, Alimentação) novas **antes** do usuário ver a tela. Assim, cada testador tem uma experiência limpa e personalizada sem estragar o cenário para o próximo visitante.

### 🛡️ Automação de Cibersegurança e Novos Fluxos
- **Segurança de Conta:** Qualquer usuário logado agora possui a funcionalidade de alterar a própria senha dentro da aba de `Configurações > Segurança`, passando antes por uma validação fantasma (signIn) para confirmar a segurança da operação.
- **Recuperação Deslogada:** Criação da rota oficial `/reset-password` interligada à URL de retorno do Supabase. O fluxo intercepta o app antes de ele entrar no limiar do Dashboard e obriga a conclusão da troca por segurança.
- **Correção da View Publica:** Correção e aprimoramento interno e crítico de segurança recomendada pelo Supabase relacionada ao painel administrativo. 

## 🛠️ Manutenções Técnicas
As correções abaixo acompanharam esse grande Release:
- Documentação do `README` e de nosso `ROADMAP` 100% atualizadas.

*O Saldo.io continua ficando mais inteligente. Prepare-se, porque o módulo v0.9 virá com Gráficos e Orçamentos para os usuários espremerem cada gota dos rendimentos!*
