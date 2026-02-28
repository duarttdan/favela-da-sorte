import { useState, useEffect } from 'react';
import { supabase, Sale } from '../lib/supabase';
import { Calculator, TrendingUp, Users, Calendar, ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react';

// FORMATADOR DE MOEDA COM K, MI, BI
const formatarMoeda = (valor: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact', // <--- Isso transforma 1.000.000 em 1 mi
    maximumFractionDigits: 2
  }).format(valor || 0);
};

export function AccountingPanel() {
  const [sales, setSales] = useState<(Sale & { item: { name: string; emoji: string }; seller: { username: string } })[]>([]);
  const [filter, setFilter] = useState('hoje');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccountingData();
  }, [filter]);

  const loadAccountingData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`*, item:items (name, emoji), seller:users (username)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setSales(data as any);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const receitaTotal = sales.reduce((sum, s) => sum + s.total_price, 0);
  const lucroVendedores = sales.reduce((sum, s) => sum + s.seller_profit, 0);
  const lucroDono = sales.reduce((sum, s) => sum + s.owner_profit, 0);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-800 uppercase italic tracking-tighter flex items-center gap-2">
            <Calculator className="h-8 w-8 text-indigo-600" />
            Contabilidade
          </h2>
          <p className="text-gray-400 text-xs font-bold uppercase mt-1 flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Relatório atualizado: {new Date().toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
          {['hoje', 'semana', 'mes', 'todas'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${ filter === f ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl flex items-center justify-between">
          <div><p className="text-[10px] font-black text-gray-400 uppercase mb-1">Vendas Totais</p><p className="text-3xl font-black text-gray-800">{sales.length}</p></div>
          <div className="bg-gray-50 p-3 rounded-2xl"><DollarSign className="h-6 w-6 text-gray-400" /></div>
        </div>
        <div className="bg-white p-6 rounded-3xl border-l-4 border-l-blue-500 flex items-center justify-between">
          <div><p className="text-[10px] font-black text-blue-500 uppercase mb-1">Receita Bruta</p><p className="text-2xl font-black text-gray-800">{formatarMoeda(receitaTotal)}</p></div>
          <div className="bg-blue-50 p-3 rounded-2xl"><ArrowUpRight className="h-6 w-6 text-blue-500" /></div>
        </div>
        <div className="bg-white p-6 rounded-3xl border-l-4 border-l-green-500 flex items-center justify-between">
          <div><p className="text-[10px] font-black text-green-500 uppercase mb-1">Comissões</p><p className="text-2xl font-black text-gray-800">{formatarMoeda(lucroVendedores)}</p></div>
          <div className="bg-green-50 p-3 rounded-2xl"><Users className="h-6 w-6 text-green-500" /></div>
        </div>
        <div className="bg-white p-6 rounded-3xl border-l-4 border-l-indigo-600 flex items-center justify-between">
          <div><p className="text-[10px] font-black text-indigo-600 uppercase mb-1">Lucro Líquido</p><p className="text-2xl font-black text-gray-800">{formatarMoeda(lucroDono)}</p></div>
          <div className="bg-indigo-50 p-3 rounded-2xl"><TrendingUp className="h-6 w-6 text-indigo-600" /></div>
        </div>
      </div>

      <div className="bg-white rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            <h3 className="font-black text-gray-800 uppercase text-sm tracking-widest">Fluxo Detalhado</h3>
          </div>
          {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase">
              <tr>
                <th className="px-6 py-4">Data</th><th className="px-6 py-4">Vendedor</th><th className="px-6 py-4">Item</th>
                <th className="px-6 py-4 text-right">Total</th><th className="px-6 py-4 text-right text-green-600">Comissão</th><th className="px-6 py-4 text-right text-indigo-600">Líquido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4"><span className="text-xs font-bold text-gray-500">{new Date(sale.created_at).toLocaleDateString()}</span></td>
                  <td className="px-6 py-4 font-black text-gray-700 uppercase text-xs">{sale.seller?.username || 'Sistema'}</td>
                  <td className="px-6 py-4 flex items-center gap-2"><span className="text-xl">{sale.item?.emoji}</span><span className="text-sm font-bold text-gray-600">{sale.item?.name}</span></td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">{formatarMoeda(sale.total_price)}</td>
                  <td className="px-6 py-4 text-right font-black text-green-600">{formatarMoeda(sale.seller_profit)}</td>
                  <td className="px-6 py-4 text-right font-black text-indigo-600">{formatarMoeda(sale.owner_profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}