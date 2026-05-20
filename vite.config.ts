import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  assetsInclude: ['**/*.lottie'],
  server: {
    port: parseInt(process.env.PORT || '8080'),
    host: true,
    watch: {
      // Prevent watching node_modules — huge perf win on Windows
      ignored: ['**/node_modules/**', '**/.git/**'],
    },
  },
  optimizeDeps: {
    // Pre-bundle heavy deps once so Vite doesn't re-scan on every start
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      '@tanstack/react-query',
      'zustand',
      'firebase/app',
      'firebase/auth',
      'clsx',
      'tailwind-merge',
      'lucide-react',
      'zod',
    ],
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: false,
    // Raise chunk warning threshold — we're doing intentional lazy splitting
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — always needed, cache indefinitely
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],

          // Firebase — large but shared across auth flows
          'vendor-firebase': ['firebase/app', 'firebase/auth'],

          // Animation library — used by many pages but not critical for first load
          'vendor-motion': ['framer-motion'],

          // Map — only used on NearYouMapPage
          'vendor-leaflet': ['leaflet', 'react-leaflet'],

          // Data/state utilities
          'vendor-query': ['@tanstack/react-query', 'zustand'],

          // UI primitives
          'vendor-radix': [
            '@radix-ui/react-avatar',
            '@radix-ui/react-dialog',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
          ],
        },
      },
    },
    terserOptions: {
      compress: {
        drop_console: true,   // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.info', 'console.debug', 'console.warn'],
      },
    },
  },
})
