import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/main.ts'],
  format: 'esm',
  platform: 'node',
  external: ['electron', '@deepseek-ai/dsh'],
  clean: true,
  dts: false,
})
