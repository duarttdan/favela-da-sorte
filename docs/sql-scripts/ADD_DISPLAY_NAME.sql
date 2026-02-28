-- =====================================================
-- ADICIONAR CAMPO DISPLAY_NAME (NOME DE EXIBIÇÃO)
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- Este campo permite que usuários tenham um nome de exibição
-- diferente do username (que vem do email)

-- 1. Adicionar coluna display_name na tabela users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- 2. Atualizar display_name com username existente (migração)
UPDATE users 
SET display_name = username 
WHERE display_name IS NULL;

-- 3. Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_users_display_name ON users(display_name);

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
-- Verificar se a coluna foi criada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'display_name';

-- Ver todos os usuários com display_name
SELECT id, email, username, display_name, role 
FROM users 
ORDER BY created_at DESC;
