import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Запити /api/* проксуються на C#-бекенд (ASP.NET Core), тому CORS у розробці не потрібен.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:5000' } },
});
