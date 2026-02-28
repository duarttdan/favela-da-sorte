import { useState, useEffect } from 'react';
import { supabase, User } from '../lib/supabase';
import { 
  Download, 
  FileText, 
  TrendingUp,
  Filter,
  RefreshCw
} from 'lucide-react';

const formatarMoeda = (valor: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

const formatarData = (data: string) => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(data));
};

export function ReportsPanel({ currentUser }: { currentUser: User }) {
  const [sales, setSales] = useState<any[]>([]);
  const [filteredSales, setFilteredSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSales();
  }, [currentUser.id]);

  useEffect(() => {
    filterSales();
  }, [sales, dateFilter, searchTerm]);

  const loadSales = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('sales')
        .select(`
          *,
          item:items(name, emoji),
          seller:users!sales_seller_id_fkey(username)
        `)
        .order('created_at', { ascending: false });

      // Se não for admin/setter, mostrar apenas suas vendas
      if (currentUser.role === 'member') {
        query = query.eq('seller_id', currentUser.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (data) setSales(data);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSales = () => {
    let filtered = [...sales];

    // Filtro por data
    if (dateFilter !== 'all') {
      const now = new Date();
      const startDate = new Date();

      switch (dateFilter) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(
        (sale) => new Date(sale.created_at) >= startDate
      );
    }

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(
        (sale) =>
          sale.buyer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.item?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.seller?.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSales(filtered);
  };

  const exportToCSV = () => {
    const headers = ['Data', 'Vendedor', 'Cliente', 'Item', 'Quantidade', 'Total', 'Comissão'];
    const rows = filteredSales.map((sale) => [
      formatarData(sale.created_at),
      sale.seller?.username || 'Desconhecido',
      sale.buyer_name,
      sale.item?.name || 'Item',
      sale.quantity,
      sale.total_price,
      sale.seller_profit,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_vendas_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const totalVendas = filteredSales.reduce((acc, sale) => acc + sale.total_price, 0);
  const totalComissao = filteredSales.reduce((acc, sale) => acc + sale.seller_profit, 0);

  return (
    <div className="p-4 md:p-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tighter uppercase italic">
            Relatórios
          </h2>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">
            {filteredSales.length} vendas encontradas
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={loadSales}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Atualizar</span>
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md"
          >
            <Download className="h-4 w-4" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <p className="text-xs font-black text-gray-400 uppercase">Total de Vendas</p>
          </div>
          <p className="text-2xl font-black text-gray-800">{filteredSales.length}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <p className="text-xs font-black text-gray-400 uppercase">Receita Total</p>
          </div>
          <p className="text-2xl font-black text-emerald-600">{formatarMoeda(totalVendas)}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <p className="text-xs font-black text-gray-400 uppercase">Comissões</p>
          </div>
          <p className="text-2xl font-black text-purple-600">{formatarMoeda(totalComissao)}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-indigo-600" />
          <h3 className="font-black text-gray-800 uppercase text-sm">Filtros</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2">
              Período
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full p-3 bg-gray-50 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium"
            >
              <option value="all">Todas as vendas</option>
              <option value="today">Hoje</option>
              <option value="week">Última semana</option>
              <option value="month">Último mês</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2">
              Buscar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cliente, item ou vendedor..."
              className="w-full p-3 bg-gray-50 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium"
            />
          </div>
        </div>
      </div>

      {/* Tabela de Vendas */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase">Data</th>
                {(currentUser.role === 'admin' || currentUser.role === 'setter') && (
                  <th className="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase">Vendedor</th>
                )}
                <th className="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase">Item</th>
                <th className="px-4 py-3 text-center text-xs font-black text-gray-500 uppercase">Qtd</th>
                <th className="px-4 py-3 text-right text-xs font-black text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-right text-xs font-black text-gray-500 uppercase">Comissão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    Carregando...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    Nenhuma venda encontrada
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-600">
                      {formatarData(sale.created_at)}
                    </td>
                    {(currentUser.role === 'admin' || currentUser.role === 'setter') && (
                      <td className="px-4 py-3 text-sm font-bold text-gray-800">
                        {sale.seller?.username || 'Desconhecido'}
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm font-medium text-gray-600">
                      {sale.buyer_name}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{sale.item?.emoji || '📦'}</span>
                        <span className="text-sm font-bold text-gray-800">
                          {sale.item?.name || 'Item'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-gray-800">
                      {sale.quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-gray-800">
                      {formatarMoeda(sale.total_price)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-black text-green-600">
                      {formatarMoeda(sale.seller_profit)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
