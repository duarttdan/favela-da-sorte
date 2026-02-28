# 🎯 Sistema de Cargos e Promoções - Favela da Sorte

## 📋 Hierarquia de Cargos

O sistema possui 5 níveis hierárquicos de cargos:

### 👑 DONO (Nível 5)
- **Poder Máximo** - Controle total do sistema
- Pode criar, promover e remover TODOS os usuários
- Acesso a todas as funcionalidades
- Pode promover até: Gerente, Sub-Líder, Admin, Membro
- Acesso ao painel de Configurações (Settings)
- Pode limpar todo o banco de dados

### 💼 GERENTE (Nível 4)
- **Gestão de Equipe** - Gerencia vendedores e operações
- Pode criar e promover usuários até Sub-Líder
- Acesso ao painel Financeiro
- Acesso ao painel de Gestão (Admin)
- Visualiza relatórios completos
- Recebe notificações de estoque baixo

### ⭐ SUB-LÍDER (Nível 3)
- **Supervisão de Vendas** - Supervisiona equipe de vendas
- Pode criar e promover usuários até Admin
- Acesso ao painel Financeiro
- Acesso ao painel de Gestão (Admin)
- Visualiza relatórios da equipe
- Recebe notificações de estoque baixo

### 🔴 ADMIN (Nível 2)
- **Administração** - Gerencia sistema e membros
- Pode criar usuários Membros
- Acesso ao painel Financeiro
- Acesso ao painel de Gestão (Admin)
- Visualiza relatórios
- Recebe notificações de estoque baixo

### 👤 MEMBRO (Nível 1)
- **Vendedor** - Foco em vendas
- Realiza vendas e ganha comissões
- Acesso a: Vendas, Itens, Metas, Relatórios próprios
- Visualiza apenas suas próprias vendas
- Cria metas pessoais

---

## 🔄 Sistema de Promoção

### Como Promover Usuários

1. Acesse o **Painel de Gestão** (Admin Panel)
2. Localize o usuário na lista
3. Clique no ícone de **seta para cima** (⬆️)
4. Selecione o novo cargo
5. Confirme a promoção

### Regras de Promoção

- ✅ Você só pode promover usuários para cargos **ABAIXO** do seu
- ✅ Você só pode gerenciar usuários com cargo **INFERIOR** ao seu
- ❌ Não é possível promover alguém para seu próprio nível ou superior
- ❌ Não é possível remover usuários com cargo igual ou superior

**Exemplos:**
- **Dono** pode promover qualquer um para qualquer cargo
- **Gerente** pode promover até Sub-Líder (não pode criar outro Gerente)
- **Sub-Líder** pode promover até Admin
- **Admin** pode apenas criar Membros
- **Membro** não pode promover ninguém

---

## 🛒 Sistema de Vendas Atualizado

### Novidades nas Vendas

#### 1. Cliente Opcional
- Nome do cliente agora é **OPCIONAL**
- Se deixar vazio, aparece como "Cliente Anônimo"
- Útil para vendas rápidas sem identificação

#### 2. ID do Cliente (@cria)
- Campo novo para rastreamento
- Formato: `@cria 293` (exemplo)
- Identifica para quem o dinheiro foi passado
- Também é opcional

#### 3. Múltiplos Formatos de Cópia
- **Discord**: Formatação com emojis e caixas
- **WhatsApp**: Formatação com asteriscos
- **Simple**: Texto simples sem formatação

### Exemplo de Venda

```
Cliente: João Silva (ou vazio para anônimo)
ID: @cria 293 (opcional)
Itens: 
  🎰 Jogo do Bicho x2
  🎲 Rifa x1
Total: R$ 150,00
Comissão: R$ 30,00 (20%)
```

---

## ⚙️ Painel de Configurações (Settings)

**Acesso:** Apenas Dono e Admin

### Funcionalidades Perigosas (Danger Zone)

#### 🗑️ Limpar Todas as Vendas
- Remove TODAS as vendas do sistema
- Mantém itens e usuários
- **IRREVERSÍVEL** - Use com cuidado!

#### 🗑️ Limpar Todos os Itens
- Remove TODOS os itens do catálogo
- Remove vendas relacionadas
- **IRREVERSÍVEL**

