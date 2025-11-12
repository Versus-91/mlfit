import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
    plugins: [vue()],
    // Important: Set the root directory
    root: process.cwd(),

    resolve: {
        alias: {
            '@': resolve(__dirname, 'src')
        }
    },

    server: {
        port: 3000,
        open: true // automatically open browser
    },

    build: {
        outDir: 'dist',
        emptyOutDir: true
    }
})