import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.tsx',
    'src/router/index.ts',
    'src/router/tanstackRouterAdapter.tsx',
    'src/router/reactRouterAdapter.tsx',
    'src/router/nextAppRouterAdapter.tsx',
    'src/router/nextPagesRouterAdapter.tsx',
    'src/devtools/index.tsx',
  ],
  format: ['esm', 'cjs'],
  splitting: true, // Share DevToolsContext between main and devtools bundles
  clean: true,
  external: [
    'react',
    'react-dom',
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
