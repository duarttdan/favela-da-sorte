import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';

interface AuthProps {
  onAuthSuccess: () => void;
}

export function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            throw new Error('Email ou senha incorretos');
          }
          throw signInError;
        }
        
        onAuthSuccess();
      } else {
        // Validações
        if (password.length < 6) {
          throw new Error('A senha deve ter pelo menos 6 caracteres');
        }
        if (username.trim().length < 3) {
          throw new Error('O nome de usuário deve ter pelo menos 3 caracteres');
        }

        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
        });

        if (signUpError) throw signUpError;

        if (user) {
          // Verificar se o usuário já existe na tabela users
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .single();

          if (!existingUser) {
            // Criar registro do usuário na tabela users com role padrão 'member'
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: user.id,
                email: user.email,
                username: username.trim(),
                role: 'member',
                is_online: false,
              });

            if (insertError) throw insertError;
          }
          
          setSuccess('Registro bem-sucedido! Faça login para continuar.');
          setIsLogin(true);
          setEmail('');
          setPassword('');
          setUsername('');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-800 mb-2 tracking-tight">
            {isLogin ? 'Bem-vindo de volta!' : 'Criar Conta'}
          </h1>
          <p className="text-gray-500 font-medium">
            {isLogin ? 'Entre com suas credenciais' : 'Preencha os dados abaixo'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-3 animate-fade-in">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm flex items-start gap-3 animate-fade-in">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span className="font-medium">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="animate-slide-in">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Nome de Usuário
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium"
                  placeholder="Seu nome de usuário"
                  required
                  minLength={3}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            {!isLogin && (
              <p className="mt-2 text-xs text-gray-500 font-medium">
                Mínimo de 6 caracteres
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 px-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transform hover:scale-[1.02]"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                <span>Processando...</span>
              </>
            ) : (
              <>
                <span>{isLogin ? 'Entrar' : 'Criar Conta'}</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={toggleMode}
            className="text-indigo-600 hover:text-indigo-700 font-bold text-sm transition-colors"
          >
            {isLogin ? 'Não tem conta? Registre-se' : 'Já tem conta? Faça login'}
          </button>
        </div>
      </div>
    </div>
  );
}