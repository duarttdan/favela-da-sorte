import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

export function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
        setUser(data);
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await checkUser();
      } else {
        const { data: { user: newUser }, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (newUser) {
          await supabase.from('users').insert({
            id: newUser.id,
            email: newUser.email,
            username: email.split('@')[0],
            role: 'member',
            is_online: false,
          });
          alert('Conta criada! Faça login.');
          setIsLogin(true);
        }
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-white mx-auto mb-4"></div>
          <p className="text-xl font-bold">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-6">
            {isLogin ? 'Login' : 'Registrar'}
          </h1>

          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg"
              required
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-lg"
              required
            />
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700"
            >
              {isLogin ? 'Entrar' : 'Criar Conta'}
            </button>
          </form>

          <button
            onClick={() => setIsLogin(!isLogin)}
            className="w-full mt-4 text-indigo-600 font-medium"
          >
            {isLogin ? 'Não tem conta? Registre-se' : 'Já tem conta? Faça login'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl p-6 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Olá, {user.username}!</h1>
            <p className="text-gray-600">Role: {user.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700"
          >
            Sair
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">Sistema Funcionando! ✅</h2>
          <p className="text-gray-600">
            Seu sistema está online e funcionando. Esta é a versão básica.
          </p>
          <p className="text-gray-600 mt-2">
            Para ativar todas as funcionalidades, execute o SQL no Supabase.
          </p>
        </div>
      </div>
    </div>
  );
}
