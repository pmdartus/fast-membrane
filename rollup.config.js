const typescript = require('rollup-plugin-typescript');

module.exports = {
    input: './src/main.ts',
    output: [
        {
            file: './dist/fast-observable-membrane.js',
            format: 'cjs',
        },
        {
            file: './dist/fast-observable-membrane.mjs',
            format: 'es',
        },
    ],
    plugins: [
        typescript()
    ],
};
