import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { DollarSign, TrendingUp, Users, RefreshCw } from 'lucide-react';

const formatarMoeda = (valor: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

interface Stats {
  total: number;
  seller: number;
  owner: number;
  count: number;
}

export function AccountingPanel() {
  const [stats, setStats] = useState<Stats>({ total: 0, seller: 0, owner: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('total_price, seller_profit, owner_profit');
      
      if (error) throw error;

      if (data) {
        const summary = data.reduce(
          (acc, sale) => ({
            total: acc.total + (sale.total_price || 0),
            seller: acc.seller + (sale.seller_profit || 0),
            owner: acc.owner + (sale.owner_profit || 0),
            count: acc.count + 1,
          }),
          { total: 0, seller: 0, owner: 0, count: 0 }
        );
        setStats(summary);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      setError('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tighter uppercase italic">
            Resumo Financeiro
          </h2>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">
            Total de {stats.count} vendas
          </p>
        </div>
        
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Atualizar</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Receita Total */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-50 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="text-emerald-500 h-8 w-8" />
            <span className="text-xs font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full">
              100%
            </span>
          </div>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-2">
            Receita Total
          </p>
          <p className="text-2xl md:text-3xl font-black text-gray-800">
            {formatarMoeda(stats.total)}
          </p>
        </div>

        {/* Lucro Vendedores */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-50 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all">
          <div className="flex items-center justify-between mb-4">
            <Users className="text-blue-500 h-8 w-8" />
            <span className="text-xs font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-full">
              20%
            </span>
          </div>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-2">
            Lucro Vendedores
          </p>
          <p className="text-2xl md:text-3xl font-black text-blue-600">
            {formatarMoeda(stats.seller)}
          </p>
        </div>

        {/* Lucro Favela */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 md:p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border-2 border-emerald-200 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="text-emerald-600 h-8 w-8" />
            <span className="text-xs font-black text-emerald-600 bg-white px-3 py-1 rounded-full">
              80%
            </span>
          </div>
          <p className="text-emerald-600 font-bold text-xs uppercase tracking-widest mb-2">
            Lucro Favela
          </p>
          <p className="text-3xl md:text-4xl font-black text-gray-900">
            {formatarMoeda(stats.owner)}
          </p>
        </div>
      </div>

      {/* Informações Adicionais */}
      <div className="mt-6 md:mt-8 bg-white p-6 rounded-2xl border border-gray-100">
        <h3 className="font-black text-gray-700 uppercase text-sm mb-4">
          Distribuição de Lucros
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Comissão dos Vendedores</span>
            <span className="text-sm font-black text-blue-600">20% por venda</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Lucro da Organização</span>
            <span className="text-sm font-black text-emerald-600">80% por venda</span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="text-sm font-medium text-gray-600">Total de Transações</span>
            <span className="text-sm font-black text-gray-800">{stats.count} vendas</span>
          </div>
        </div>
      </div>
    </div>
  );
}