#### 🗑️ Limpar Notificações
- Remove todas as notificações
- Limpa histórico de alertas

#### 💣 Reset Completo do Banco
- Remove TUDO: vendas, itens, notificações, metas
- Mantém apenas usuários
- **EXTREMAMENTE PERIGOSO**
- Requer confirmação dupla

---

## 🎨 Badges Visuais

Cada cargo tem um badge único com gradiente:

- 👑 **DONO**: Amarelo/Laranja (dourado)
- 💼 **GERENTE**: Roxo/Rosa
- ⭐ **SUB-LÍDER**: Azul/Ciano
- 🔴 **ADMIN**: Vermelho/Rosa
- 👤 **MEMBRO**: Cinza/Slate

---

## 🔐 Permissões por Cargo

| Funcionalidade | Dono | Gerente | Sub-Líder | Admin | Membro |
|----------------|------|---------|-----------|-------|--------|
| Vendas | ✅ | ✅ | ✅ | ✅ | ✅ |
| Itens | ✅ | ✅ | ✅ | ✅ | ✅ |
| Metas | ✅ | ✅ | ✅ | ✅ | ✅ |
| Relatórios | ✅ | ✅ | ✅ | ✅ | ✅ (próprios) |
| Notificações | ✅ | ✅ | ✅ | ✅ | ✅ |
| Financeiro | ✅ | ✅ | ✅ | ✅ | ❌ |
| Gestão (Admin) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Configurações | ✅ | ❌ | ❌ | ✅ | ❌ |
| Criar Usuários | ✅ | ✅ | ✅ | ✅ | ❌ |
| Promover Usuários | ✅ | ✅ (até sub-lider) | ✅ (até admin) | ✅ (só membros) | ❌ |
| Remover Usuários | ✅ | ✅ (inferiores) | ✅ (inferiores) | ✅ (membros) | ❌ |
| Reset Database | ✅ | ❌ | ❌ | ✅ | ❌ |

---

## 📊 Migração de Dados

Se você já tem um sistema rodando com os cargos antigos:

### Conversão Automática
- `admin` → `dono` (maior poder)
- `setter` → `gerente`
- `member` → `membro`

### Como Migrar

1. Acesse o **Supabase SQL Editor**
2. Abra o arquivo `MIGRACAO_ROLES.sql`
3. Execute o script completo
4. Verifique os resultados com a query final

---

## 🚀 Próximos Passos

1. **Criar seu primeiro Dono**
   - Use o sistema de autenticação para criar conta
   - No banco, altere manualmente o role para 'dono'

2. **Criar Hierarquia**
   - Dono cria Gerentes
   - Gerentes criam Sub-Líderes
   - Sub-Líderes criam Admins
   - Admins criam Membros

3. **Testar Promoções**
   - Teste promover um Membro para Admin
   - Teste as restrições de hierarquia

4. **Configurar Sistema**
   - Ajuste taxa de comissão
   - Configure alertas de estoque
   - Defina metas da equipe

---

## ⚠️ Avisos Importantes

- **Backup Regular**: Sempre faça backup antes de usar funções perigosas
- **Hierarquia**: Respeite a hierarquia para evitar problemas
- **Senhas**: Ao criar usuários, copie a senha temporária imediatamente
- **Promoções**: Pense bem antes de promover alguém para cargo alto
- **Reset**: NUNCA use reset completo sem backup!

---

## 🆘 Suporte

### Erro ao Deletar Usuário

Se você receber o erro:
```
update or delete on table "users" violates foreign key constraint
```

**Solução:**
1. Abra o Supabase SQL Editor
2. Execute o arquivo `FIX_DELETE_USER.sql`
3. Tente deletar o usuário novamente

Este erro ocorre porque os logs de auditoria estão vinculados aos usuários. O script corrige isso mantendo o histórico mas permitindo exclusões.

### Outros Problemas

Se tiver problemas:
1. Verifique o console do navegador (F12)
2. Confira as políticas RLS no Supabase
3. Valide que seu usuário tem o role correto
4. Execute a migração se estiver atualizando sistema antigo

---

**Versão:** 2.0 - Sistema de Cargos Hierárquico
**Data:** 2024
**Status:** ✅ Produção
