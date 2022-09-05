import { nodeResolve as resolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { defineConfig } from 'rollup';
import dts from 'rollup-plugin-dts';
import { terser } from 'rollup-plugin-terser';

const input = 'src/index.ts';

const banner = `
/**
 * @larmbox/phone-input ${process.env.npm_package_version}
 * (c) 2022 Larmbox, Jonatan Wackström
 * @license MIT
 */
`.trimStart()

export default defineConfig([
  {
    input,
    output: {
      name: 'phoneInput',
      file: 'dist/index.browser.js',
      format: 'umd',
      sourcemap: false,
      banner
    },
    plugins: [resolve(), typescript()],
  },
  {
    input,
    output: {
      name: 'phoneInput',
      file: 'dist/index.browser.min.js',
      format: 'umd',
      sourcemap: false,
    },
    plugins: [resolve(), typescript(), terser()],
  },
  {
    input,
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
      banner
    },
    plugins: [resolve(), typescript()],
  },
  {
    input,
    output: {
      file: 'dist/index.min.js',
      format: 'cjs',
      sourcemap: true,
    },
    plugins: [resolve(), typescript(), terser()],
  },
  {
    input,
    output: {
      file: 'dist/index.d.ts',
      format: 'es',
      banner
    },
    plugins: [dts()],
  },
]);
