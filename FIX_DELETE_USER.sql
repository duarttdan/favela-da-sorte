-- ============================================
-- FIX: Corrigir erro ao deletar usuários
-- Problema: Foreign key constraint impede exclusão
-- ============================================

-- EXECUTE ESTE SCRIPT NO SUPABASE SQL EDITOR

-- 1. Remover constraint antiga
ALTER TABLE audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;

-- 2. Adicionar nova constraint com ON DELETE SET NULL
-- Quando um usuário for deletado, o user_id nos logs vira NULL
-- Isso mantém o histórico mas remove a referência
ALTER TABLE audit_logs 
ADD CONSTRAINT audit_logs_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE SET NULL;

-- 3. Fazer o mesmo para outras tabelas se necessário
ALTER TABLE system_settings 
DROP CONSTRAINT IF EXISTS system_settings_updated_by_fkey;

ALTER TABLE system_settings 
ADD CONSTRAINT system_settings_updated_by_fkey 
FOREIGN KEY (updated_by) 
REFERENCES users(id) 
ON DELETE SET NULL;

ALTER TABLE backups 
DROP CONSTRAINT IF EXISTS backups_created_by_fkey;

ALTER TABLE backups 
ADD CONSTRAINT backups_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES users(id) 
ON DELETE SET NULL;

-- 4. Verificar constraints
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'users'
ORDER BY tc.table_name;

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- audit_logs -> users: ON DELETE SET NULL
-- system_settings -> users: ON DELETE SET NULL  
-- backups -> users: ON DELETE SET NULL
-- goals -> users: ON DELETE CASCADE (já correto)
-- notifications -> users: ON DELETE CASCADE (já correto)
-- sales -> users: ON DELETE CASCADE (já correto)
-- ============================================

-- Agora você pode deletar usuários sem erro!
