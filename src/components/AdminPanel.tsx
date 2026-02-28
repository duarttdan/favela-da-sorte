import React, { useState, useEffect } from 'react';
import { supabase, User } from '../lib/supabase';
import { Users, UserPlus, UserMinus, Shield } from 'lucide-react';

// Interface para as props do componente AdminPanel
interface AdminPanelProps {
  currentUser: User; // Usuário admin atual
}

// Componente de Painel Administrativo
export function AdminPanel({ currentUser }: AdminPanelProps) {
  // Estados para controle do painel admin
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'member' | 'setter'>('member');

  // Efeito para carregar usuários ao montar o componente
  useEffect(() => {
    loadUsers();
  }, []);

  // Função para carregar todos os usuários do sistema
  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setUsers(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar a role de um usuário (apenas admins podem)
  const updateUserRole = async (userId: string, newRole: 'admin' | 'member' | 'setter') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      
      await loadUsers(); // Recarrega lista de usuários
      setSelectedUser(null); // Limpa seleção
    } catch (error) {
      console.error('Erro ao atualizar role:', error);
    }
  };

  // Função para criar uma nova conta de usuário (admin setter)
  const createUserAccount = async () => {
    if (!newUserEmail) return;

    try {
      // Gera senha temporária aleatória
      const tempPassword = Math.random().toString(36).slice(-8);
      
      // Cria usuário no auth do Supabase
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUserEmail,
        password: tempPassword,
        email_confirm: true
      });

      if (authError) throw authError;

      if (authData.user) {
        // Cria registro na tabela users
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: newUserEmail,
            username: newUserEmail.split('@')[0],
            role: newUserRole,
            is_online: false,
          });

        if (userError) throw userError;

        // Limpa formulário e recarrega lista
        setNewUserEmail('');
        setNewUserRole('member');
        setShowAddUser(false);
        await loadUsers();

        alert(`Usuário criado! Senha temporária: ${tempPassword}`);
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      alert('Erro ao criar usuário');
    }
  };

  // Função para excluir um usuário do sistema (apenas admin)
  const deleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      
      await loadUsers();
      setSelectedUser(null);
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Painel Administrativo</h2>
        {currentUser.role === 'admin' && (
          <button
            onClick={() => setShowAddUser(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <UserPlus className="h-5 w-5" />
            Criar Usuário
          </button>
        )}
      </div>

      {/* Modal para criar novo usuário */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Criar Novo Usuário</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="novo@usuario.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as 'member' | 'setter')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="member">Membro</option>
                  <option value="setter">Setter</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={createUserAccount}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Criar
                </button>
                <button
                  onClick={() => setShowAddUser(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Usuários */}
      <div className="bg-white rounded-xl shadow-md">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-gray-600" />
            <h3 className="text-xl font-semibold">Usuários do Sistema</h3>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando usuários...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedUser?.id === user.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{user.username}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {user.is_online && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                          Online
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'setter' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  </div>

                  {/* Opções de Admin para usuário selecionado */}
                  {selectedUser?.id === user.id && currentUser.role === 'admin' && (
                    <div className="mt-4 pt-4 border-t flex gap-2">
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(user.id, e.target.value as 'admin' | 'member' | 'setter')}
                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="member">Membro</option>
                        <option value="setter">Setter</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center gap-1"
                      >
                        <UserMinus className="h-4 w-4" />
                        Excluir
                      </button>
                    </div>
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