import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.tsx',
    'src/headless.ts',
    'src/router/index.ts',
    'src/router/tanstackRouterAdapter.tsx',
    'src/router/reactRouterAdapter.tsx',
    'src/router/nextAppRouterAdapter.tsx',
    'src/router/nextPagesRouterAdapter.tsx',
  ],
  format: ['esm', 'cjs'],
  clean: true,
  external: [
    'react-router-dom',
    '@tanstack/react-router',
    'next',
    'next/navigation',
    'next/router',
  ],
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.cjs',
    }
  },
})
