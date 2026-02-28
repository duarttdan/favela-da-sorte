# INSTRUÇÕES DE CONFIGURAÇÃO DO SUPABASE

## Passo 1: Criar Projeto no Supabase

1. Acesse https://supabase.com/
2. Clique em "New Project"
3. Preencha:
   - Nome do projeto: sistema-vendas
   - Senha do banco: crie uma senha forte e salve
4. Clique em "Create new project"

## Passo 2: Configurar Tabelas

Execute os seguintes SQLs no SQL Editor do Supabase:

### Tabela de Usuários
```sql
create table users (
  id uuid references auth.users primary key,
  email text unique not null,
  username text not null,
  role text not null default 'member', -- member, admin, setter
  is_online boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table users enable row level security;

-- Permite que usuários vejam apenas seus próprios dados
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admin can view all users" ON users FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);
```

### Tabela de Itens
```sql
create table items (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  price decimal(10,2) not null,
  emoji text default '📦',
  quantity integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table items enable row level security;

-- Permite que todos os usuários autenticados leiam itens
CREATE POLICY "Anyone can read items" ON items FOR SELECT USING (auth.role() = 'authenticated');

-- Apenas admins podem criar, atualizar e deletar itens
CREATE POLICY "Only admins can manage items" ON items FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'setter'))
);
```

### Tabela de Vendas
```sql
create table sales (
  id uuid default uuid_generate_v4() primary key,
  item_id uuid references items(id) not null,
  seller_id uuid references users(id) not null,
  buyer_name text not null,
  quantity integer not null,
  total_price decimal(10,2) not null,
  seller_profit decimal(10,2) not null, -- 20% do valor
  owner_profit decimal(10,2) not null, -- 80% do valor
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table sales enable row level security;

-- Permite que vendedores vejam apenas suas próprias vendas
CREATE POLICY "Sellers can view own sales" ON sales FOR SELECT USING (seller_id = auth.uid());

-- Permite que admins vejam todas as vendas
CREATE POLICY "Admin can view all sales" ON sales FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- Permite que qualquer usuário autenticado crie vendas
CREATE POLICY "Authenticated users can create sales" ON sales FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

## Passo 3: Configurar Autenticação

1. Vá para Authentication > Settings
2. Ative "Email Confirmations" se desejar
3. Vá para Auth > URL Configuration
4. Adicione os URLs de redirect do seu site

## Passo 4: Obter Credenciais

1. Vá para Settings > API
2. Copie:
   - Project URL (ex: https://xyzcompany.supabase.co)
   - API Key (service_role ou anon)

## Passo 5: Configurar no Código

Abra `src/lib/supabase.ts` e modifique:

```typescript
const supabaseUrl = 'https://SEU_URL_SUPABASE.supabase.co'; // MODIFIQUE AQUI
const supabaseKey = 'SUA_CHAVE_API_PUBLICA'; // MODIFIQUE AQUI
```

## Passo 6: Configurar Realtime (Opcional)

Para atualizações em tempo real funcionarem perfeitamente:

1. Vá para Database > Replication
2. Adicione as tabelas `users`, `items` e `sales` para replicação

## Passo 7: Criar Primeiro Admin

Execute este SQL para criar seu primeiro usuário admin:

```sql
-- Execute após criar o usuário via interface de registro
UPDATE users 
SET role = 'admin' 
WHERE email = 'seu-email@exemplo.com';
```

## Estrutura de Permissões

- **Admin**: Pode fazer tudo (criar usuários, gerenciar itens, ver todas as vendas)
- **Setter**: Pode criar usuários membros, mas não tem acesso total de admin
- **Member**: Pode fazer vendas e ver apenas seus dados

## Divisão de Lucros

O sistema automaticamente calcula:
- **20% do valor da venda** → Vendedor
- **80% do valor da venda** → Dono da ferramenta

Esses valores são armazenados em `seller_profit` e `owner_profit` na tabela `sales`.

## API Global

Para modificar itens globalmente (afetando todos os usuários):

```javascript
// Atualizar item globalmente
const { data, error } = await supabase
  .from('items')
  .update({ 
    quantity: nova_quantidade,
    price: novo_preco 
  })
  .eq('id', item_id);
```

## Segurança Importante

1. **NUNCA** compartilhe sua `service_role key`
2. Use apenas a `anon key` no código frontend
3. Configure Row Level Security (RLS) em todas as tabelas
4. Use policies para restringir acesso

## Testando o Sistema

1. Registre-se como novo usuário
2. Atualize seu role para 'admin' no banco
3. Faça login novamente
4. Adicione itens no painel de itens
5. Crie vendas no painel de vendas
6. Verifique os relatórios no painel de contabilidade

## Suporte

Para problemas com Supabase:
- Documentação: https://supabase.com/docs
- Comunidade: https://github.com/supabase/supabase/discussions
