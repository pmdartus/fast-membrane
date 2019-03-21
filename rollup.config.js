'use strict';

const { terser } = require('rollup-plugin-terser');
const replace = require('rollup-plugin-replace');
const typescript = require('rollup-plugin-typescript');

const name = 'FastMembrane';

function rollupConfig({ membraneType }) {
    const input = `./src/${membraneType}/main.ts`;
    return [
        {
            input,
            output: [
                {
                    file: `./dist/commonjs/${membraneType}/fast-membrane.js`,
                    format: 'cjs',
                },
                {
                    file: `./dist/modules/${membraneType}/fast-membrane.mjs`,
                    format: 'es',
                },
                {
                    file: `./dist/umd/${membraneType}/fast-membrane.js`,
                    format: 'umd',
                    name,
                },
            ],
            plugins: [typescript()],
        },
        {
            input,
            output: [
                {
                    file: `./dist/umd/${membraneType}/fast-membrane.min.js`,
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
    ]
}

module.exports = [
    ...rollupConfig({ membraneType: 'symbol' }),
    ...rollupConfig({ membraneType: 'weakmap' }),
];
