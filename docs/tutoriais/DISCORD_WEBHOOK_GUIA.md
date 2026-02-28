# 🔗 Guia: Integração com Discord Webhook

## 📋 O que é Discord Webhook?

Um webhook do Discord permite que o sistema envie mensagens automaticamente para um canal específico do seu servidor Discord sempre que uma venda for realizada.

## ✨ Benefícios

- ✅ **Notificações em tempo real** de todas as vendas
- ✅ **Formatação bonita** com emojis e organização
- ✅ **Histórico automático** no canal do Discord
- ✅ **Toda equipe vê** as vendas instantaneamente
- ✅ **Sem necessidade de copiar/colar** manualmente

## 🚀 Como Configurar

### Passo 1: Criar Webhook no Discord

1. Abra seu servidor Discord
2. Vá nas **Configurações do Canal** onde quer receber as vendas
3. Clique em **Integrações** → **Webhooks**
4. Clique em **Novo Webhook** ou **Criar Webhook**
5. Dê um nome (ex: "Vendas Favela da Sorte")
6. Escolha o canal de destino
7. Clique em **Copiar URL do Webhook**

### Passo 2: Configurar no Sistema

1. Faça login como **Admin** ou **Dono**
2. Vá em **Configurações** (Settings)
3. Cole a URL do webhook no campo **Discord Webhook URL**
4. Clique em **Salvar Configurações**

### Passo 3: Testar

1. Vá em **Vendas**
2. Faça uma venda de teste
3. Verifique se a mensagem apareceu no canal do Discord

## 📝 Formato da Mensagem

Quando uma venda é realizada, o Discord recebe uma mensagem assim:

```
╔═══════════════════════════════════════╗
║        🎯 NOVA VENDA REALIZADA 🎯        ║
╚═══════════════════════════════════════╝

👤 CLIENTE: João Silva
🆔 RECEBEDOR: @cria 293
💼 VENDEDOR: CARLOS

📦 ITENS VENDIDOS:
   🎰 Jogo do Bicho x2 - R$ 100,00
   🎲 Rifa x1 - R$ 50,00

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 VALOR TOTAL: R$ 150,00
💵 COMISSÃO (CARLOS): R$ 30,00
💎 LUCRO ORGANIZAÇÃO: R$ 120,00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 DATA: 28/02/2024, 15:30:45
✅ STATUS: Venda Confirmada

🎰 FAVELA DA SORTE 🍀
```

## 🎨 Informações Incluídas

Cada mensagem de venda contém:

- 👤 **Nome do Cliente** (ou "Cliente Anônimo" se não informado)
- 🆔 **ID do Recebedor** (@cria XXX) - quem vai receber o dinheiro
- 💼 **Nome do Vendedor** - quem fez a venda
- 📦 **Lista de Itens** - com emojis, quantidades e valores
- 💰 **Valor Total** da venda
- 💵 **Comissão do Vendedor** (20% padrão)
- 💎 **Lucro da Organização** (80% padrão)
- 📅 **Data e Hora** da venda
- ✅ **Status** de confirmação

## ⚙️ Configurações Avançadas

### Múltiplos Canais

Você pode criar webhooks diferentes para:
- Canal de vendas gerais
- Canal de vendas VIP
- Canal de relatórios diários

Basta trocar a URL do webhook nas configurações.

### Desativar Envio Automático

Se quiser desativar temporariamente:
1. Vá em **Configurações**
2. Apague a URL do webhook
3. Salve

As vendas continuarão funcionando, mas não serão enviadas ao Discord.

## 🔒 Segurança

⚠️ **IMPORTANTE:**
- **NUNCA compartilhe** a URL do webhook publicamente
- Qualquer pessoa com a URL pode enviar mensagens para seu canal
- Se a URL vazar, delete o webhook e crie um novo

## 🐛 Problemas Comuns

### Mensagem não aparece no Discord

**Possíveis causas:**
1. URL do webhook incorreta
2. Webhook foi deletado no Discord
3. Bot não tem permissão no canal
4. Servidor Discord está offline

**Solução:**
1. Verifique se a URL está correta
2. Crie um novo webhook
3. Teste novamente

### Mensagem aparece mas sem formatação

**Causa:** Discord não suporta formatação Markdown em webhooks de algumas regiões.

**Solução:** Use o formato "Simple" nas configurações de venda.

### Erro "Webhook not found"

**Causa:** O webhook foi deletado no Discord.

**Solução:**
1. Crie um novo webhook
2. Atualize a URL nas configurações

## 📊 Estatísticas

Com o webhook configurado, você pode:
- Ver todas as vendas em tempo real
- Acompanhar performance da equipe
- Ter histórico completo no Discord
- Fazer análises posteriores

## 🎯 Dicas

1. **Crie um canal exclusivo** para vendas
2. **Configure permissões** para que apenas admins possam escrever
3. **Use pins** para fixar vendas importantes
4. **Faça backup** da URL do webhook em local seguro
5. **Teste regularmente** para garantir que está funcionando

## 📱 Notificações Mobile

Configure as notificações do Discord no celular para receber alertas de vendas em tempo real!

## 🆘 Suporte

Se tiver problemas:
1. Verifique a URL do webhook
2. Teste com uma venda simples
3. Confira as permissões do canal
4. Recrie o webhook se necessário

---

**Links Úteis:**
- [Documentação Oficial Discord Webhooks](https://support.discord.com/hc/pt-br/articles/228383668)
- [Como criar um webhook](https://support.discord.com/hc/pt-br/articles/228383668-Usando-Webhooks)

---

**Versão:** 2.0
**Status:** ✅ Funcional
**Última Atualização:** 2024
