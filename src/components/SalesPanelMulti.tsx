import { useState, useEffect } from 'react';
import { supabase, User, Item } from '../lib/supabase';
import { Plus, Minus, DollarSign, Package, Copy, Trash2, CheckCircle } from 'lucide-react';

interface CartItem {
  item: Item;
  quantity: number;
}

const formatarMoeda = (valor: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
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

export function SalesPanelMulti({ currentUser }: { currentUser: User }) {
  const [items, setItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [buyerName, setBuyerName] = useState('');
  const [buyerId, setBuyerId] = useState(''); // Novo: ID do cliente
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [copyFormat, setCopyFormat] = useState<'discord' | 'whatsapp' | 'simple'>('discord');

  useEffect(() => {
    loadItems();
    loadSales();
  }, []);

  const loadItems = async () => {
    const { data } = await supabase.from('items').select('*').gt('quantity', 0).order('name');
    if (data) setItems(data);
  };

  const loadSales = async () => {
    const { data } = await supabase
      .from('sales')
      .select('*, item:items(name, emoji)')
      .eq('seller_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setSales(data);
  };

  const addToCart = (item: Item) => {
    const existing = cart.find(c => c.item.id === item.id);
    if (existing) {
      if (existing.quantity < item.quantity) {
        setCart(cart.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
    } else {
      setCart([...cart, { item, quantity: 1 }]);
    }
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.item.id === itemId) {
        const newQty = Math.max(1, Math.min(c.item.quantity, c.quantity + delta));
        return { ...c, quantity: newQty };
      }
      return c;
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(c => c.item.id !== itemId));
  };

  const getTotal = () => {
    return cart.reduce((sum, c) => sum + (c.item.price * c.quantity), 0);
  };

  const getCommission = () => {
    return getTotal() * 0.2;
  };

  const generateMessage = () => {
    const total = getTotal();
    const commission = getCommission();
    const ownerProfit = total - commission;
    const clientInfo = buyerName.trim() || 'Cliente Anônimo';
    const idInfo = buyerId.trim() ? buyerId : '';
    const vendedor = currentUser.username.toUpperCase();

    if (copyFormat === 'discord') {
      return `
╔═══════════════════════════════════════╗
║        💰 VENDA REALIZADA 💰           ║
╚═══════════════════════════════════════╝

👤 **VENDEDOR:** ${vendedor}
💼 **CLIENTE:** ${clientInfo}
${idInfo ? `🆔 **ID CLIENTE:** @cria ${idInfo}` : ''}

📦 **ITENS VENDIDOS:**
${cart.map(c => `   ${c.item.emoji} **${c.item.name}** x${c.quantity} - ${formatarMoeda(c.item.price * c.quantity)}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 **VALOR TOTAL:** ${formatarMoeda(total)}
💵 **COMISSÃO VENDEDOR:** ${formatarMoeda(commission)} (20%)
💎 **LUCRO ORGANIZAÇÃO:** ${formatarMoeda(ownerProfit)} (80%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 **DATA:** ${new Date().toLocaleString('pt-BR')}
✅ **STATUS:** Confirmado

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💸 **REPASSAR PARA VENDEDOR:** ${formatarMoeda(commission)}
💸 **REPASSAR PARA ORGANIZAÇÃO:** ${formatarMoeda(ownerProfit)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔑 **PIX:** @cria 293 CHATÃO LÍDER

🎰 **FAVELA DA SORTE** 🍀
      `.trim();
    } else if (copyFormat === 'whatsapp') {
      return `
💰 *VENDA REALIZADA* 💰

👤 *VENDEDOR:* ${vendedor}
💼 *CLIENTE:* ${clientInfo}
${idInfo ? `🆔 *ID CLIENTE:* @cria ${idInfo}` : ''}

📦 *ITENS:*
${cart.map(c => `• ${c.item.emoji} ${c.item.name} x${c.quantity} - ${formatarMoeda(c.item.price * c.quantity)}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━
💰 *TOTAL:* ${formatarMoeda(total)}
💵 *COMISSÃO:* ${formatarMoeda(commission)}
💎 *LUCRO ORG:* ${formatarMoeda(ownerProfit)}
━━━━━━━━━━━━━━━━━━━━━━━━

💸 *REPASSAR VENDEDOR:* ${formatarMoeda(commission)}
💸 *REPASSAR ORG:* ${formatarMoeda(ownerProfit)}

🔑 *PIX:* @cria 293 CHATÃO LÍDER

🎰 FAVELA DA SORTE 🍀
      `.trim();
    } else {
      return `
VENDA REALIZADA

VENDEDOR: ${vendedor}
CLIENTE: ${clientInfo}
${idInfo ? `ID CLIENTE: @cria ${idInfo}` : ''}

ITENS: ${cart.map(c => `${c.item.name} x${c.quantity}`).join(', ')}

TOTAL: ${formatarMoeda(total)}
COMISSÃO: ${formatarMoeda(commission)}
LUCRO ORG: ${formatarMoeda(ownerProfit)}

REPASSAR VENDEDOR: ${formatarMoeda(commission)}
REPASSAR ORG: ${formatarMoeda(ownerProfit)}

PIX: @cria 293 CHATÃO LÍDER
      `.trim();
    }
  };

  const processSale = async () => {
    if (cart.length === 0) {
      alert('Adicione itens ao carrinho');
      return;
    }

    setLoading(true);
    try {
      for (const cartItem of cart) {
        const totalPrice = cartItem.item.price * cartItem.quantity;
        const sellerProfit = totalPrice * 0.2;
        const ownerProfit = totalPrice * 0.8;

        await supabase.from('sales').insert({
          item_id: cartItem.item.id,
          seller_id: currentUser.id,
          buyer_name: buyerName.trim() || 'Cliente Anônimo',
          quantity: cartItem.quantity,
          total_price: totalPrice,
          seller_profit: sellerProfit,
          owner_profit: ownerProfit,
        });

        await supabase
          .from('items')
          .update({ quantity: cartItem.item.quantity - cartItem.quantity })
          .eq('id', cartItem.item.id);
      }

      // Gerar mensagem
      const message = generateMessage();

      // Copiar para clipboard
      navigator.clipboard.writeText(message);

      // Tentar enviar para Discord
      try {
        const { data: settings } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'discord_webhook')
          .single();

        if (settings?.value && settings.value.trim()) {
          const webhookUrl = settings.value.trim();
          
          // Enviar para Discord
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: message,
              username: 'Favela da Sorte 🍀',
              avatar_url: 'https://cdn-icons-png.flaticon.com/512/3588/3588592.png'
            })
          });

          setSuccess(`💰 ${formatarMoeda(getCommission())} de comissão - Enviado para Discord!`);
        } else {
          setSuccess(`💰 ${formatarMoeda(getCommission())} de comissão - Copiado!`);
        }
      } catch (discordError) {
        console.error('Erro ao enviar para Discord:', discordError);
        setSuccess(`💰 ${formatarMoeda(getCommission())} de comissão - Copiado!`);
      }
      
      // Limpar mensagem de sucesso após 5 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
      
      setCart([]);
      setBuyerName('');
      setBuyerId('');
      await Promise.all([loadItems(), loadSales()]);
    } catch (error) {
      console.error(error);
      alert('Erro ao processar venda');
    } finally {
      setLoading(false);
    }
  };

  const copySale = (sale: any) => {
    const msg = `
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

    navigator.clipboard.writeText(msg);
    setSuccess('Venda copiada!');
  };

  return (
    <div className="p-4 md:p-8">
      <h2 className="text-3xl font-black text-gray-800 mb-8 uppercase">🛒 Vendas - Múltiplos Itens</h2>

      {success && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="bg-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-md">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8" />
            </div>
            <div>
              <p className="font-black text-lg">✅ Venda Realizada!</p>
              <p className="text-sm opacity-90">{success}</p>
              <p className="text-xs opacity-75 mt-1">📋 Mensagem copiada para área de transferência</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Seleção de Itens */}
        <div className="bg-white rounded-2xl p-6 border">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-600">
            <Package className="h-6 w-6" />
            Selecionar Itens
          </h3>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className="p-4 border-2 border-gray-100 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all"
              >
                <div className="text-3xl mb-1">{item.emoji}</div>
                <div className="font-bold text-gray-800 text-sm">{item.name}</div>
                <div className="text-sm font-black text-indigo-600">{formatarMoeda(item.price)}</div>
                <div className="text-[10px] text-gray-400 uppercase mt-1">Estoque: {item.quantity}</div>
              </button>
            ))}
          </div>

          {/* Carrinho */}
          <div className="border-t pt-4">
            <h4 className="font-bold text-gray-700 mb-3">🛒 Carrinho ({cart.length} itens)</h4>
            {cart.length === 0 ? (
              <p className="text-gray-400 text-center py-4">Carrinho vazio</p>
            ) : (
              <div className="space-y-2">
                {cart.map((c) => (
                  <div key={c.item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{c.item.emoji}</span>
                      <div>
                        <p className="font-bold text-sm">{c.item.name}</p>
                        <p className="text-xs text-gray-500">{formatarMoeda(c.item.price)} cada</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(c.item.id, -1)} className="p-1 hover:bg-gray-200 rounded">
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="font-bold w-8 text-center">{c.quantity}</span>
                      <button onClick={() => updateQuantity(c.item.id, 1)} className="p-1 hover:bg-gray-200 rounded">
                        <Plus className="h-4 w-4" />
                      </button>
                      <button onClick={() => removeFromCart(c.item.id)} className="p-1 hover:bg-red-100 rounded ml-2">
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <>
              <div className="mt-4">
                <label className="block text-xs font-black text-gray-400 uppercase mb-2">Nome do Cliente (Opcional)</label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Nome do cliente (deixe vazio para anônimo)"
                />
              </div>

              <div className="mt-4">
                <label className="block text-xs font-black text-gray-400 uppercase mb-2">ID do Cliente (Opcional)</label>
                <input
                  type="text"
                  value={buyerId}
                  onChange={(e) => setBuyerId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="@cria 293 (ID para rastreamento)"
                />
              </div>

              <div className="mt-4">
                <label className="block text-xs font-black text-gray-400 uppercase mb-2">Formato de Cópia</label>
                <div className="flex gap-2">
                  {['discord', 'whatsapp', 'simple'].map((format) => (
                    <button
                      key={format}
                      onClick={() => setCopyFormat(format as any)}
                      className={`flex-1 py-2 rounded-xl font-bold text-xs uppercase ${
                        copyFormat === format ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                <div className="flex justify-between font-bold text-indigo-800 mb-2">
                  <span>Total:</span>
                  <span>{formatarMoeda(getTotal())}</span>
                </div>
                <div className="flex justify-between text-green-600 font-black">
                  <span>Sua Comissão (20%):</span>
                  <span>{formatarMoeda(getCommission())}</span>
                </div>
              </div>

              <button
                onClick={processSale}
                disabled={loading}
                className="w-full mt-4 bg-indigo-600 text-white py-4 rounded-2xl hover:bg-indigo-700 font-black uppercase flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Processando...' : <><DollarSign className="h-5 w-5" /> Finalizar Venda</>}
              </button>
            </>
          )}
        </div>

        {/* Histórico */}
        <div className="bg-white rounded-2xl p-6 border">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-purple-600">
            <Package className="h-6 w-6" />
            Histórico
          </h3>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {sales.map((sale) => (
              <div key={sale.id} className="bg-gray-50 border rounded-2xl p-4 group hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{sale.item?.emoji}</span>
                    <span className="font-bold">{sale.item?.name}</span>
                    <span className="bg-white px-2 py-0.5 rounded text-[10px] font-black">x{sale.quantity}</span>
                  </div>
                  <button
                    onClick={() => copySale(sale)}
                    className="p-2 hover:bg-indigo-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Copy className="h-4 w-4 text-indigo-600" />
                  </button>
                </div>
                <div className="text-xs text-gray-500">Cliente: {sale.buyer_name}</div>
                <div className="text-[10px] text-gray-400">{formatarData(sale.created_at)}</div>
                <div className="flex justify-between mt-2 pt-2 border-t">
                  <span className="text-xs font-bold text-gray-400">TOTAL: {formatarMoeda(sale.total_price)}</span>
                  <span className="text-sm font-black text-green-600">+{formatarMoeda(sale.seller_profit)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
