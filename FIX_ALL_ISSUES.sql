-- ============================================
-- FIX ALL: Corrigir TODOS os problemas de uma vez
-- Execute este script para corrigir:
-- 1. Roles antigos -> novos roles
-- 2. Foreign key constraints
-- 3. Políticas RLS
-- ============================================

-- EXECUTE ESTE SCRIPT COMPLETO NO SUPABASE SQL EDITOR

-- ============================================
-- PARTE 1: ATUALIZAR ROLES
-- ============================================

-- Converter roles antigos para novos
UPDATE users SET role = 'dono' WHERE role = 'admin';
UPDATE users SET role = 'gerente' WHERE role = 'setter';
UPDATE users SET role = 'membro' WHERE role = 'member';

-- ============================================
-- PARTE 2: CORRIGIR FOREIGN KEYS
-- ============================================

-- audit_logs
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- system_settings
ALTER TABLE system_settings DROP CONSTRAINT IF EXISTS system_settings_updated_by_fkey;
ALTER TABLE system_settings ADD CONSTRAINT system_settings_updated_by_fkey 
FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;

-- backups
ALTER TABLE backups DROP CONSTRAINT IF EXISTS backups_created_by_fkey;
ALTER TABLE backups ADD CONSTRAINT backups_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================
-- PARTE 3: ATUALIZAR POLÍTICAS RLS - ITEMS
-- ============================================

DROP POLICY IF EXISTS "Anyone can view items" ON items;
DROP POLICY IF EXISTS "Admins can insert items" ON items;
DROP POLICY IF EXISTS "Admins can update items" ON items;
DROP POLICY IF EXISTS "Admins can delete items" ON items;

CREATE POLICY "Anyone can view items"
ON items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert items"
ON items FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('dono', 'gerente', 'sub-lider', 'admin')
  )
);

CREATE POLICY "Admins can update items"
ON items FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('dono', 'gerente', 'sub-lider', 'admin')
  )
);

CREATE POLICY "Admins can delete items"
ON items FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('dono', 'gerente', 'sub-lider', 'admin')
  )
);

-- ============================================
-- PARTE 4: ATUALIZAR POLÍTICAS RLS - SALES
-- ============================================

DROP POLICY IF EXISTS "Users can view own sales" ON sales;
DROP POLICY IF EXISTS "Admins can view all sales" ON sales;
DROP POLICY IF EXISTS "Users can create sales" ON sales;
DROP POLICY IF EXISTS "Admins can update sales" ON sales;
DROP POLICY IF EXISTS "Admins can delete sales" ON sales;

CREATE POLICY "Users can view own sales"
ON sales FOR SELECT TO authenticated
USING (
  seller_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('dono', 'gerente', 'sub-lider', 'admin')
  )
);

CREATE POLICY "Users can create sales"
ON sales FOR INSERT TO authenticated
WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Admins can update sales"
ON sales FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('dono', 'gerente', 'sub-lider', 'admin')
  )
);

CREATE POLICY "Admins can delete sales"
ON sales FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('dono', 'admin')
  )
);

-- ============================================
-- PARTE 5: ATUALIZAR POLÍTICAS RLS - USERS
-- ============================================

DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

CREATE POLICY "Users can view all users"
ON users FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE POLICY "Admins can insert users"
ON users FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('dono', 'gerente', 'sub-lider', 'admin')
  )
);

CREATE POLICY "Admins can update users"
ON users FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('dono', 'gerente', 'sub-lider', 'admin')
  )
);

CREATE POLICY "Admins can delete users"
ON users FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('dono', 'gerente', 'sub-lider', 'admin')
  )
  AND id != auth.uid()
);

-- ============================================
-- PARTE 6: ATUALIZAR POLÍTICAS RLS - AUDIT_LOGS
-- ============================================

DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can create audit logs" ON audit_logs;

CREATE POLICY "Admins can view all audit logs"
ON audit_logs FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('dono', 'gerente', 'sub-lider', 'admin')
  )
);

CREATE POLICY "System can create audit logs"
ON audit_logs FOR INSERT TO authenticated
WITH CHECK (true);

-- ============================================
-- PARTE 7: ATUALIZAR POLÍTICAS RLS - SYSTEM_SETTINGS
-- ============================================

DROP POLICY IF EXISTS "Admins can manage settings" ON system_settings;

CREATE POLICY "Admins can manage settings"
ON system_settings FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('dono', 'admin')
  )
);

-- ============================================
-- PARTE 8: ATUALIZAR POLÍTICAS RLS - BACKUPS
-- ============================================

DROP POLICY IF EXISTS "Admins can manage backups" ON backups;

CREATE POLICY "Admins can manage backups"
ON backups FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('dono', 'admin')
  )
);

-- ============================================
-- PARTE 9: ATUALIZAR FUNÇÕES
-- ============================================

-- Função de notificação de estoque baixo
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quantity <= 5 AND OLD.quantity > 5 THEN
    INSERT INTO notifications (user_id, type, title, message)
    SELECT 
      users.id,
      'stock',
      'Estoque Baixo! ⚠️',
      'O item ' || NEW.name || ' está com apenas ' || NEW.quantity || ' unidades.'
    FROM users
    WHERE users.role IN ('dono', 'gerente', 'sub-lider', 'admin');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PARTE 10: VERIFICAÇÃO FINAL
-- ============================================

-- Verificar roles atualizados
SELECT 
  role,
  COUNT(*) as total_usuarios
FROM users
GROUP BY role
ORDER BY 
  CASE role
    WHEN 'dono' THEN 1
    WHEN 'gerente' THEN 2
    WHEN 'sub-lider' THEN 3
    WHEN 'admin' THEN 4
    WHEN 'membro' THEN 5
    ELSE 6
  END;

-- Verificar políticas
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('items', 'sales', 'users')
ORDER BY tablename, policyname;

-- ============================================
-- ✅ MIGRAÇÃO COMPLETA!
-- ============================================
-- Agora você pode:
-- - Criar e gerenciar itens
-- - Fazer vendas
-- - Criar e promover usuários
-- - Deletar usuários
-- - Todas as funcionalidades funcionando!
-- ============================================
