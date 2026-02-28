import { useState, useEffect } from 'react';
import { supabase, User } from '../lib/supabase';
import { 
  DollarSign, 
  ShoppingBag, 
  Users,
  Package,
  Award,
  Clock,
  Target
} from 'lucide-react';

const formatarMoeda = (valor: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

interface DashboardStats {
  totalVendas: number;
  totalReceita: number;
  minhaComissao: number;
  vendasHoje: number;
  topItem: { name: string; emoji: string; count: number } | null;
  rankingVendedores: Array<{ username: string; total: number; vendas: number }>;
}

export function DashboardHome({ currentUser }: { currentUser: User }) {
  const [stats, setStats] = useState<DashboardStats>({
    totalVendas: 0,
    totalReceita: 0,
    minhaComissao: 0,
    vendasHoje: 0,
    topItem: null,
    rankingVendedores: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Minhas vendas - simplificado
      const { data: minhasVendas } = await supabase
        .from('sales')
        .select('total_price, seller_profit, created_at')
        .eq('seller_id', currentUser.id);

      // Vendas de hoje
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const { data: vendasHoje } = await supabase
        .from('sales')
        .select('id')
        .eq('seller_id', currentUser.id)
        .gte('created_at', hoje.toISOString());

      setStats({
        totalVendas: minhasVendas?.length || 0,
        totalReceita: minhasVendas?.reduce((acc, v) => acc + (v.total_price || 0), 0) || 0,
        minhaComissao: minhasVendas?.reduce((acc, v) => acc + (v.seller_profit || 0), 0) || 0,
        vendasHoje: vendasHoje?.length || 0,
        topItem: null,
        rankingVendedores: [],
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      setStats({
        totalVendas: 0,
        totalReceita: 0,
        minhaComissao: 0,
        vendasHoje: 0,
        topItem: null,
        rankingVendedores: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tighter uppercase italic">
          Dashboard
        </h2>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">
          Bem-vindo, {currentUser.username}!
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {/* Minhas Vendas */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-3xl shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
            <ShoppingBag className="h-8 w-8 opacity-80" />
            <span className="text-xs font-black bg-white/20 px-3 py-1 rounded-full">
              TOTAL
            </span>
          </div>
          <p className="text-3xl font-black mb-1">{stats.totalVendas}</p>
          <p className="text-sm font-bold opacity-80">Minhas Vendas</p>
        </div>

        {/* Receita Gerada */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-3xl shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="h-8 w-8 opacity-80" />
            <span className="text-xs font-black bg-white/20 px-3 py-1 rounded-full">
              RECEITA
            </span>
          </div>
          <p className="text-2xl font-black mb-1">{formatarMoeda(stats.totalReceita)}</p>
          <p className="text-sm font-bold opacity-80">Receita Gerada</p>
        </div>

        {/* Minha Comissão */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-3xl shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
            <Award className="h-8 w-8 opacity-80" />
            <span className="text-xs font-black bg-white/20 px-3 py-1 rounded-full">
              20%
            </span>
          </div>
          <p className="text-2xl font-black mb-1">{formatarMoeda(stats.minhaComissao)}</p>
          <p className="text-sm font-bold opacity-80">Minha Comissão</p>
        </div>

        {/* Vendas Hoje */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-3xl shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
            <Clock className="h-8 w-8 opacity-80" />
            <span className="text-xs font-black bg-white/20 px-3 py-1 rounded-full">
              HOJE
            </span>
          </div>
          <p className="text-3xl font-black mb-1">{stats.vendasHoje}</p>
          <p className="text-sm font-bold opacity-80">Vendas Hoje</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Item Mais Vendido */}
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <Target className="h-6 w-6 text-indigo-600" />
            <h3 className="font-black text-gray-800 uppercase text-sm tracking-tighter">
              Meu Item Mais Vendido
            </h3>
          </div>
          
          {stats.topItem ? (
            <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200">
              <span className="text-5xl">{stats.topItem.emoji}</span>
              <div>
                <p className="text-xl font-black text-gray-800">{stats.topItem.name}</p>
                <p className="text-sm font-bold text-indigo-600">
                  {stats.topItem.count} unidades vendidas
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 font-medium">
              Nenhuma venda ainda
            </div>
          )}
        </div>

        {/* Ranking de Vendedores (Admin/Setter) */}
        {(currentUser.role === 'admin' || currentUser.role === 'setter') && (
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <Users className="h-6 w-6 text-emerald-600" />
              <h3 className="font-black text-gray-800 uppercase text-sm tracking-tighter">
                Top 5 Vendedores
              </h3>
            </div>
            
            {stats.rankingVendedores.length > 0 ? (
              <div className="space-y-3">
                {stats.rankingVendedores.map((vendedor, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center font-black text-sm ${
                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-gray-300 text-gray-700' :
                        index === 2 ? 'bg-orange-400 text-orange-900' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{vendedor.username}</p>
                        <p className="text-xs text-gray-500">{vendedor.vendas} vendas</p>
                      </div>
                    </div>
                    <p className="font-black text-emerald-600">
                      {formatarMoeda(vendedor.total)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 font-medium">
                Nenhuma venda registrada
              </div>
            )}
          </div>
        )}

        {/* Dica Rápida (para membros) */}
        {currentUser.role === 'member' && (
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-3xl shadow-lg text-white">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-6 w-6" />
              <h3 className="font-black uppercase text-sm tracking-tighter">
                Dica do Dia
              </h3>
            </div>
            <p className="text-sm font-medium opacity-90 leading-relaxed">
              Cada venda que você faz, você ganha 20% de comissão! Continue vendendo para aumentar seus ganhos. 💰
            </p>
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-xs font-bold opacity-75">
                Sua meta: {formatarMoeda(stats.minhaComissao * 2)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
