import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import postcss from 'rollup-plugin-postcss';
import cssnext from 'postcss-cssnext';

// 插件列表
const plugins = [
  postcss({
    extensions: ['.less'],
    extract: true,
    plugins: [cssnext()],
    minimize: true,
  }),
  resolve(),
  commonjs(),
  typescript(),
];

// 生产环境加入代码压缩功能
if (process.env.NODE_ENV === 'production') plugins.push(terser());

export default [
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'umd',
      name: 'VEditor',
      inlineDynamicImports: true,
    },
    plugins
  },
]