import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// IMPORTANTE: ajuste `base` para o nome do seu repositório no GitHub Pages.
// Ex.: se o repo for https://github.com/usuario/watchmoney-admin -> base: '/watchmoney-admin/'
// Para deploy em domínio raiz (custom domain) use base: '/'
export default defineConfig({
  plugins: [react()],
  base: '/watchmoney-admin/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    port: 5173,
    host: true,
  },
});
