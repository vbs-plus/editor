import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
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
    extract: 'index.css'
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
    output: [
      {
        file: 'dist/index.esm.js', // package.json 中 "module": "dist/index.esm.js"
        format: 'esm', // es module 形式的包， 用来import 导入， 可以tree shaking
        inlineDynamicImports: true,
      },
      {
        file: 'dist/index.umd.js',
        name: 'VEditor',
        format: 'umd', // umd 兼容形式的包， 可以直接应用于网页 script.
        inlineDynamicImports: true,
      }
    ],
    plugins
  },
]