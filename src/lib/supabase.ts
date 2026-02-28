import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase - MODIFIQUE COM SEUS DADOS
const supabaseUrl = 'https://dfxoajrvbgvjzqrpmggr.supabase.co'; // MODIFIQUE: Substitua pelo URL do seu projeto Supabase
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmeG9hanJ2Ymd2anpxcnBtZ2dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNDgyMDgsImV4cCI6MjA4NzcyNDIwOH0.KK-7lbQcD_OztTDv84xx2WqODEsjT8XETmZfGzXk85U'; // MODIFIQUE: Substitua pela sua chave API pública do Supabase

// Criação do cliente Supabase para interação com o banco de dados
export const supabase = createClient(supabaseUrl, supabaseKey);

// Função para verificar se o usuário está autenticado
export const checkAuth = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Função para fazer logout do sistema
export const signOut = async () => {
  await supabase.auth.signOut();
};

// Tipo para usuários do sistema
export interface User {
  id: string;
  email: string;
  role: 'dono' | 'gerente' | 'sub-lider' | 'admin' | 'membro';
  username: string;
  is_online: boolean;
  created_at: string;
}

// Tipo para itens de venda
export interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  emoji: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

// Tipo para vendas
export interface Sale {
  id: string;
  item_id: string;
  seller_id: string;
  buyer_name: string;
  quantity: number;
  total_price: number;
  seller_profit: number; // 20% do valor
  owner_profit: number; // 80% do valor
  created_at: string;
}