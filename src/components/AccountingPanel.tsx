import React, { useState, useEffect } from 'react';
import { supabase, Sale, User } from '../lib/supabase';
import { Calculator, TrendingUp, Users, DollarSign, Calendar, ShoppingCart, Package } from 'lucide-react';

// Componente de Painel de Contabilidade e Relatórios
export function AccountingPanel() {
  // Estados para controle do painel contábil
  const [sales, setSales] = useState<Sale[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('today'); // today, week, month, all

  // Efeito para carregar dados contábeis
  useEffect(() => {
    loadAccountingData();
  }, [dateFilter]);

  // Função para carregar dados contábeis baseado no filtro de data
  const loadAccountingData = async () => {
    try {
      setLoading(true);
      
      // Query base para vendas
      let salesQuery = supabase
        .from('sales')
        .select(`
          *,
          seller:users!sales_seller_id_fkey (
            username
          ),
          item:items!sales_item_id_fkey (
            name,
            emoji
          )
        `)
        .order('created_at', { ascending: false });

      // Aplica filtros de data
      const now = new Date();
      if (dateFilter === 'today') {
        const today = now.toISOString().split('T')[0];
        salesQuery = salesQuery.gte('created_at', `${today}T00:00:00`);
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        salesQuery = salesQuery.gte('created_at', weekAgo);
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        salesQuery = salesQuery.gte('created_at', monthAgo);
      }

      const { data: salesData, error: salesError } = await salesQuery;

      if (salesError) throw salesError;

      // Carrega todos os usuários para cálculos
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*');

      if (usersError) throw usersError;

      setSales(salesData || []);
      setUsers(usersData || []);
    } catch (error) {
      console.error('Erro ao carregar dados contábeis:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cálculos contábeis
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_price, 0);
  const totalOwnerProfit = sales.reduce((sum, sale) => sum + sale.owner_profit, 0);
  const totalSellerProfit = sales.reduce((sum, sale) => sum + sale.seller_profit, 0);
  const totalSales = sales.length;

  // Calcula lucro por vendedor
  const profitBySeller = users.map(user => {
    const userSales = sales.filter(sale => sale.seller_id === user.id);
    const userProfit = userSales.reduce((sum, sale) => sum + sale.seller_profit, 0);
    const ownerProfit = userSales.reduce((sum, sale) => sum + sale.owner_profit, 0);
    
    return {
      ...user,
      totalSales: userSales.length,
      sellerProfit: userProfit,
      ownerProfit: ownerProfit,
      totalRevenue: userProfit + ownerProfit
    };
  }).filter(user => user.totalSales > 0).sort((a, b) => b.totalRevenue - a.totalRevenue);

  // Itens mais vendidos
  const itemsSold = sales.reduce((acc: any, sale: any) => {
    const itemName = sale.item?.name || 'Item desconhecido';
    const itemEmoji = sale.item?.emoji || '📦';
    
    if (!acc[itemName]) {
      acc[itemName] = { 
        name: itemName, 
        emoji: itemEmoji, 
        quantity: 0, 
        revenue: 0,
        sellerProfit: 0,
        ownerProfit: 0 
      };
    }
    
    acc[itemName].quantity += sale.quantity;
    acc[itemName].revenue += sale.total_price;
    acc[itemName].sellerProfit += sale.seller_profit;
    acc[itemName].ownerProfit += sale.owner_profit;
    
    return acc;
  }, {});

  const topItems = Object.values(itemsSold).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 5);

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Contabilidade</h2>

      {/* Filtros de Data */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="h-6 w-6 text-gray-600" />
          <h3 className="text-xl font-semibold">Filtros</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'today', label: 'Hoje' },
            { value: 'week', label: 'Última Semana' },
            { value: 'month', label: 'Último Mês' },
            { value: 'all', label: 'Todas' }
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setDateFilter(filter.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                dateFilter === filter.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards de Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-800">{totalSales}</span>
          </div>
          <p className="text-gray-600">Total de Vendas</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-800">R$ {totalRevenue.toFixed(2)}</span>
          </div>
          <p className="text-gray-600">Receita Total</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-8 w-8 text-purple-600" />
            <span className="text-2xl font-bold text-gray-800">R$ {totalSellerProfit.toFixed(2)}</span>
          </div>
          <p className="text-gray-600">Lucro dos Vendedores (20%)</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-8 w-8 text-orange-600" />
            <span className="text-2xl font-bold text-gray-800">R$ {totalOwnerProfit.toFixed(2)}</span>
          </div>
          <p className="text-gray-600">Lucro do Dono (80%)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Vendas por Vendedor */}
        <div className="bg-white rounded-xl shadow-md">
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-gray-600" />
              <h3 className="text-xl font-semibold">Vendas por Vendedor</h3>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Carregando...</p>
              </div>
            ) : profitBySeller.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhuma venda encontrada</p>
            ) : (
              <div className="space-y-3">
                {profitBySeller.map((user: any) => (
                  <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-800">{user.username}</p>
                        <p className="text-sm text-gray-600">{user.totalSales} vendas</p>
                      </div>
                      <span className="text-lg font-bold text-gray-800">
                        R$ {user.totalRevenue.toFixed(2)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-gray-50 rounded p-2">
                        <span className="text-gray-600">Vendedor (20%):</span>
                        <span className="text-green-600 font-medium ml-1">
                          R$ {user.sellerProfit.toFixed(2)}
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <span className="text-gray-600">Dono (80%):</span>
                        <span className="text-orange-600 font-medium ml-1">
                          R$ {user.ownerProfit.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Itens Mais Vendidos */}
        <div className="bg-white rounded-xl shadow-md">
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <Package className="h-6 w-6 text-gray-600" />
              <h3 className="text-xl font-semibold">Itens Mais Vendidos</h3>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Carregando...</p>
              </div>
            ) : topItems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhum item vendido</p>
            ) : (
              <div className="space-y-3">
                {topItems.map((item: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl">{item.emoji}</div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        {item.quantity} unidades vendidas
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">R$ {item.revenue.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        Liq: R$ {(item.sellerProfit + item.ownerProfit).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Histórico de Vendas Detalhado */}
      <div className="bg-white rounded-xl shadow-md mt-8">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <Calculator className="h-6 w-6 text-gray-600" />
            <h3 className="text-xl font-semibold">Histórico de Vendas</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Data</th>
                  <th className="text-left py-3 px-4">Vendedor</th>
                  <th className="text-left py-3 px-4">Item</th>
                  <th className="text-left py-3 px-4">Comprador</th>
                  <th className="text-left py-3 px-4">Qtd</th>
                  <th className="text-left py-3 px-4">Total</th>
                  <th className="text-left py-3 px-4">Vendedor (20%)</th>
                  <th className="text-left py-3 px-4">Dono (80%)</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Carregando...</p>
                    </td>
                  </tr>
                ) : sales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">
                      Nenhuma venda encontrada
                    </td>
                  </tr>
                ) : (
                  sales.map((sale: any) => (
                    <tr key={sale.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">
                        {new Date(sale.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm">{sale.seller?.username || 'Desconhecido'}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className="mr-1">{sale.item?.emoji || '📦'}</span>
                        {sale.item?.name || 'Item'}
                      </td>
                      <td className="py-3 px-4 text-sm">{sale.buyer_name}</td>
                      <td className="py-3 px-4 text-sm">{sale.quantity}</td>
                      <td className="py-3 px-4 text-sm font-medium">
                        R$ {sale.total_price.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-sm text-green-600">
                        R$ {sale.seller_profit.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-sm text-orange-600">
                        R$ {sale.owner_profit.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}