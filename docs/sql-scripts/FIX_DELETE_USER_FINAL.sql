-- =====================================================
-- CORRIGIR ERRO DE DELETAR USUÁRIO COM VENDAS
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- Isso permite deletar usuários mesmo que tenham vendas

-- 1. Remover constraint antiga da tabela sales
ALTER TABLE sales 
DROP CONSTRAINT IF EXISTS sales_seller_id_fkey;

-- 2. Adicionar nova constraint com ON DELETE SET NULL
ALTER TABLE sales 
ADD CONSTRAINT sales_seller_id_fkey 
FOREIGN KEY (seller_id) 
REFERENCES users(id) 
ON DELETE SET NULL;

-- 3. Fazer o mesmo para outras tabelas relacionadas

-- Tabela audit_logs
ALTER TABLE audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;

ALTER TABLE audit_logs 
ADD CONSTRAINT audit_logs_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE SET NULL;

-- Tabela system_settings
ALTER TABLE system_settings 
DROP CONSTRAINT IF EXISTS system_settings_updated_by_fkey;

ALTER TABLE system_settings 
ADD CONSTRAINT system_settings_updated_by_fkey 
FOREIGN KEY (updated_by) 
REFERENCES users(id) 
ON DELETE SET NULL;

-- Tabela backups
ALTER TABLE backups 
DROP CONSTRAINT IF EXISTS backups_created_by_fkey;

ALTER TABLE backups 
ADD CONSTRAINT backups_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES users(id) 
ON DELETE SET NULL;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
-- Verificar se as constraints foram atualizadas
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND rc.delete_rule = 'SET NULL';

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Deve mostrar:
-- sales | sales_seller_id_fkey | SET NULL
-- audit_logs | audit_logs_user_id_fkey | SET NULL
-- system_settings | system_settings_updated_by_fkey | SET NULL
-- backups | backups_created_by_fkey | SET NULL

-- =====================================================
-- AGORA VOCÊ PODE DELETAR USUÁRIOS!
-- =====================================================
-- Quando deletar um usuário:
-- - As vendas dele continuam existindo
-- - O seller_id fica NULL (sem vendedor)
-- - Não há erro de foreign key
