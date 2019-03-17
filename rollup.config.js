'use strict';

const { terser } = require('rollup-plugin-terser');
const replace = require('rollup-plugin-replace');
const typescript = require('rollup-plugin-typescript');

const name = 'FastMembrane';

module.exports = [
    {
        input: './src/main.ts',
        output: [
            {
                file: './dist/commonjs/fast-membrane.js',
                format: 'cjs',
            },
            {
                file: './dist/modules/fast-membrane.mjs',
                format: 'es',
            },
            {
                file: './dist/umd/fast-membrane.js',
                format: 'umd',
                name,
            },
        ],
        plugins: [typescript()],
    },
    {
        input: './src/main.ts',
        output: [
            {
                file: './dist/umd/fast-membrane.min.js',
                format: 'umd',
                name,
            },
        ],
        plugins: [
            typescript(),
            replace({
                'process.env.NODE_ENV': JSON.stringify('production'),
            }),
            terser(),
        ],
    },
];
