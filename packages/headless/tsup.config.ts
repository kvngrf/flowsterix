import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  clean: true,
  external: ['@flowsterix/react'],
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.cjs',
    }
  },
})
