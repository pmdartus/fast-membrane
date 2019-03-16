const typescript = require('rollup-plugin-typescript');

module.exports = {
    input: './src/main.ts',
    output: [
        {
            file: './dist/fast-membrane.js',
            format: 'cjs',
        },
        {
            file: './dist/fast-membrane.mjs',
            format: 'es',
        },
    ],
    plugins: [
        typescript()
    ],
};
