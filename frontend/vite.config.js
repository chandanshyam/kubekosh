import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, 'src/components'),
      '@hooks':      path.resolve(__dirname, 'src/hooks'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:4000'
    }
  },
  build: {
    outDir: 'dist'
  },
  define: {
    // Fallback to 'dev' when VITE_APP_VERSION is not injected at build time
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(
      process.env.VITE_APP_VERSION || 'dev'
    )
  }
})
