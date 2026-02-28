import React, { useState, useEffect } from 'react';
import { supabase, User, Item, Sale } from '../lib/supabase';
import { ShoppingCart, Plus, Minus, DollarSign, Package } from 'lucide-react';

// Interface para as props do componente SalesPanel
interface SalesPanelProps {
  currentUser: User; // Usuário que está realizando a venda
}

// Componente de Painel de Vendas
export function SalesPanel({ currentUser }: SalesPanelProps) {
  // Estados para controle do painel de vendas
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [buyerName, setBuyerName] = useState('');
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);

  // Efeito para carregar itens e vendas ao montar o componente
  useEffect(() => {
    loadItems();
    loadSales();
  }, []);

  // Função para carregar itens disponíveis para venda
  const loadItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .gt('quantity', 0) // Apenas itens com estoque > 0
        .order('name', { ascending: true });

      if (error) throw error;
      if (data) setItems(data);
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
    }
  };

  // Função para carregar histórico de vendas do usuário
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

  // Função para processar uma venda
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
      // Calcula valores da venda com divisão 20%/80%
      const totalPrice = selectedItem.price * quantity;
      const sellerProfit = totalPrice * 0.2; // 20% para vendedor
      const ownerProfit = totalPrice * 0.8; // 80% para dono

      // Registra a venda no banco de dados
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

      // Atualiza estoque do item
      const { error: updateError } = await supabase
        .from('items')
        .update({ quantity: selectedItem.quantity - quantity })
        .eq('id', selectedItem.id);

      if (updateError) throw updateError;

      // Limpa formulário e recarrega dados
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
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Registrar Venda</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulário de Venda */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-blue-600" />
            Nova Venda
          </h3>

          <div className="space-y-4">
            {/* Seleção de Item */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className={`p-3 border-2 rounded-lg transition-colors ${
                      selectedItem?.id === item.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{item.emoji}</div>
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-gray-500">R$ {item.price.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">Estoque: {item.quantity}</div>
                  </button>
                ))}
              </div>
            </div>

            {selectedItem && (
              <>
                {/* Quantidade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantidade
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center px-3 py-2 border border-gray-300 rounded-lg"
                      min="1"
                      max={selectedItem.quantity}
                    />
                    <button
                      onClick={() => setQuantity(Math.min(selectedItem.quantity, quantity + 1))}
                      className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Nome do Comprador */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Comprador
                  </label>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nome do cliente"
                  />
                </div>

                {/* Resumo da Venda */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Resumo da Venda</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Item:</span>
                      <span>{selectedItem.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quantidade:</span>
                      <span>{quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span>R$ {(selectedItem.price * quantity).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-600 font-medium pt-2 border-t">
                      <span>Seu Lucro (20%):</span>
                      <span>R$ {(selectedItem.price * quantity * 0.2).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Botão de Processar Venda */}
                <button
                  onClick={processSale}
                  disabled={loading || !buyerName.trim()}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processando...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-5 w-5" />
                      Processar Venda
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Histórico de Vendas */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Package className="h-6 w-6 text-purple-600" />
            Suas Últimas Vendas
          </h3>

          {sales.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhuma venda registrada ainda</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sales.map((sale) => (
                <div key={sale.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{sale.item?.emoji || '📦'}</span>
                      <span className="font-medium">{sale.item?.name || 'Item'}</span>
                      <span className="text-sm text-gray-500">x{sale.quantity}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(sale.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>Comprador: {sale.buyer_name}</div>
                    <div className="flex justify-between mt-1">
                      <span>Total: R$ {sale.total_price.toFixed(2)}</span>
                      <span className="text-green-600 font-medium">
                        Seu lucro: R$ {sale.seller_profit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}