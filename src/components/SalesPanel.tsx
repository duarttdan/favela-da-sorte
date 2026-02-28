import { useState, useEffect } from 'react';
import { supabase, User, Item, Sale } from '../lib/supabase';
import { ShoppingCart, Plus, Minus, DollarSign, Package } from 'lucide-react';

// Interface para as props do componente SalesPanel
interface SalesPanelProps {
  currentUser: User;
}

// 1. FORMATADOR DE MOEDA PROFISSIONAL
const formatarMoeda = (valor: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

export function SalesPanel({ currentUser }: SalesPanelProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [buyerName, setBuyerName] = useState('');
  const [sales, setSales] = useState<any[]>([]); // Usamos any aqui para aceitar o join do item
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadItems();
    loadSales();
  }, []);

  const loadItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .gt('quantity', 0)
        .order('name', { ascending: true });

      if (error) throw error;
      if (data) setItems(data);
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
    }
  };

  const loadSales = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          item:items (
            name,
            emoji
          )
        `)
        .eq('seller_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      if (data) setSales(data);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
    }
  };

  const processSale = async () => {
    if (!selectedItem || quantity < 1 || !buyerName.trim()) {
      alert('Preencha todos os campos e selecione um item');
      return;
    }

    if (quantity > selectedItem.quantity) {
      alert(`Quantidade indisponível. Estoque: ${selectedItem.quantity}`);
      return;
    }

    setLoading(true);

    try {
      const totalPrice = selectedItem.price * quantity;
      const sellerProfit = totalPrice * 0.2;
      const ownerProfit = totalPrice * 0.8;

      const { error: saleError } = await supabase.from('sales').insert({
        item_id: selectedItem.id,
        seller_id: currentUser.id,
        buyer_name: buyerName,
        quantity,
        total_price: totalPrice,
        seller_profit: sellerProfit,
        owner_profit: ownerProfit,
      });

      if (saleError) throw saleError;

      const { error: updateError } = await supabase
        .from('items')
        .update({ quantity: selectedItem.quantity - quantity })
        .eq('id', selectedItem.id);

      if (updateError) throw updateError;

      setSelectedItem(null);
      setQuantity(1);
      setBuyerName('');
      await loadItems();
      await loadSales();

      alert('Venda realizada com sucesso!');
    } catch (error) {
      console.error('Erro ao processar venda:', error);
      alert('Erro ao processar venda');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-3xl font-black text-gray-800 mb-8 uppercase tracking-tighter italic">
        Registrar Venda
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-indigo-600">
            <ShoppingCart className="h-6 w-6" />
            Nova Venda
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase mb-2">
                Selecione o Item
              </label>
              <div className="grid grid-cols-2 gap-3">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedItem(item);
                      setQuantity(1);
                    }}
                    className={`p-4 border-2 rounded-2xl transition-all ${
                      selectedItem?.id === item.id
                        ? 'border-indigo-500 bg-indigo-50 scale-[1.02]'
                        : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="text-3xl mb-1">{item.emoji}</div>
                    <div className="font-bold text-gray-800">{item.name}</div>
                    <div className="text-sm font-black text-indigo-600">{formatarMoeda(item.price)}</div>
                    <div className="text-[10px] text-gray-400 uppercase mt-1">Estoque: {item.quantity}</div>
                  </button>
                ))}
              </div>
            </div>

            {selectedItem && (
              <>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2">
                    Quantidade
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      readOnly
                      className="w-20 text-center font-bold text-xl bg-transparent"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(selectedItem.quantity, quantity + 1))}
                      className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2">
                    Nome do Comprador
                  </label>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                    placeholder="Nome do cliente"
                  />
                </div>

                <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100">
                  <h4 className="font-black text-indigo-900 text-xs uppercase mb-3">Resumo da Venda</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between font-bold text-indigo-800">
                      <span>Total:</span>
                      <span>{formatarMoeda(selectedItem.price * quantity)}</span>
                    </div>
                    <div className="flex justify-between text-green-600 font-black pt-2 border-t border-indigo-200">
                      <span>Sua Comissão (20%):</span>
                      <span>{formatarMoeda(selectedItem.price * quantity * 0.2)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={processSale}
                  disabled={loading || !buyerName.trim()}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl hover:bg-indigo-700 transition-all font-black uppercase tracking-widest shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Processando...' : <><DollarSign className="h-5 w-5" /> Finalizar Venda</>}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-purple-600">
            <Package className="h-6 w-6" />
            Seu Histórico
          </h3>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {sales.length === 0 ? (
              <p className="text-gray-400 text-center py-8 font-medium">Nenhuma venda hoje</p>
            ) : (
              sales.map((sale) => (
                <div key={sale.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{sale.item?.emoji || '📦'}</span>
                      <span className="font-bold text-gray-800">{sale.item?.name || 'Item'}</span>
                      <span className="bg-white px-2 py-0.5 rounded text-[10px] font-black text-gray-400 border border-gray-100">x{sale.quantity}</span>
                    </div>
                    <span className="text-[10px] font-black text-gray-300 uppercase">
                      {new Date(sale.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-gray-500 uppercase">Cliente: {sale.buyer_name}</div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200/50">
                      <span className="text-xs font-bold text-gray-400">TOTAL: {formatarMoeda(sale.total_price)}</span>
                      <span className="text-sm font-black text-green-600">
                        +{formatarMoeda(sale.seller_profit)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}