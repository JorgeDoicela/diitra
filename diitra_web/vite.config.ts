import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  return {
    base: command === 'serve' ? '/' : '/diitra/',
    plugins: [
      react(),
      tailwindcss()
    ],
    server: {
      port: 3000,
      host: true,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:5175',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    resolve: {
      dedupe: ['yjs', 'y-prosemirror']
    },
    optimizeDeps: {
      include: ['yjs', 'y-prosemirror', 'date-fns'],
      exclude: ['@tiptap/pm']
    },
    build: {
      // Aumenta el límite de advertencia de chunk (kB)
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // React core — siempre se necesita
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
              return 'vendor-react';
            }
            // Router
            if (id.includes('node_modules/react-router')) {
              return 'vendor-router';
            }
            // Editor colaborativo — muy pesado, carga solo en workspace
            if (
              id.includes('node_modules/@tiptap/') ||
              id.includes('node_modules/yjs') ||
              id.includes('node_modules/y-prosemirror') ||
              id.includes('node_modules/y-protocols') ||
              id.includes('node_modules/lib0') ||
              id.includes('node_modules/prosemirror')
            ) {
              return 'vendor-editor';
            }
            // SignalR — carga solo cuando hay colaboración activa
            if (id.includes('node_modules/@microsoft/signalr')) {
              return 'vendor-signalr';
            }
            // Exportación Excel — carga solo en páginas con exportación
            if (id.includes('node_modules/xlsx')) {
              return 'vendor-xlsx';
            }
            // Utilidades comunes
            if (
              id.includes('node_modules/date-fns') ||
              id.includes('node_modules/axios') ||
              id.includes('node_modules/lucide-react') ||
              id.includes('node_modules/zod') ||
              id.includes('node_modules/react-hook-form') ||
              id.includes('node_modules/@hookform') ||
              id.includes('node_modules/dompurify')
            ) {
              return 'vendor-utils';
            }
          }
        }
      }
    }
  }
})
