-- ============================================
-- ADICIONAR CAMPO first_login NA TABELA USERS
-- Para rastrear se é o primeiro login do usuário
-- ============================================

-- EXECUTE ESTE SCRIPT NO SUPABASE SQL EDITOR

-- 1. Adicionar coluna first_login (padrão: true para novos usuários)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_login BOOLEAN DEFAULT true;

-- 2. Atualizar usuários existentes para false (já fizeram login antes)
UPDATE users 
SET first_login = false 
WHERE first_login IS NULL;

-- 3. Verificar resultado
SELECT 
  id,
  username,
  email,
  role,
  first_login,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- Todos os usuários existentes: first_login = false
-- Novos usuários criados: first_login = true
-- 
-- Quando um usuário troca a senha pela primeira vez,
-- o campo é atualizado para false automaticamente
-- ============================================

-- Comentário na coluna
COMMENT ON COLUMN users.first_login IS 'Indica se o usuário precisa trocar a senha no primeiro login';
