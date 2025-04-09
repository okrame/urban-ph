import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Set the base path for GitHub Pages
  base: '/urban-ph/',
  build: {
    outDir: 'dist',
    // Assicurati che le risorse vengano generate con i percorsi corretti
    assetsDir: 'assets',
    // Utilizza un hash più piccolo per i nomi dei file
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
})