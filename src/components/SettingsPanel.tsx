import { useState, useEffect } from 'react';
import { supabase, User } from '../lib/supabase';
import { 
  Settings, 
  Trash2, 
  AlertTriangle, 
  Save, 
  RefreshCw,
  DollarSign,
  Package,
  Bell,
  Database,
  Shield
} from 'lucide-react';

export function SettingsPanel({ currentUser }: { currentUser: User }) {
  const [commissionRate, setCommissionRate] = useState('20');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Apenas admin tem acesso
  if (currentUser.role !== 'admin') {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <Shield className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-xl font-black text-red-800 mb-2">Acesso Negado</h3>
          <p className="text-red-600">Apenas administradores podem acessar as configurações.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase
      .from('system_settings')
      .select('*');

    if (data) {
      data.forEach((setting) => {
        switch (setting.key) {
          case 'commission_rate':
            setCommissionRate((parseFloat(setting.value) * 100).toString());
            break;
          case 'low_stock_threshold':
            setLowStockThreshold(setting.value);
            break;
          case 'notification_enabled':
            setNotificationsEnabled(setting.value === 'true');
            break;
        }
      });
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updates = [
        { key: 'commission_rate', value: (parseFloat(commissionRate) / 100).toString() },
        { key: 'low_stock_threshold', value: lowStockThreshold },
        { key: 'notification_enabled', value: notificationsEnabled.toString() },
      ];

      for (const update of updates) {
        await supabase
          .from('system_settings')
          .upsert({
            key: update.key,
            value: update.value,
            updated_by: currentUser.id,
            updated_at: new Date().toISOString(),
          });
      }

      setSuccess('Configurações salvas com sucesso!');
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const clearAllSales = async () => {
    if (!confirm('⚠️ ATENÇÃO! Isso vai DELETAR TODAS AS VENDAS permanentemente. Tem certeza?')) {
      return;
    }

    if (!confirm('Última confirmação: Deletar TODAS as vendas? Esta ação NÃO pode ser desfeita!')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (error) throw error;
      
      setSuccess('Todas as vendas foram deletadas!');
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar vendas');
    } finally {
      setLoading(false);
    }
  };

  const clearAllItems = async () => {
    if (!confirm('⚠️ ATENÇÃO! Isso vai DELETAR TODOS OS ITENS permanentemente. Tem certeza?')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (error) throw error;
      
      setSuccess('Todos os itens foram deletados!');
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar itens');
    } finally {
      setLoading(false);
    }
  };

  const clearAllNotifications = async () => {
    if (!confirm('Deletar todas as notificações?')) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (error) throw error;
      
      setSuccess('Todas as notificações foram deletadas!');
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar notificações');
    } finally {
      setLoading(false);
    }
  };

  const resetDatabase = async () => {
    if (!confirm('🚨 PERIGO MÁXIMO! Isso vai RESETAR TODO O BANCO DE DADOS! Tem ABSOLUTA certeza?')) {
      return;
    }

    const confirmText = prompt('Digite "RESETAR TUDO" para confirmar:');
    if (confirmText !== 'RESETAR TUDO') {
      alert('Cancelado.');
      return;
    }

    setLoading(true);
    try {
      // Deletar tudo exceto usuários
      await supabase.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('goals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      setSuccess('Banco de dados resetado! Apenas usuários foram mantidos.');
    } catch (err: any) {
      setError(err.message || 'Erro ao resetar banco');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tighter uppercase italic">
          ⚙️ Painel de Controle Total
        </h2>
        <p className="text-sm font-bold text-red-600 uppercase tracking-widest mt-1">
          🔴 MODO ADMINISTRADOR - PODER TOTAL
        </p>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl animate-fade-in">
          ✅ {success}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl animate-fade-in">
          ❌ {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações do Sistema */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="h-6 w-6 text-indigo-600" />
            <h3 className="font-black text-gray-800 uppercase text-sm">Configurações Gerais</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase mb-2">
                <DollarSign className="inline h-4 w-4" /> Taxa de Comissão (%)
              </label>
              <input
                type="number"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                className="w-full p-3 bg-gray-50 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                min="0"
                max="100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Vendedores ganham {commissionRate}%, organização ganha {100 - parseFloat(commissionRate)}%
              </p>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase mb-2">
                <Package className="inline h-4 w-4" /> Alerta de Estoque Baixo
              </label>
              <input
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                className="w-full p-3 bg-gray-50 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                min="1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Notificar quando estoque ≤ {lowStockThreshold} unidades
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="font-bold text-gray-800">Notificações</span>
              </div>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notificationsEnabled ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <button
              onClick={saveSettings}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </div>

        {/* Ações Perigosas */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-3xl p-6 border-2 border-red-200">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <h3 className="font-black text-red-800 uppercase text-sm">⚠️ Zona de Perigo</h3>
          </div>

          <div className="space-y-3">
            <button
              onClick={clearAllSales}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Limpar Todas as Vendas
            </button>

            <button
              onClick={clearAllItems}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Limpar Todos os Itens
            </button>

            <button
              onClick={clearAllNotifications}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Limpar Notificações
            </button>

            <div className="border-t-2 border-red-300 my-4"></div>

            <button
              onClick={resetDatabase}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl font-black hover:bg-red-700 transition-all disabled:opacity-50 animate-pulse"
            >
              <Database className="h-4 w-4" />
              🚨 RESETAR BANCO COMPLETO
            </button>

            <p className="text-xs text-red-600 font-bold text-center mt-2">
              ⚠️ Ações irreversíveis! Use com extrema cautela!
            </p>
          </div>
        </div>
      </div>

      {/* Informações do Sistema */}
      <div className="mt-6 bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="font-black text-gray-800 uppercase text-sm mb-4">📊 Informações do Sistema</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-2xl font-black text-indigo-600">v2.0</p>
            <p className="text-xs text-gray-500 uppercase font-bold">Versão</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-2xl font-black text-green-600">Online</p>
            <p className="text-xs text-gray-500 uppercase font-bold">Status</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-2xl font-black text-purple-600">Admin</p>
            <p className="text-xs text-gray-500 uppercase font-bold">Seu Nível</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-2xl font-black text-orange-600">100%</p>
            <p className="text-xs text-gray-500 uppercase font-bold">Poder</p>
          </div>
        </div>
      </div>
    </div>
  );
}
