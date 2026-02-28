# 🐛 Debug Rápido - Site Não Carrega

## Passo 1: Abrir Console do Navegador

1. Pressione **F12** (ou Cmd+Option+I no Mac)
2. Clique na aba **Console**
3. Veja se há erros em vermelho
4. Tire um print e me envie

## Passo 2: Verificar Erros Comuns

### Erro: "Failed to fetch" ou "Network error"
**Causa**: Problema de conexão com Supabase

**Solução**:
1. Verifique sua internet
2. Abra `src/lib/supabase.ts`
3. Confirme que URL e Key estão corretos
4. Teste acessando o URL do Supabase no navegador

### Erro: "relation 'users' does not exist"
**Causa**: Tabelas não foram criadas no Supabase

**Solução**:
1. Acesse seu projeto no Supabase
2. Vá em SQL Editor
3. Execute os comandos do `INSTRUCOES_SUPABASE.md`

### Erro: "new row violates row-level security policy"
**Causa**: Políticas RLS não configuradas

**Solução**:
1. No Supabase, vá em Authentication > Policies
2. Para cada tabela, clique em "New Policy"
3. Escolha "Enable access to all users"
4. Ou use os comandos SQL do `SOLUCAO_PROBLEMAS.md`

### Erro: Loop infinito (fica carregando)
**Causa**: Problema no código React

**Solução Temporária**:
1. Abra `src/main.tsx`
2. Substitua:
```typescript
import { App } from "./App";
```
Por:
```typescript
import { App } from "./App-simple";
```
3. Salve e recarregue

## Passo 3: Teste com Versão Simplificada

Se nada funcionar, use a versão simplificada:

1. Edite `src/main.tsx`
2. Mude de `import { App } from "./App"` para `import { App } from "./App-simple"`
3. Salve
4. Recarregue o navegador

A versão simplificada tem apenas:
- Login/Registro
- Painel de Vendas básico
- Sem Dashboard complexo

## Passo 4: Limpar Cache

```javascript
// Cole no Console (F12)
localStorage.clear();
sessionStorage.clear();
location.reload();
```

## Passo 5: Verificar Configuração do Supabase

### No Console do Navegador (F12), cole:

```javascript
// Teste 1: Verificar configuração
console.log('URL:', 'https://dfxoajrvbgvjzqrpmggr.supabase.co');

// Teste 2: Testar conexão (cole linha por linha)
const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
const supabase = createClient(
  'https://dfxoajrvbgvjzqrpmggr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmeG9hanJ2Ymd2anpxcnBtZ2dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNDgyMDgsImV4cCI6MjA4NzcyNDIwOH0.KK-7lbQcD_OztTDv84xx2WqODEsjT8XETmZfGzXk85U'
);

// Teste 3: Buscar dados
const { data, error } = await supabase.from('users').select('*').limit(1);
console.log('Dados:', data);
console.log('Erro:', error);
```

## Passo 6: Comandos SQL Essenciais

Se as tabelas não existem, execute no Supabase SQL Editor:

```sql
-- Criar tabela users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  is_online BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Criar tabela items
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  emoji TEXT DEFAULT '📦',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Criar tabela sales
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id),
  seller_id UUID REFERENCES users(id),
  buyer_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  total_price NUMERIC NOT NULL,
  seller_profit NUMERIC NOT NULL,
  owner_profit NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Desabilitar RLS temporariamente (APENAS PARA TESTE)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE items DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
```

⚠️ **ATENÇÃO**: Desabilitar RLS é apenas para teste! Em produção, configure as políticas corretas.

## Passo 7: Criar Primeiro Usuário Manualmente

Se não conseguir registrar, crie direto no Supabase:

1. Vá em Authentication > Users
2. Clique em "Add user"
3. Preencha email e senha
4. Depois vá em Table Editor > users
5. Clique em "Insert row"
6. Preencha:
   - id: (copie o ID do usuário criado no passo 2)
   - email: mesmo email
   - username: escolha um nome
   - role: admin
   - is_online: false

## Passo 8: Me Envie Essas Informações

Se nada funcionar, me envie:

1. **Print do Console** (F12 > Console)
2. **Qual erro aparece** (copie a mensagem)
3. **Resultado dos testes** do Passo 5
4. **Tabelas existem?** (vá no Supabase > Table Editor)

## Solução Rápida: Usar App Simplificado

Edite `src/main.tsx`:

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App-simple'; // <-- Mudou aqui

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

Isso vai carregar uma versão mais simples sem o Dashboard complexo.
