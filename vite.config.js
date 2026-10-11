import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'
export default defineConfig({
  plugins: [vue()],
  // Element UI's CommonJS modules and our ESM entry must share one Vue runtime.
  // Two Vue 2 constructors leave table columns and select options unobserved.
  resolve: {
    alias: [{ find: /^vue$/, replacement: 'vue/dist/vue.runtime.esm.js' }],
    dedupe: ['vue']
  },
  server: { port: 5175, proxy: { '/api': 'http://127.0.0.1:4313' } },
  build: { chunkSizeWarningLimit: 800, rollupOptions: { output: { manualChunks(id) { if (id.includes('/echarts/') || id.includes('/zrender/')) return 'charts'; if (id.includes('/node_modules/')) return 'vendor'; } } } }
})
