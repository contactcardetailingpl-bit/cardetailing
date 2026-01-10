import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // This allows the browser to access these environment variables safely
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
    'process.env.STRIPE_PUBLISHABLE_KEY': JSON.stringify(process.env.STRIPE_PUBLISHABLE_KEY),
    'process.env.BACKEND_API_URL': JSON.stringify(process.env.BACKEND_API_URL)
  },
  server: {
    port: 3000
  }
});