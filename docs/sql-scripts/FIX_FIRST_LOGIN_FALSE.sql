-- ============================================
-- FIX: Marcar todos usuários como first_login = false
-- Para que não peçam troca de senha toda vez
-- ============================================

-- EXECUTE ESTE SCRIPT NO SUPABASE SQL EDITOR

-- 1. Atualizar TODOS os usuários para first_login = false
UPDATE users 
SET first_login = false;

-- 2. Verificar resultado
SELECT 
  id,
  username,
  email,
  role,
  first_login,
  created_at
FROM users
ORDER BY created_at DESC;

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- Todos os usuários: first_login = false
-- Ninguém será forçado a trocar senha
-- ============================================

-- Comentário
COMMENT ON COLUMN users.first_login IS 'Campo mantido para compatibilidade, sempre false';
