import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolveManualChunk } from './build/chunking'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['three'],
    alias: {
      '@react-three/fiber': '@react-three/fiber/dist/react-three-fiber.esm.js',
      'troika-three-text': 'troika-three-text/dist/troika-three-text.esm.js',
      'troika-three-utils': 'troika-three-utils/dist/troika-three-utils.esm.js',
      'troika-worker-utils': 'troika-worker-utils/dist/troika-worker-utils.esm.js',
    },
  },
  build: {
    modulePreload: {
      resolveDependencies: (_filename, deps, context) => {
        if (context.hostType !== 'js') {
          return deps
        }

        return deps.filter(
          (dep) =>
            !dep.includes('vendor-three-core') &&
            !dep.includes('vendor-r3f') &&
            !dep.includes('vendor-three-extras'),
        )
      },
    },
    rollupOptions: {
      output: {
        manualChunks: resolveManualChunk,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
