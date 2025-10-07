import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      outDir: 'output',
    }),
  ],
  build: {
    outDir: 'output',
    lib: {
      entry: 'source/index.ts',
      name: 'VitePluginI18nextChecker',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'js'}`,
    },
    rollupOptions: {
      external: ['vite', 'fs', 'path', 'glob'],
      output: {
        globals: {
          vite: 'vite',
        },
      },
    },
    target: 'node18',
  },
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['source/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.spec.ts', 'test/**'],
    },
  },
})
