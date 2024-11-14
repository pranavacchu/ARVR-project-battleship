import { defineConfig } from 'vite'

export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        start: 'start.html',
        game: 'game.html',
        game2: 'game2.html'
      },
      output: {
        assetFileNames: (assetInfo) => {
          // Keep all files in root with original names
          if (assetInfo.name.endsWith('.glb') || 
              assetInfo.name.endsWith('.png') || 
              assetInfo.name.endsWith('.jpg') || 
              assetInfo.name.endsWith('.jpeg')) {
            return '[name][extname]'
          }
          // Other assets
          return 'assets/[name]-[hash][extname]'
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    },
    sourcemap: true,
    assetsInclude: ['**/*.glb', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif']
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