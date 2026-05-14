import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    port: 3000,
    host: true
  },
  resolve: {
    dedupe: ['yjs', 'y-prosemirror']
  },
  optimizeDeps: {
    include: ['yjs', 'y-prosemirror', 'date-fns'],
    exclude: ['@tiptap/pm']
  }
})
