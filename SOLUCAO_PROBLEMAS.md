# 🔧 Solução de Problemas

## Problema: Site fica apenas carregando

### Causas Comuns:

#### 1. Erro de Configuração do Supabase
**Sintoma**: Tela branca ou loading infinito

**Solução**:
1. Abra `src/lib/supabase.ts`
2. Verifique se `supabaseUrl` e `supabaseKey` estão corretos
3. Teste a conexão:
```typescript
// Cole isso no console do navegador (F12)
console.log('Supabase URL:', 'https://dfxoajrvbgvjzqrpmggr.supabase.co');
```

#### 2. Tabelas não criadas no Supabase
**Sintoma**: Erro no console sobre tabelas não encontradas

**Solução**:
1. Acesse seu projeto no Supabase
2. Vá em SQL Editor
3. Execute os comandos do arquivo `INSTRUCOES_SUPABASE.md`
4. Verifique se as tabelas `users`, `items`, `sales` existem

#### 3. Políticas RLS (Row Level Security)
**Sintoma**: Queries retornam vazio ou erro de permissão

**Solução**:
1. No Supabase, vá em Authentication > Policies
2. Para cada tabela, adicione políticas:

**Tabela `users`:**
```sql
-- Permitir leitura para usuários autenticados
CREATE POLICY "Users can read all users"
ON users FOR SELECT
TO authenticated
USING (true);

-- Permitir atualização do próprio perfil
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Permitir inserção (para registro)
CREATE POLICY "Users can insert own profile"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
```

**Tabela `items`:**
```sql
-- Permitir leitura para todos autenticados
CREATE POLICY "Anyone can read items"
ON items FOR SELECT
TO authenticated
USING (true);

-- Permitir inserção/atualização/exclusão para todos
CREATE POLICY "Anyone can manage items"
ON items FOR ALL
TO authenticated
USING (true);
```

**Tabela `sales`:**
```sql
-- Permitir leitura para todos autenticados
CREATE POLICY "Anyone can read sales"
ON sales FOR SELECT
TO authenticated
USING (true);

-- Permitir inserção para todos
CREATE POLICY "Anyone can insert sales"
ON sales FOR INSERT
TO authenticated
WITH CHECK (true);
```

#### 4. Erro no Console do Navegador
**Como verificar**:
1. Pressione F12 (ou Cmd+Option+I no Mac)
2. Vá na aba "Console"
3. Procure por erros em vermelho
4. Anote a mensagem de erro

**Erros Comuns**:

**"Cannot read property 'id' of null"**
- Usuário não está autenticado corretamente
- Limpe o localStorage: `localStorage.clear()` no console
- Faça login novamente

**"Failed to fetch"**
- Problema de conexão com Supabase
- Verifique sua internet
- Verifique se o URL do Supabase está correto

**"Invalid API key"**
- Chave do Supabase incorreta
- Copie novamente de Settings > API no Supabase

## Como Testar Passo a Passo

### 1. Teste Básico de Conexão
```javascript
// Cole no console do navegador (F12)
import { supabase } from './src/lib/supabase';
const { data, error } = await supabase.from('users').select('*').limit(1);
console.log('Dados:', data, 'Erro:', error);
```

### 2. Teste de Autenticação
```javascript
// Cole no console
const { data: { user } } = await supabase.auth.getUser();
console.log('Usuário:', user);
```

### 3. Limpar Cache e Tentar Novamente
```javascript
// Cole no console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

## Soluções Rápidas

### Resetar Tudo
1. Abra o console (F12)
2. Cole:
```javascript
localStorage.clear();
sessionStorage.clear();
```
3. Recarregue a página (F5)
4. Tente fazer login novamente

### Verificar se o Servidor Está Rodando
```bash
# No terminal
npm run dev
```

Deve mostrar algo como:
```
VITE v7.2.4  ready in 500 ms

➜  Local:   http://localhost:5173/
```

### Recompilar o Projeto
```bash
# Pare o servidor (Ctrl+C)
# Limpe e reinstale
rm -rf node_modules
rm package-lock.json
npm install
npm run dev
```

## Problemas Específicos

### "Não consigo fazer login"
1. Verifique se o email está correto
2. Senha deve ter no mínimo 6 caracteres
3. Limpe o cache (localStorage.clear())
4. Tente registrar novamente

### "Não vejo minhas vendas"
1. Verifique se você está logado
2. Verifique as políticas RLS no Supabase
3. Abra o console e veja se há erros

### "Não consigo criar usuário (Admin)"
1. Verifique se você é admin no banco
2. No Supabase, vá em Table Editor > users
3. Encontre seu usuário e mude `role` para `admin`
4. Faça logout e login novamente

### "Dashboard não carrega"
1. Pode ser que não tenha vendas ainda
2. Verifique o console por erros
3. Tente fazer uma venda de teste primeiro

## Verificação Final

Execute este checklist:

- [ ] Supabase URL e Key estão corretos em `src/lib/supabase.ts`
- [ ] Tabelas `users`, `items`, `sales` existem no Supabase
- [ ] Políticas RLS estão configuradas
- [ ] Servidor está rodando (`npm run dev`)
- [ ] Console do navegador não mostra erros
- [ ] LocalStorage foi limpo
- [ ] Você consegue fazer login

## Ainda com Problemas?

1. Tire um print do console (F12)
2. Tire um print das tabelas no Supabase
3. Verifique se seguiu todos os passos do `INSTRUCOES_SUPABASE.md`
4. Tente criar um novo projeto no Supabase e reconfigure

## Comandos Úteis

```bash
# Ver logs detalhados
npm run dev -- --debug

# Limpar cache do Vite
rm -rf .vite

# Verificar versão do Node
node --version  # Deve ser 18+

# Reinstalar tudo
rm -rf node_modules package-lock.json
npm install
```

## Contato

Se nada funcionar, verifique:
1. Versão do Node.js (mínimo 18)
2. Conexão com internet
3. Firewall não está bloqueando Supabase
4. Navegador atualizado (Chrome, Firefox, Edge)
