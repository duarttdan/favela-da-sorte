-- ============================================
-- TABELAS EMPRESARIAIS - FAVELA DA SORTE
-- Sistema de Gestão Profissional
-- ============================================

-- Tabela de Metas e Objetivos
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC DEFAULT 0,
  deadline DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('sale', 'stock', 'goal', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Logs de Auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Configurações do Sistema
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Backups Automáticos
CREATE TABLE IF NOT EXISTS backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('manual', 'automatic', 'scheduled')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  file_path TEXT,
  file_size BIGINT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Índices para Performance
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Políticas RLS (Row Level Security)

-- Goals
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals"
ON goals FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own goals"
ON goals FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
ON goals FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
ON goals FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
ON notifications FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Audit Logs (apenas leitura para usuários, escrita para sistema)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "System can create audit logs"
ON audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- System Settings (apenas admins e donos)
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

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

-- Backups (apenas admins e donos)
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

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

-- Função para criar notificação automática ao atingir meta
CREATE OR REPLACE FUNCTION check_goal_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_amount >= NEW.target_amount AND OLD.current_amount < OLD.target_amount THEN
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (
      NEW.user_id,
      'goal',
      'Meta Atingida! 🎉',
      'Parabéns! Você atingiu a meta: ' || NEW.title
    );
    
    UPDATE goals
    SET status = 'completed'
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER goal_completion_trigger
AFTER UPDATE ON goals
FOR EACH ROW
EXECUTE FUNCTION check_goal_completion();

-- Função para criar notificação de estoque baixo
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

CREATE TRIGGER low_stock_trigger
AFTER UPDATE ON items
FOR EACH ROW
EXECUTE FUNCTION check_low_stock();

-- Função para criar log de auditoria automaticamente
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values
  )
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar auditoria em tabelas importantes
CREATE TRIGGER audit_users_trigger
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_sales_trigger
AFTER INSERT OR UPDATE OR DELETE ON sales
FOR EACH ROW
EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_items_trigger
AFTER INSERT OR UPDATE OR DELETE ON items
FOR EACH ROW
EXECUTE FUNCTION create_audit_log();

-- Inserir configurações padrão
INSERT INTO system_settings (key, value, description) VALUES
('commission_rate', '0.20', 'Taxa de comissão dos vendedores (20%)'),
('low_stock_threshold', '5', 'Limite de estoque baixo para alertas'),
('backup_frequency', '"daily"', 'Frequência de backups automáticos'),
('notification_enabled', 'true', 'Sistema de notificações ativado')
ON CONFLICT (key) DO NOTHING;

-- Comentários nas tabelas
COMMENT ON TABLE goals IS 'Metas e objetivos dos vendedores';
COMMENT ON TABLE notifications IS 'Sistema de notificações em tempo real';
COMMENT ON TABLE audit_logs IS 'Logs de auditoria para rastreamento de ações';
COMMENT ON TABLE system_settings IS 'Configurações globais do sistema';
COMMENT ON TABLE backups IS 'Registro de backups do sistema';
