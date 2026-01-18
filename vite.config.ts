import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega variáveis do arquivo .env se existir
  const env = loadEnv(mode, '.', '');
  
  // Prioridade: process.env (Vercel/Sistema) > env (.env file) > string vazia
  const apiKey = process.env.API_KEY || env.API_KEY || '';
  const supabaseUrl = process.env.SUPABASE_URL || env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || '';

  return {
    plugins: [react()],
    define: {
      // Define 'process.env' como objeto vazio para libs que acessam 'process.env' diretamente
      // isso previne o erro "Uncaught ReferenceError: process is not defined"
      'process.env': {},
      
      // Substituição direta das chaves específicas
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(supabaseKey),
    }
  };
});