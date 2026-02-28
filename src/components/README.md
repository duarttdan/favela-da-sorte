# Componentes do Sistema de Gestão de Vendas

## Estrutura de Componentes

### 1. App.tsx (Componente Principal)
- **Função**: Ponto de entrada da aplicação
- **Responsabilidades**:
  - Verifica autenticação do usuário
  - Gerencia estados globais de login
  - Renderiza Auth ou Dashboard baseado na autenticação
  - Atualiza status online do usuário

### 2. Auth.tsx (Autenticação)
- **Função**: Sistema de login e registro
- **Recursos**:
  - Formulário de login com email/senha
  - Formulário de registro de novos usuários
  - Validação de campos
  - Criação de perfil no banco após registro
  - Feedback de erros e loading states

### 3. Dashboard.tsx (Painel Principal)
- **Função**: Navegação e layout principal do sistema
- **Recursos**:
  - Sidebar com navegação por roles (admin/member/setter)
  - Cards de estatísticas (usuários online, vendas do dia, lucro)
  - Sistema de permissões baseado em roles
  - Atualizações em tempo real com Supabase realtime
  - Gerenciamento de status online/offline

### 4. AdminPanel.tsx (Painel Administrativo)
- **Função**: Gerenciamento de usuários e permissões
- **Recursos**:
  - **Criar usuários**: Apenas admins e setters podem criar novas contas
  - **Gerenciar roles**: Alterar funções (admin/setter/member)
  - **Excluir usuários**: Remover contas do sistema
  - **Visualizar usuários**: Lista completa com status online
  - **Geração de senhas**: Senhas temporárias para novos usuários

### 5. SalesPanel.tsx (Painel de Vendas)
- **Função**: Registro e gerenciamento de vendas
- **Recursos**:
  - **Seleção de itens**: Grid com emojis e informações
  - **Controle de quantidade**: Input numérico com validação de estoque
  - **Registro de comprador**: Nome do cliente
  - **Cálculo automático**: Divisão 20%/80% do lucro
  - **Histórico**: Lista de vendas do vendedor logado
  - **Atualização de estoque**: Reduz quantidade após venda

### 6. ItemsPanel.tsx (Gerenciamento de Itens)
- **Função**: CRUD de produtos
- **Recursos**:
  - **Adicionar itens**: Modal com formulário completo
  - **Editar itens**: Modo inline de edição
  - **Excluir itens**: Remoção com confirmação
  - **Emojis**: Seleção rápida de ícones
  - **Estoque global**: Modificações afetam todos os usuários
  - **Validação**: Campos obrigatórios e tipos de dados

### 7. AccountingPanel.tsx (Contabilidade)
- **Função**: Relatórios e análises financeiras
- **Recursos**:
  - **Filtros de data**: Hoje, semana, mês, todas
  - **Cards de resumo**: Receita total, lucros, quantidade de vendas
  - **Ranking de vendedores**: Ordenado por receita gerada
  - **Top itens**: Produtos mais vendidos
  - **Tabela detalhada**: Histórico completo com divisão de lucros
  - **Exportação**: Dados prontos para exportação

## Fluxo de Dados

```
App.tsx
  ├── Auth.tsx (se não autenticado)
  └── Dashboard.tsx (se autenticado)
       ├── AdminPanel.tsx (role: admin/setter)
       ├── SalesPanel.tsx (role: admin/member)
       ├── ItemsPanel.tsx (role: admin/member)
       ├── AccountingPanel.tsx (role: admin)
       └── Profile (todos)
```

## Sistema de Permissões (Role-Based Access Control)

### Admin
- ✅ Todos os painéis
- ✅ Gerenciar usuários
- ✅ Criar/Editar/Excluir itens
- ✅ Ver todas as vendas
- ✅ Acessar contabilidade completa

### Setter
- ✅ Criar contas de membros
- ✅ Ver dashboard
- ✅ Ver perfil
- ❌ Não pode excluir usuários
- ❌ Não pode acessar contabilidade

### Member
- ✅ Registrar vendas
- ✅ Ver próprias vendas
- ✅ Ver itens
- ✅ Ver perfil
- ❌ Não pode gerenciar usuários
- ❌ Não pode ver vendas de outros
- ❌ Não pode acessar contabilidade

## Sistema de Lucros

Cada venda é dividida automaticamente:
- **20%** → Vendedor (seller_profit)
- **80%** → Dono da ferramenta (owner_profit)

Exemplo: Venda de R$ 100,00
- Vendedor recebe: R$ 20,00
- Dono recebe: R$ 80,00

## Atualizações em Tempo Real

O sistema utiliza Supabase Realtime para:
- Atualizar lista de usuários online
- Atualizar estatísticas do dashboard
- Sincronizar modificações de itens globalmente
- Atualizar histórico de vendas

## Banco de Dados

### Tabelas
1. **users**: Dados dos usuários e permissões
2. **items**: Catálogo de produtos (global)
3. **sales**: Registro de todas as transações

### Relações
- `sales.item_id` → `items.id`
- `sales.seller_id` → `users.id`
- `users.id` → `auth.users.id`

### Segurança
- Row Level Security (RLS) habilitado em todas as tabelas
- Policies restringem acesso baseado em roles
- Apenas admins têm acesso irrestrito

## Modificações para Personalização

### 1. Alterar porcentagem de lucro
Edite `src/components/SalesPanel.tsx`:
```typescript
const sellerProfit = totalPrice * 0.2; // Altere 0.2 para nova porcentagem
const ownerProfit = totalPrice * 0.8; // Altere 0.8 complementar
```

### 2. Adicionar novos emojis
Edite `src/components/ItemsPanel.tsx`:
```typescript
const commonEmojis = ['📦', '🎯', '🎮', '💻', '...', 'SEU_NOVO_EMOJI'];
```

### 3. Alterar roles e permissões
Edite `src/components/Dashboard.tsx`:
```typescript
const navigationItems = [
  { id: 'painel', label: 'Novo Painel', icon: Icone, roles: ['admin', 'member'] }
];
```

### 4. Personalizar cores
Edite classes Tailwind em qualquer componente:
- `bg-blue-600` → cor primária
- `bg-purple-600` → cor secundária
- `bg-green-600` → cor sucesso
- `bg-red-600` → cor erro

### 5. Modificar cálculos contábeis
Edite `src/components/AccountingPanel.tsx`:
```typescript
const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_price, 0);
// Adicione seus próprios cálculos
```

## Dicas de Uso

1. **Primeiro acesso**: Registre-se, depois execute SQL para se tornar admin
2. **Criar itens**: Comece adicionando produtos com estoque
3. **Gerenciar equipe**: Use o painel admin para criar contas da equipe
4. **Acompanhar vendas**: Use filtros de data para análises
5. **Monitorar online**: Dashboard mostra equipe online em tempo real

## Segurança

- **Sempre** use HTTPS em produção
- **Nunca** exponha sua `service_role key`
- **Sempre** valide dados no frontend e backend
- **Use** senhas fortes para todas as contas
- **Revogue** tokens antigos regularmente