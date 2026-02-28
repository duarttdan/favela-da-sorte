import { useState, useEffect } from 'react';
import { supabase, Item } from '../lib/supabase';
import { Package, Plus, Trash2, Edit2 } from 'lucide-react';

export function ItemsPanel() {
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [emoji, setEmoji] = useState('📦');

  // Ícones baseados na sua lista (Armas, Lavagem, Drogas)
  const commonEmojis = ['📦', '🔫', '💰', '❄️', '🧪', '🛡️', '🔗', '⌚', '👕'];

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    const { data } = await supabase.from('items').select('*').order('name');
    if (data) setItems(data);
  };

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('items').insert([{ 
      name, price: Number(price), quantity: Number(quantity), emoji 
    }]);
    setName(''); setPrice(''); setQuantity('');
    loadItems();
  };

  const deleteItem = async (id: string) => {
    if (confirm('Excluir item?')) {
      await supabase.from('items').delete().eq('id', id);
      loadItems();
    }
  };

  return (
    <div className="p-8">
      <div className="bg-white p-6 rounded-3xl shadow-2xl border border-gray-100 mb-8">
        <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
          <Plus className="text-emerald-500" /> CADASTRAR PRODUTO (LOJINHA)
        </h3>
        <form onSubmit={addItem} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input placeholder="Nome (Ex: Glock)" value={name} onChange={e => setName(e.target.value)} className="p-3 bg-gray-50 rounded-xl border-none ring-1 ring-gray-200" required />
          <input placeholder="Preço (R$)" type="number" value={price} onChange={e => setPrice(e.target.value)} className="p-3 bg-gray-50 rounded-xl border-none ring-1 ring-gray-200" required />
          <input placeholder="Estoque Inicial" type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="p-3 bg-gray-50 rounded-xl border-none ring-1 ring-gray-200" required />
          <select value={emoji} onChange={e => setEmoji(e.target.value)} className="p-3 bg-gray-50 rounded-xl border-none ring-1 ring-gray-200">
            {commonEmojis.map(em => <option key={em} value={em}>{em}</option>)}
          </select>
          <button className="md:col-span-4 bg-emerald-600 text-white font-black py-3 rounded-xl shadow-lg shadow-emerald-200 hover:scale-[1.02] transition-all">
            ADICIONAR À LOJA
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white p-5 rounded-2xl shadow-md border border-gray-50 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-4xl">{item.emoji}</span>
              <div>
                <p className="font-black text-gray-800 uppercase">{item.name}</p>
                <p className="text-emerald-600 font-bold">R$ {item.price}</p>
                <p className="text-xs text-gray-400 font-bold">ESTOQUE: {item.quantity}</p>
              </div>
            </div>
            <button onClick={() => deleteItem(item.id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={18} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}