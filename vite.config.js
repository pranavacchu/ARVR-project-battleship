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
          // Other assets with hash
          return '[name]-[hash][extname]'
        },
        chunkFileNames: '[name]-[hash].js',
        entryFileNames: '[name]-[hash].js'
      }
    },
    sourcemap: true,
    // Disable inlining for GLB files
    assetsInlineLimit: 0,
    // Ensure GLB files are recognized
    assetsInclude: ['**/*.glb']
  }
})