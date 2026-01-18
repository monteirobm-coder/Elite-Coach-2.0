import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega variáveis do ambiente atual
  // Fix: Property 'cwd' does not exist on type 'Process' - cast process to any to access Node.js cwd() method
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Prioriza variáveis do sistema (Vercel) sobre o arquivo .env
  const apiKey = env.API_KEY || '';
  const supabaseUrl = env.SUPABASE_URL || '';
  const supabaseKey = env.SUPABASE_ANON_KEY || '';

  return {
    plugins: [react()],
    define: {
      // Define 'process.env' para compatibilidade total no browser
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(supabaseKey),
      // Fallback para evitar erros de referência em algumas bibliotecas
      'process.env': {
        API_KEY: apiKey,
        SUPABASE_URL: supabaseUrl,
        SUPABASE_ANON_KEY: supabaseKey
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});