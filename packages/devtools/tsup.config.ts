import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['esm', 'cjs'],
  clean: true,
  dts: false,
  // Bundle @dnd-kit but externalize React so hooks use host's React
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
    'motion',
    'motion/react',
    '@flowsterix/core',
  ],
  // Ensure @dnd-kit is bundled (not external)
  noExternal: [
    '@dnd-kit/core',
    '@dnd-kit/sortable',
    '@dnd-kit/utilities',
  ],
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.cjs',
    }
  },
})
