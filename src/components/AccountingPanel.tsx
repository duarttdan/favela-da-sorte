import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DollarSign, TrendingUp, Users } from 'lucide-react';

export function AccountingPanel() {
  const [stats, setStats] = useState({ total: 0, seller: 0, owner: 0, count: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase.from('sales').select('total_price, seller_profit, owner_profit');
      if (data) {
        const summary = data.reduce((acc, sale) => ({
          total: acc.total + sale.total_price,
          seller: acc.seller + sale.seller_profit,
          owner: acc.owner + sale.owner_profit,
          count: acc.count + 1
        }), { total: 0, seller: 0, owner: 0, count: 0 });
        setStats(summary);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="p-8">
      <h2 className="text-3xl font-black text-gray-800 mb-8 tracking-tighter uppercase italic">Resumo Financeiro</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-50">
          <TrendingUp className="text-emerald-500 mb-4" size={32} />
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Receita Total</p>
          <p className="text-3xl font-black text-gray-800">R$ {stats.total.toLocaleString()}</p>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-50">
          <Users className="text-blue-500 mb-4" size={32} />
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Lucro Vendedores (20%)</p>
          <p className="text-3xl font-black text-blue-600">R$ {stats.seller.toLocaleString()}</p>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-50 ring-2 ring-emerald-500/20">
          <DollarSign className="text-emerald-600 mb-4" size={32} />
          <p className="text-emerald-600 font-bold text-xs uppercase tracking-widest">Lucro Favela (80%)</p>
          <p className="text-4xl font-black text-gray-900">R$ {stats.owner.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}