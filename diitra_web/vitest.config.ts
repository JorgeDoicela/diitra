import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        /**
         * Usa jsdom para simular el DOM del navegador en Node.js.
         * Necesario para tests de React components y hooks con DOM APIs.
         */
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test/setup.ts'],
        css: false,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: [
                'src/hooks/**/*.ts',
                'src/api/**/*.ts',
                'src/utils/**/*.ts',
                'src/pages/**/hooks/**/*.ts',
            ],
            exclude: [
                'src/test/**',
                'src/**/*.d.ts',
            ],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
