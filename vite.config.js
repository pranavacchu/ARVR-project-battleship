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
          // Keep .glb files in root
          if (assetInfo.name.endsWith('.glb')) {
            return '[name][extname]'
          }
          // Other assets go to assets directory
          return 'assets/[name]-[hash][extname]'
        }
      }
    },
    sourcemap: true,
    assetsInclude: ['**/*.glb'],
    assetsInlineLimit: 0
  },
  server: {
    fs: {
      strict: false,
      allow: ['.']
    }
  }
})