-- ============================================
-- FIX: Corrigir políticas RLS para novos roles
-- Problema: Políticas antigas usam 'admin', 'setter', 'member'
-- Solução: Atualizar para 'dono', 'gerente', 'sub-lider', 'admin', 'membro'
-- ============================================

-- EXECUTE ESTE SCRIPT NO SUPABASE SQL EDITOR

-- ============================================
-- 1. TABELA ITEMS
-- ============================================

-- Dropar políticas antigas
DROP POLICY IF EXISTS "Anyone can view items" ON items;
DROP POLICY IF EXISTS "Admins can insert items" ON items;
DROP POLICY IF EXISTS "Admins can update items" ON items;
DROP POLICY IF EXISTS "Admins can delete items" ON items;

-- Criar novas políticas
CREATE POLICY "Anyone can view items"
ON items FOR SELECT
TO authenticated
USING (true);

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

-- ============================================
-- 2. TABELA SALES
-- ============================================

-- Dropar políticas antigas
DROP POLICY IF EXISTS "Users can view own sales" ON sales;
DROP POLICY IF EXISTS "Admins can view all sales" ON sales;
DROP POLICY IF EXISTS "Users can create sales" ON sales;
DROP POLICY IF EXISTS "Admins can update sales" ON sales;
DROP POLICY IF EXISTS "Admins can delete sales" ON sales;

-- Criar novas políticas
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

CREATE POLICY "Users can create sales"
ON sales FOR INSERT
TO authenticated
WITH CHECK (seller_id = auth.uid());

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

-- ============================================
-- 3. TABELA USERS
-- ============================================

-- Dropar políticas antigas
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Criar novas políticas
CREATE POLICY "Users can view all users"
ON users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid());

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

-- ============================================
-- 4. VERIFICAR POLÍTICAS
-- ============================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('items', 'sales', 'users', 'goals', 'notifications', 'audit_logs', 'system_settings', 'backups')
ORDER BY tablename, policyname;

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- Todas as políticas devem usar os novos roles:
-- - dono, gerente, sub-lider, admin, membro
-- 
-- Não devem aparecer os roles antigos:
-- - admin (antigo), setter, member
-- ============================================

-- Pronto! Agora você pode criar itens e fazer vendas sem erro RLS!
