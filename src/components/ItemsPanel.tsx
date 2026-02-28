import React, { useState, useEffect } from 'react';
import { supabase, Item } from '../lib/supabase';
import { Package, Plus, Edit2, Trash2, Save, X } from 'lucide-react';

// Componente de Painel de Gerenciamento de Itens
export function ItemsPanel() {
  // Estados para controle do painel de itens
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  
  // Formulário de novo item
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    emoji: '📦',
    quantity: '1'
  });

  // Efeito para carregar itens ao montar o componente
  useEffect(() => {
    loadItems();
  }, []);

  // Função para carregar todos os itens do sistema
  const loadItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      if (data) setItems(data);
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para adicionar um novo item ao sistema
  const addItem = async () => {
    if (!newItem.name.trim() || !newItem.price || !newItem.quantity) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const { error } = await supabase.from('items').insert({
        name: newItem.name,
        description: newItem.description,
        price: parseFloat(newItem.price),
        emoji: newItem.emoji,
        quantity: parseInt(newItem.quantity),
      });

      if (error) throw error;

      // Limpa formulário e recarrega lista
      setNewItem({ name: '', description: '', price: '', emoji: '📦', quantity: '1' });
      setShowAddModal(false);
      await loadItems();

      alert('Item adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      alert('Erro ao adicionar item');
    }
  };

  // Função para atualizar um item existente
  const updateItem = async () => {
    if (!editingItem) return;

    try {
      const { error } = await supabase
        .from('items')
        .update({
          name: editingItem.name,
          description: editingItem.description,
          price: editingItem.price,
          emoji: editingItem.emoji,
          quantity: editingItem.quantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      setEditingItem(null);
      await loadItems();
      alert('Item atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      alert('Erro ao atualizar item');
    }
  };

  // Função para excluir um item do sistema
  const deleteItem = async (itemId: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;

    try {
      const { error } = await supabase.from('items').delete().eq('id', itemId);

      if (error) throw error;

      await loadItems();
      alert('Item excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      alert('Erro ao excluir item');
    }
  };

  // Lista de emojis para seleção rápida
  const commonEmojis = ['📦', '🎯', '🎮', '💻', '📱', '🎧', '⌚', '👕', '👟', '🎨', '📚', '🖊️'];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Gerenciar Itens</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Adicionar Item
        </button>
      </div>

      {/* Modal para adicionar novo item */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-screen overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Adicionar Novo Item</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome do item"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Descrição do item (opcional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                <input
                  type="number"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emoji/Ícone</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {commonEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setNewItem({ ...newItem, emoji })}
                      className={`text-2xl p-2 border rounded hover:bg-gray-100 ${
                        newItem.emoji === emoji ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={newItem.emoji}
                  onChange={(e) => setNewItem({ ...newItem, emoji: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="📦"
                  maxLength={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade em Estoque</label>
                <input
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={addItem}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Adicionar
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Itens */}
      <div className="bg-white rounded-xl shadow-md">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-gray-600" />
            <h3 className="text-xl font-semibold">Itens Cadastrados</h3>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando itens...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  {editingItem?.id === item.id ? (
                    // Modo de Edição
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editingItem.name}
                        onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                      <input
                        type="number"
                        value={editingItem.price}
                        onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                      <input
                        type="number"
                        value={editingItem.quantity}
                        onChange={(e) => setEditingItem({ ...editingItem, quantity: parseInt(e.target.value) })}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={updateItem}
                          className="flex-1 bg-green-600 text-white py-1 rounded hover:bg-green-700 flex items-center justify-center gap-1"
                        >
                          <Save className="h-4 w-4" />
                          Salvar
                        </button>
                        <button
                          onClick={() => setEditingItem(null)}
                          className="flex-1 bg-gray-200 text-gray-800 py-1 rounded hover:bg-gray-300 flex items-center justify-center gap-1"
                        >
                          <X className="h-4 w-4" />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Modo de Visualização
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-3xl">{item.emoji}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <h4 className="font-semibold text-gray-800 mb-1">{item.name}</h4>
                      {item.description && (
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      )}
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-green-600">R$ {item.price.toFixed(2)}</span>
                        <span className={`px-2 py-1 rounded ${
                          item.quantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {item.quantity} un.
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}