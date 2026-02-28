import { useState, useEffect, useCallback } from 'react';
import { supabase, Item } from '../lib/supabase';
import { Package, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';

const formatarMoeda = (valor: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

export function ItemsPanel() {
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [emoji, setEmoji] = useState('📦');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const commonEmojis = [
    '📦', // Caixa/Pacote
    '🔫', // Arma
    '💰', // Dinheiro
    '❄️', // Drogas/Ice
    '🧪', // Química/Drogas
    '🛡️', // Proteção/Colete
    '🔗', // Corrente/Joia
    '⌚', // Relógio
    '👕', // Roupa
    '💊', // Remédio/Droga
    '🚗', // Carro
    '🏠', // Casa/Propriedade
    '💎', // Diamante/Joia
    '🔪', // Faca/Arma branca
    '🎒', // Mochila
    '📱', // Celular
    '💻', // Notebook
    '🎮', // Console/Game
    '🏍️', // Moto
    '⛽', // Combustível
    '🔋', // Bateria
    '🔧', // Ferramenta
    '🎯', // Alvo/Missão
    '🎰', // Cassino/Jogo
    '🍀', // Sorte
    '💳', // Cartão
    '🎫', // Ticket/Ingresso
    '🗝️', // Chave
    '📡', // Antena/Sinal
    '🎭', // Máscara
    '👑', // Coroa/VIP
    '⭐', // Estrela/Premium
    '🔥', // Fogo/Hot
    '💵', // Nota de dólar
    '💶', // Nota de euro
    '🏆', // Troféu/Prêmio
    '🎁', // Presente/Gift
    '🔐', // Cadeado/Segurança
    '🚨', // Alerta/Polícia
    '🎪', // Circo/Evento
  ];

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('name');
      
      if (error) throw error;
      if (data) setItems(data);
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
      setError('Erro ao carregar itens');
    }
  }, []);

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const priceNum = Number(price);
      const quantityNum = Number(quantity);

      if (priceNum <= 0 || quantityNum <= 0) {
        throw new Error('Preço e quantidade devem ser maiores que zero');
      }

      const { error } = await supabase.from('items').insert([{
        name: name.trim(),
        price: priceNum,
        quantity: quantityNum,
        emoji
      }]);

      if (error) throw error;

      setSuccess(`Item "${name}" adicionado com sucesso!`);
      setName('');
      setPrice('');
      setQuantity('');
      setEmoji('📦');
      await loadItems();
    } catch (error: any) {
      setError(error.message || 'Erro ao adicionar item');
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string, itemName: string) => {
    if (!confirm(`Tem certeza que deseja excluir "${itemName}"?`)) return;

    try {
      const { error } = await supabase.from('items').delete().eq('id', id);
      if (error) throw error;
      
      setSuccess(`Item "${itemName}" removido com sucesso!`);
      await loadItems();
    } catch (error: any) {
      setError(error.message || 'Erro ao excluir item');
    }
  };

  return (
    <div className="p-4 md:p-8 animate-fade-in">
      <h2 className="text-2xl md:text-3xl font-black text-gray-800 mb-6 md:mb-8 uppercase tracking-tighter italic">
        Gerenciar Itens
      </h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-3 animate-fade-in">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm flex items-start gap-3 animate-fade-in">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium">{success}</span>
        </div>
      )}

      {/* Formulário de Cadastro */}
      <div className="bg-white p-4 md:p-6 rounded-3xl shadow-lg border border-gray-100 mb-6 md:mb-8">
        <h3 className="text-lg md:text-xl font-black text-gray-800 mb-4 md:mb-6 flex items-center gap-2">
          <Plus className="text-emerald-500" />
          Cadastrar Novo Produto
        </h3>
        
        <form onSubmit={addItem} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2">
              Nome do Produto
            </label>
            <input
              placeholder="Ex: Glock"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-gray-50 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-medium transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2">
              Preço (R$)
            </label>
            <input
              placeholder="0.00"
              type="number"
              step="0.01"
              min="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full p-3 bg-gray-50 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-medium transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2">
              Estoque Inicial
            </label>
            <input
              placeholder="0"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full p-3 bg-gray-50 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-medium transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2">
              Ícone do Produto
            </label>
            <div className="relative">
              <select
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                className="w-full p-3 bg-gray-50 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-medium transition-all appearance-none cursor-pointer"
                style={{ fontSize: '1.25rem' }}
              >
                {commonEmojis.map((em) => (
                  <option key={em} value={em} style={{ fontSize: '1.25rem' }}>
                    {em}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <Package size={16} />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Selecionado: <span className="text-2xl">{emoji}</span>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="md:col-span-2 lg:col-span-4 bg-emerald-600 text-white font-black py-3 rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                <span>Adicionando...</span>
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                <span>Adicionar à Loja</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Lista de Itens */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {items.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400 font-medium">
            Nenhum item cadastrado ainda
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="bg-white p-5 rounded-2xl shadow-md border border-gray-50 flex justify-between items-center hover:shadow-lg transition-all group"
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl md:text-4xl">{item.emoji}</span>
                <div>
                  <p className="font-black text-gray-800 uppercase text-sm md:text-base">
                    {item.name}
                  </p>
                  <p className="text-emerald-600 font-bold text-sm md:text-base">
                    {formatarMoeda(item.price)}
                  </p>
                  <p className="text-xs text-gray-400 font-bold uppercase">
                    Estoque: {item.quantity}
                  </p>
                </div>
              </div>
              <button
                onClick={() => deleteItem(item.id, item.name)}
                className="text-gray-300 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                title="Excluir item"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}