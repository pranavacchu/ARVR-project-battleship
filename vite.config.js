import { defineConfig } from 'vite'

export default defineConfig({
  base: '/',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    copyPublicDir: true,
    rollupOptions: {
      input: {
        main: 'index.html',
        start: 'start.html',
        game: 'game.html',
        game2: 'game2.html'
      },
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.glb') || 
              assetInfo.name.endsWith('.png') || 
              assetInfo.name.endsWith('.jpg')) {
            // Place these files directly in dist root
            return `[name][extname]`
          }
          return 'assets/[name]-[hash][extname]'
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    },
    sourcemap: true,
    assetsInclude: ['**/*.glb', '**/*.png', '**/*.jpg', '**/*.jpeg']
  },
  server: {
    proxy: {
      '/ws': 'http://localhost:8000'
    },
    fs: {
      strict: false,
      allow: ['.']
    }
  }
})