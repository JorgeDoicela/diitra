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
          target: 'http://localhost:5175',
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
    }
  }
})
