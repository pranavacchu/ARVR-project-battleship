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
          // Keep sprite sheets and 3D models in root with original names
          if (/\.(png|jpe?g|gif|glb)$/i.test(assetInfo.name)) {
            return `[name][extname]`
          }
          // Other assets get hashed names
          return 'assets/[name]-[hash][extname]'
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    },
    sourcemap: true,
    assetsInclude: ['**/*.glb', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif'],
    // Prevent asset inlining
    assetsInlineLimit: 0
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