import { useState, useEffect, useCallback } from 'react';
import { supabase, User, Item } from '../lib/supabase';
import { ShoppingCart, Plus, Minus, DollarSign, Package, AlertCircle, CheckCircle, Copy } from 'lucide-react';

interface SalesPanelProps {
  currentUser: User;
}

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
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(data));
};

export function SalesPanel({ currentUser }: SalesPanelProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [buyerName, setBuyerName] = useState('');
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
    loadSales();
  }, []);

  const loadItems = useCallback(async () => {
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
      setError('Erro ao carregar itens disponíveis');
    }
  }, []);

  const loadSales = useCallback(async () => {
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
  }, [currentUser.id]);

  const copiarParaDiscord = (sale: any) => {
    const mensagem = `
╔═══════════════════════════════╗
║     🎯 VENDA REALIZADA 🎯     ║
╚═══════════════════════════════╝

${sale.item?.emoji || '📦'} **Produto:** ${sale.item?.name || 'Item'}
👤 **Cliente:** ${sale.buyer_name}
📦 **Quantidade:** ${sale.quantity}x
💰 **Valor Total:** ${formatarMoeda(sale.total_price)}
💵 **Comissão:** ${formatarMoeda(sale.seller_profit)}
📅 **Data:** ${formatarData(sale.created_at)}

✅ Vendedor: **${currentUser.username}**
    `.trim();

    navigator.clipboard.writeText(mensagem).then(() => {
      setSuccess('Venda copiada para a área de transferência! Cole no Discord.');
    }).catch(() => {
      setError('Erro ao copiar. Tente novamente.');
    });
  };

  const processSale = async () => {
    if (!selectedItem || quantity < 1 || !buyerName.trim()) {
      setError('Preencha todos os campos e selecione um item');
      return;
    }

    if (quantity > selectedItem.quantity) {
      setError(`Quantidade indisponível. Estoque: ${selectedItem.quantity}`);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const totalPrice = selectedItem.price * quantity;
      const sellerProfit = totalPrice * 0.2;
      const ownerProfit = totalPrice * 0.8;

      const { data: saleData, error: saleError } = await supabase.from('sales').insert({
        item_id: selectedItem.id,
        seller_id: currentUser.id,
        buyer_name: buyerName.trim(),
        quantity,
        total_price: totalPrice,
        seller_profit: sellerProfit,
        owner_profit: ownerProfit,
      }).select(`
        *,
        item:items (
          name,
          emoji
        )
      `).single();

      if (saleError) throw saleError;

      const { error: updateError } = await supabase
        .from('items')
        .update({ quantity: selectedItem.quantity - quantity })
        .eq('id', selectedItem.id);

      if (updateError) throw updateError;

      // Copiar automaticamente para o clipboard
      if (saleData) {
        copiarParaDiscord(saleData);
      }

      setSuccess(`Venda realizada! Você ganhou ${formatarMoeda(sellerProfit)} - Copiado para Discord!`);
      setSelectedItem(null);
      setQuantity(1);
      setBuyerName('');
      
      await Promise.all([loadItems(), loadSales()]);
    } catch (error) {
      console.error('Erro ao processar venda:', error);
      setError('Erro ao processar venda. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 animate-fade-in">
      <h2 className="text-2xl md:text-3xl font-black text-gray-800 mb-6 md:mb-8 uppercase tracking-tighter italic">
        Registrar Venda
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Formulário de Venda */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center gap-2 text-indigo-600">
            <ShoppingCart className="h-5 w-5 md:h-6 md:w-6" />
            Nova Venda
          </h3>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-2 animate-fade-in">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm flex items-start gap-2 animate-fade-in">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium">{success}</span>
            </div>
          )}

          <div className="space-y-4 md:space-y-5">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase mb-2">
                Selecione o Item
              </label>
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                {items.length === 0 ? (
                  <div className="col-span-2 text-center py-8 text-gray-400 font-medium">
                    Nenhum item disponível
                  </div>
                ) : (
                  items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedItem(item);
                        setQuantity(1);
                        setError(null);
                      }}
                      className={`p-3 md:p-4 border-2 rounded-2xl transition-all ${
                        selectedItem?.id === item.id
                          ? 'border-indigo-500 bg-indigo-50 scale-[1.02] shadow-md'
                          : 'border-gray-100 hover:border-gray-200 bg-gray-50 hover:shadow-sm'
                      }`}
                    >
                      <div className="text-2xl md:text-3xl mb-1">{item.emoji}</div>
                      <div className="font-bold text-gray-800 text-sm md:text-base truncate">
                        {item.name}
                      </div>
                      <div className="text-xs md:text-sm font-black text-indigo-600">
                        {formatarMoeda(item.price)}
                      </div>
                      <div className="text-[10px] text-gray-400 uppercase mt-1">
                        Estoque: {item.quantity}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {selectedItem && (
              <div className="space-y-4 animate-slide-in">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2">
                    Quantidade
                  </label>
                  <div className="flex items-center gap-3 justify-center">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors active:scale-95"
                      type="button"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setQuantity(Math.min(selectedItem.quantity, Math.max(1, val)));
                      }}
                      className="w-20 text-center font-bold text-xl bg-transparent border-2 border-gray-200 rounded-xl py-2"
                      min="1"
                      max={selectedItem.quantity}
                    />
                    <button
                      onClick={() => setQuantity(Math.min(selectedItem.quantity, quantity + 1))}
                      className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors active:scale-95"
                      type="button"
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
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium transition-all"
                    placeholder="Nome do cliente"
                  />
                </div>

                <div className="bg-indigo-50 rounded-2xl p-4 md:p-5 border border-indigo-100">
                  <h4 className="font-black text-indigo-900 text-xs uppercase mb-3">
                    Resumo da Venda
                  </h4>
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
                  className="w-full bg-indigo-600 text-white py-3 md:py-4 rounded-2xl hover:bg-indigo-700 transition-all font-black uppercase tracking-widest shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                      <span>Processando...</span>
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-5 w-5" />
                      <span>Finalizar Venda</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Histórico de Vendas */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center gap-2 text-purple-600">
            <Package className="h-5 w-5 md:h-6 md:w-6" />
            Seu Histórico
          </h3>

          <div className="space-y-3 max-h-[500px] md:max-h-[600px] overflow-y-auto pr-2">
            {sales.length === 0 ? (
              <p className="text-gray-400 text-center py-8 font-medium">
                Nenhuma venda registrada
              </p>
            ) : (
              sales.map((sale) => (
                <div
                  key={sale.id}
                  className="bg-gray-50 border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xl md:text-2xl">{sale.item?.emoji || '📦'}</span>
                      <span className="font-bold text-gray-800 text-sm md:text-base truncate">
                        {sale.item?.name || 'Item'}
                      </span>
                      <span className="bg-white px-2 py-0.5 rounded text-[10px] font-black text-gray-400 border border-gray-100">
                        x{sale.quantity}
                      </span>
                    </div>
                    <button
                      onClick={() => copiarParaDiscord(sale)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      title="Copiar para Discord"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-gray-500 uppercase">
                      Cliente: {sale.buyer_name}
                    </div>
                    <div className="text-[10px] font-medium text-gray-400">
                      {formatarData(sale.created_at)}
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200/50">
                      <span className="text-xs font-bold text-gray-400">
                        TOTAL: {formatarMoeda(sale.total_price)}
                      </span>
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