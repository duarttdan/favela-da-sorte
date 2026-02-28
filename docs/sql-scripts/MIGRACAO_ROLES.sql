-- ============================================
-- MIGRAÇÃO: SISTEMA DE CARGOS ATUALIZADO
-- Favela da Sorte - Hierarquia de Roles
-- ============================================

-- IMPORTANTE: Execute este script no Supabase SQL Editor
-- para atualizar o sistema de cargos existente

-- 1. Atualizar roles existentes para o novo sistema
-- Converter 'admin' antigo para 'dono' (maior poder)
UPDATE users 
SET role = 'dono' 
WHERE role = 'admin';

-- Converter 'setter' antigo para 'gerente'
UPDATE users 
SET role = 'gerente' 
WHERE role = 'setter';

-- Converter 'member' antigo para 'membro'
UPDATE users 
SET role = 'membro' 
WHERE role = 'member';

-- 2. Recriar políticas RLS com novos roles

-- Dropar políticas antigas
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins can manage settings" ON system_settings;
DROP POLICY IF EXISTS "Admins can manage backups" ON backups;

-- Criar novas políticas
CREATE POLICY "Admins can view all audit logs"
ON audit_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('dono', 'gerente', 'sub-lider', 'admin')
  )
);

CREATE POLICY "Admins can manage settings"
ON system_settings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('dono', 'admin')
  )
);

CREATE POLICY "Admins can manage backups"
ON backups FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('dono', 'admin')
  )
);

-- 3. Atualizar função de notificação de estoque baixo
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

-- 4. Corrigir foreign key constraint em audit_logs
-- Dropar constraint antiga e recriar com ON DELETE SET NULL
ALTER TABLE audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;

ALTER TABLE audit_logs 
ADD CONSTRAINT audit_logs_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE SET NULL;

-- 5. Atualizar políticas RLS para items
DROP POLICY IF EXISTS "Admins can insert items" ON items;
DROP POLICY IF EXISTS "Admins can update items" ON items;
DROP POLICY IF EXISTS "Admins can delete items" ON items;

CREATE POLICY "Admins can insert items"
ON items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('dono', 'gerente', 'sub-lider', 'admin')
  )
);

CREATE POLICY "Admins can update items"
ON items FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('dono', 'gerente', 'sub-lider', 'admin')
  )
);

CREATE POLICY "Admins can delete items"
ON items FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('dono', 'gerente', 'sub-lider', 'admin')
  )
);

-- 6. Atualizar políticas RLS para sales
DROP POLICY IF EXISTS "Users can view own sales" ON sales;
DROP POLICY IF EXISTS "Admins can update sales" ON sales;
DROP POLICY IF EXISTS "Admins can delete sales" ON sales;

CREATE POLICY "Users can view own sales"
ON sales FOR SELECT
TO authenticated
USING (
  seller_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('dono', 'gerente', 'sub-lider', 'admin')
  )
);

CREATE POLICY "Admins can update sales"
ON sales FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('dono', 'gerente', 'sub-lider', 'admin')
  )
);

CREATE POLICY "Admins can delete sales"
ON sales FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('dono', 'admin')
  )
);

-- 7. Atualizar políticas RLS para users
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

CREATE POLICY "Admins can insert users"
ON users FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('dono', 'gerente', 'sub-lider', 'admin')
  )
);

CREATE POLICY "Admins can update users"
ON users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('dono', 'gerente', 'sub-lider', 'admin')
  )
);

CREATE POLICY "Admins can delete users"
ON users FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('dono', 'gerente', 'sub-lider', 'admin')
  )
  AND id != auth.uid()
);

-- 8. Verificar migração
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

-- 9. Adicionar configuração do Discord webhook
INSERT INTO system_settings (key, value, description) 
VALUES ('discord_webhook', '', 'URL do webhook do Discord para envio automático de vendas')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- HIERARQUIA DE CARGOS:
-- ============================================
-- 👑 DONO (5) - Poder total, pode promover todos
-- 💼 GERENTE (4) - Gerencia equipe, pode promover até sub-lider
-- ⭐ SUB-LÍDER (3) - Supervisiona vendas, pode promover até admin
-- 🔴 ADMIN (2) - Administra sistema, pode promover membros
-- 👤 MEMBRO (1) - Vendedor padrão
-- ============================================

-- Comentários
COMMENT ON TABLE users IS 'Usuários do sistema com hierarquia: dono > gerente > sub-lider > admin > membro';
